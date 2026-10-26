'use client'
import { useCallback, useEffect, useState } from 'react'
import { sb } from '@/lib/supabase/client'
import { EmptyState } from '@/components/admin/Widgets'

export default function Stock() {
  const [products, setProducts] = useState<any[]>([])
  const [threshold, setThreshold] = useState(5)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [stockOn, setStockOn] = useState(true)
  const [modeMsg, setModeMsg] = useState('')

  const load = useCallback(async () => {
    const c = sb()
    const [{ data: p }, { data: s }, { data: m }] = await Promise.all([
      c.from('products').select('*').order('name'),
      c.from('settings').select('*').eq('key', 'low_stock_threshold').maybeSingle(),
      c.from('settings').select('value').eq('key', 'stock_management').maybeSingle(),
    ])
    setProducts(p || []); if (s) setThreshold(+s.value)
    setStockOn(!(m?.value === false || m?.value === 'false')); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  // Full bottle stock and 10ml stock are always derived from the same physical stock_ml pool, so
  // status/low-stock is judged on whichever ENABLED format is worse off for that product.
  const statusOf = (p: any) => {
    if (!stockOn) return p.is_available === false ? 'UNAVAILABLE' : 'AVAILABLE' // mode manuel : la quantité n'entre pas en compte
    const checks = [p.full_enabled ? p.full_stock : null, p.sample_10ml ? p.stock_10ml : null].filter((v): v is number => v != null)
    if (!checks.length) return 'IN_STOCK'
    const worst = Math.min(...checks)
    return worst <= 0 ? 'OUT_OF_STOCK' : worst <= threshold ? 'LOW_STOCK' : 'IN_STOCK'
  }
  const statusLabel: Record<string, string> = { IN_STOCK: 'En stock', LOW_STOCK: 'Stock faible', OUT_OF_STOCK: 'Rupture', AVAILABLE: 'Disponible', UNAVAILABLE: 'Indisponible' }
  const statusColor: Record<string, string> = { IN_STOCK: 'bg-emerald-600', LOW_STOCK: 'bg-amber-500', OUT_OF_STOCK: 'bg-red-600', AVAILABLE: 'bg-emerald-600', UNAVAILABLE: 'bg-red-600' }

  const filtered = products.filter(p => (!statusFilter || statusOf(p) === statusFilter) && `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase()))

  async function setMode(on: boolean) {
    if (on === stockOn) return
    if (!confirm(on ? 'Activer la gestion automatique du stock ? Les quantités seront de nouveau vérifiées et décrémentées à chaque commande.' : 'Désactiver la gestion du stock ? Les commandes ne modifieront plus aucune quantité ; seule la disponibilité (Disponible / Indisponible) de chaque produit comptera.')) return
    setModeMsg('')
    const { error } = await sb().from('settings').upsert({ key: 'stock_management', value: on })
    if (error) return setModeMsg(`Erreur : ${error.message}`)
    setStockOn(on); setStatusFilter(''); setModeMsg(on ? 'Gestion du stock activée.' : 'Gestion du stock désactivée : disponibilité manuelle.')
  }
  async function setAvailable(p: any, v: boolean) {
    const { error } = await sb().from('products').update({ is_available: v }).eq('id', p.id)
    if (error) return alert(`Erreur : ${error.message}`)
    load()
  }
  async function save(p: any) {
    const v = edits[p.id]; if (v == null) return
    const n = Math.max(0, +v || 0)
    await sb().from('products').update({ stock_ml: n }).eq('id', p.id)
    await sb().from('stock_movements').insert({ product_id: p.id, format: 'full', delta: n - p.stock_ml, reason: 'manual_adjustment' })
    setEdits(e => { const c = { ...e }; delete c[p.id]; return c }); load()
  }

  return (<div className="space-y-5">
    <h1 className="h text-3xl">Gestion du stock</h1>
    <section className="bg-coal border border-ivory/10 p-5 space-y-3" aria-label="Gestion du stock">
      <h2 className="h text-lg">Gestion du stock</h2>
      <div className="grid md:grid-cols-2 gap-3">
        <button type="button" onClick={() => setMode(true)} aria-pressed={stockOn} className={`text-left border p-4 transition ${stockOn ? 'border-sage ring-1 ring-sage bg-ink' : 'border-ivory/20 hover:border-sage/60'}`}>
          <span className="block text-sm font-medium">ON — Suivi automatique du stock</span>
          <span className="block text-xs text-warm mt-1">Le stock est vérifié à chaque commande, décrémenté automatiquement, et restitué si la commande est annulée ou supprimée.</span></button>
        <button type="button" onClick={() => setMode(false)} aria-pressed={!stockOn} className={`text-left border p-4 transition ${!stockOn ? 'border-sage ring-1 ring-sage bg-ink' : 'border-ivory/20 hover:border-sage/60'}`}>
          <span className="block text-sm font-medium">OFF — Disponibilité manuelle</span>
          <span className="block text-xs text-warm mt-1">Les quantités ne sont plus utilisées. Vous choisissez pour chaque produit : Disponible ou Indisponible. Aucune commande ne modifie le stock.</span></button>
      </div>
      <p className="text-xs text-warm">Mode actuel : <b className="font-medium">{stockOn ? 'ON (suivi automatique)' : 'OFF (disponibilité manuelle)'}</b>{modeMsg && <span className="ml-3 text-sage">{modeMsg}</span>}</p>
    </section>
    <p className="text-xs text-warm max-w-2xl">Le flacon plein et les portions 10ML d'un même parfum partagent un seul stock physique (en ml). Modifiez ce stock total ci-dessous : les deux compteurs affichés (flacons / portions) se recalculent automatiquement et restent toujours cohérents entre eux.</p>
    <div className="grid md:grid-cols-3 gap-2">
      <input className="input md:col-span-2" placeholder="Rechercher un produit…" value={q} onChange={e => setQ(e.target.value)} />
      <select className="input bg-ink" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
        <option value="">Tous statuts</option>{stockOn ? <><option value="IN_STOCK">En stock</option><option value="LOW_STOCK">Stock faible</option><option value="OUT_OF_STOCK">Rupture</option></> : <><option value="AVAILABLE">Disponible</option><option value="UNAVAILABLE">Indisponible</option></>}
      </select>
    </div>
    {loading ? <p className="text-sm text-warm">Chargement…</p> : !filtered.length ? <EmptyState text="Aucun résultat." /> : (
      <div className="overflow-x-auto bg-coal border border-ivory/10"><table className="w-full text-sm text-left">
        <thead className="text-xs uppercase tracking-widest text-warm"><tr>{['Produit', 'SKU', 'Stock total (ml)', 'Flacons pleins', 'Portions 10ML', stockOn ? 'Statut' : 'Disponibilité', 'Mettre à jour'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{filtered.map(p => { const s = statusOf(p); return (<tr key={p.id} className="border-t border-ivory/10">
          <td className="p-3"><span className="text-sage text-xs uppercase tracking-widest block">{p.brand}</span>{p.name}</td>
          <td className="p-3 text-warm">{p.sku}</td>
          <td className="p-3">{p.stock_ml} ml</td>
          <td className="p-3">{p.full_enabled ? `${p.full_stock} × ${p.full_size}` : '—'}</td>
          <td className="p-3">{p.sample_10ml ? `${p.stock_10ml} × 10ML` : '—'}</td>
          <td className="p-3">{stockOn ? <span className={`px-2 py-1 text-xs text-white ${statusColor[s]}`}>{statusLabel[s]}</span> : <select aria-label={`Disponibilité de ${p.name}`} className="input !py-1.5 w-40" value={p.is_available === false ? '0' : '1'} onChange={e => setAvailable(p, e.target.value === '1')}><option value="1">Disponible</option><option value="0">Indisponible</option></select>}</td>
          <td className="p-3"><div className="flex gap-2"><input type="number" min={0} className="input !py-1.5 w-24" placeholder={String(p.stock_ml)} value={edits[p.id] ?? ''} onChange={e => setEdits({ ...edits, [p.id]: e.target.value })} />
            <button className="btn text-xs" onClick={() => save(p)}>OK</button></div></td>
        </tr>) })}</tbody>
      </table></div>
    )}
  </div>)
}
