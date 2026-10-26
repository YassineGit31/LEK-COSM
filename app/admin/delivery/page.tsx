'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { sb } from '@/lib/supabase/client'
import { da } from '@/lib/format'
import { EMPTY_PICKUP, type Pickup } from '@/lib/store-settings'
import { Card, EmptyState } from '@/components/admin/Widgets'

interface Wilaya { id: number; code: number; name: string }
// Un tarif vide = « tarif par défaut » (Paramètres). officeOn / homeOn = mode proposé dans cette wilaya.
interface Row { office: string; home: string; officeOn: boolean; homeOn: boolean }
const DEFAULT_ROW: Row = { office: '', home: '', officeOn: true, homeOn: true }
const isDefault = (r: Row) => r.office === '' && r.home === '' && r.officeOn && r.homeOn
const same = (a: Row, b: Row) => a.office === b.office && a.home === b.home && a.officeOn === b.officeOn && a.homeOn === b.homeOn

export default function DeliveryByWilaya() {
  const [wilayas, setWilayas] = useState<Wilaya[]>([])
  const [rows, setRows] = useState<Record<number, Row>>({})
  const [original, setOriginal] = useState<Record<number, Row>>({})
  const [defaultFee, setDefaultFee] = useState(600)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkFee, setBulkFee] = useState('')
  const [bulkTarget, setBulkTarget] = useState<'office' | 'home' | 'both'>('both')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [pickup, setPickup] = useState<Pickup>(EMPTY_PICKUP)
  const [pkMsg, setPkMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [w, f, s, pk] = await Promise.all([
      sb().from('wilayas').select('id,code,name').order('code'),
      sb().from('wilaya_delivery_fees').select('wilaya_id,fee,fee_office,fee_home,office_enabled,home_enabled,is_served'),
      sb().from('settings').select('value').eq('key', 'delivery_fee').maybeSingle(),
      sb().from('settings').select('value').eq('key', 'pickup').maybeSingle(),
    ])
    setWilayas(w.data || [])
    if (s.data) setDefaultFee(+s.data.value)
    if (pk.data) setPickup({ ...EMPTY_PICKUP, ...(pk.data.value || {}) })
    if (f.error) setMsg(`Erreur de lecture : ${f.error.message} — avez-vous exécuté migration_stock_delivery_v2.sql ?`)
    const next: Record<number, Row> = {}
    ;(f.data || []).forEach((r: any) => {
      const served = r.is_served !== false
      next[r.wilaya_id] = { office: r.fee_office != null ? String(r.fee_office) : '', home: r.fee_home != null ? String(r.fee_home) : '', officeOn: served && r.office_enabled !== false, homeOn: served && r.home_enabled !== false }
    })
    setRows(next); setOriginal(JSON.parse(JSON.stringify(next))); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const get = (id: number): Row => rows[id] || DEFAULT_ROW
  const filtered = useMemo(() => wilayas.filter(w => w.name.toLowerCase().includes(q.toLowerCase()) || String(w.code).includes(q)), [wilayas, q])
  const customCount = wilayas.filter(w => !isDefault(get(w.id))).length // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (id: number, p: Partial<Row>) => setRows(r => ({ ...r, [id]: { ...(r[id] || DEFAULT_ROW), ...p } }))
  const toggleSelect = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  function applyBulk() {
    if (!selected.size) return setMsg('Sélectionnez au moins une wilaya avant d’appliquer un tarif groupé.')
    if (bulkFee === '' || +bulkFee < 0) return setMsg('Indiquez un tarif valide à appliquer.')
    setRows(r => { const n = { ...r }; selected.forEach(id => { const cur = n[id] || DEFAULT_ROW; n[id] = { ...cur, ...(bulkTarget !== 'home' ? { office: bulkFee } : {}), ...(bulkTarget !== 'office' ? { home: bulkFee } : {}) } }); return n }); setMsg('')
  }

  async function save() {
    setSaving(true); setMsg('')
    const upserts: any[] = []; const deletes: number[] = []
    wilayas.forEach(w => {
      const cur = get(w.id); const orig = original[w.id] || DEFAULT_ROW
      if (same(cur, orig)) return
      if (isDefault(cur)) { deletes.push(w.id); return }
      upserts.push({
        wilaya_id: w.id,
        fee_office: cur.office === '' ? null : Math.max(0, Math.round(+cur.office)),
        fee_home: cur.home === '' ? null : Math.max(0, Math.round(+cur.home)),
        fee: cur.home !== '' ? Math.max(0, Math.round(+cur.home)) : defaultFee, // colonne historique, gardée cohérente
        office_enabled: cur.officeOn, home_enabled: cur.homeOn, is_served: cur.officeOn || cur.homeOn, updated_at: new Date().toISOString(),
      })
    })
    if (upserts.length) {
      const { error } = await sb().from('wilaya_delivery_fees').upsert(upserts, { onConflict: 'wilaya_id' })
      if (error) { setSaving(false); return setMsg(`Erreur : ${error.message}`) }
    }
    for (const id of deletes) {
      const { error } = await sb().from('wilaya_delivery_fees').delete().eq('wilaya_id', id)
      if (error) { setSaving(false); return setMsg(`Erreur : ${error.message}`) }
    }
    await load(); setSaving(false); setMsg(`Tarifs enregistrés (${upserts.length + deletes.length} wilaya(s) modifiée(s)).`)
  }

  async function savePickup() {
    setPkMsg('')
    if (pickup.enabled && !pickup.address.trim()) return setPkMsg('Indiquez l’adresse du point de retrait avant de l’activer.')
    const { error } = await sb().from('settings').upsert({ key: 'pickup', value: pickup })
    setPkMsg(error ? `Erreur : ${error.message}` : 'Point de retrait enregistré.')
  }

  const num = 'input py-1.5 w-28'
  return (<div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="h text-3xl">Livraison</h1>
      <p className="text-xs text-ivory/50 max-w-md text-right">Réglez, pour chaque wilaya, le frais de la livraison au <b>bureau</b> et à <b>domicile</b>, et activez ou désactivez chaque mode. Un champ vide applique le tarif par défaut ({da(defaultFee)}, modifiable dans Paramètres). Le retrait sur place est toujours gratuit.</p></div>

    <Card title="Retrait sur place — sans livraison">
      <div className="space-y-3 max-w-2xl">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pickup.enabled} onChange={e => setPickup({ ...pickup, enabled: e.target.checked })} /> Proposer le retrait sur place aux clients</label>
        <input className="input" placeholder="Nom du point de retrait (ex : la boutique)" value={pickup.name} onChange={e => setPickup({ ...pickup, name: e.target.value })} />
        <textarea className="input" rows={2} placeholder="Adresse du point de retrait (obligatoire pour activer)" value={pickup.address} onChange={e => setPickup({ ...pickup, address: e.target.value })} />
        <input className="input" placeholder="Horaires (optionnel)" value={pickup.hours} onChange={e => setPickup({ ...pickup, hours: e.target.value })} />
        <textarea className="input" rows={2} placeholder="Instructions pour le client (optionnel)" value={pickup.instructions} onChange={e => setPickup({ ...pickup, instructions: e.target.value })} />
        <div className="flex items-center gap-3"><button type="button" onClick={savePickup} className="btn btn-solid text-xs">Enregistrer le point de retrait</button>{pkMsg && <p className="text-sm text-sage">{pkMsg}</p>}</div>
      </div>
    </Card>

    {loading ? <p className="text-sm text-ivory/50">Chargement…</p> : !wilayas.length ? <EmptyState text="Aucune wilaya trouvée. Exécutez migration_wilaya_pricing.sql." /> : (<>
      <Card title={`Actions groupées (${selected.size} wilaya${selected.size > 1 ? 's' : ''} sélectionnée${selected.size > 1 ? 's' : ''})`}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 items-end">
          <input className="input" placeholder="Rechercher une wilaya…" value={q} onChange={e => setQ(e.target.value)} />
          <select className="input" value={bulkTarget} onChange={e => setBulkTarget(e.target.value as any)}><option value="both">Bureau + domicile</option><option value="office">Bureau seulement</option><option value="home">Domicile seulement</option></select>
          <input className="input" type="number" min={0} placeholder="Frais (DA)" value={bulkFee} onChange={e => setBulkFee(e.target.value)} />
          <button type="button" onClick={applyBulk} className="btn text-xs">Appliquer à la sélection</button>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={() => setSelected(new Set(filtered.map(w => w.id)))} className="border border-ivory/25 px-2 py-2 flex-1">Tout sélectionner</button>
            <button type="button" onClick={() => setSelected(new Set())} className="border border-ivory/25 px-2 py-2 flex-1">Aucune</button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3 text-xs text-ivory/50"><span>{filtered.length} wilaya(s) affichée(s) · {customCount} avec un réglage spécifique</span></div>
        <div className="overflow-x-auto border border-ivory/10">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase tracking-widest text-ivory/50 bg-ink/50"><tr>
              <th className="p-2 w-8"></th><th className="p-2">#</th><th className="p-2">Wilaya</th>
              <th className="p-2">Bureau (DA)</th><th className="p-2">Bureau actif</th><th className="p-2">Domicile (DA)</th><th className="p-2">Domicile actif</th><th className="p-2"></th>
            </tr></thead>
            <tbody>{filtered.map(w => {
              const r = get(w.id); const custom = !isDefault(r)
              return (<tr key={w.id} className={`border-t border-ivory/10 ${custom ? 'bg-gold/5' : ''}`}>
                <td className="p-2"><input type="checkbox" checked={selected.has(w.id)} onChange={() => toggleSelect(w.id)} /></td>
                <td className="p-2 text-ivory/50">{w.code}</td>
                <td className="p-2">{w.name}{custom && <span className="ml-2 text-sage text-[10px]">●</span>}</td>
                <td className="p-2"><input type="number" min={0} className={num} placeholder={String(defaultFee)} value={r.office} onChange={e => patch(w.id, { office: e.target.value })} /></td>
                <td className="p-2"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={r.officeOn} onChange={e => patch(w.id, { officeOn: e.target.checked })} /> Oui</label></td>
                <td className="p-2"><input type="number" min={0} className={num} placeholder={String(defaultFee)} value={r.home} onChange={e => patch(w.id, { home: e.target.value })} /></td>
                <td className="p-2"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={r.homeOn} onChange={e => patch(w.id, { homeOn: e.target.checked })} /> Oui</label></td>
                <td className="p-2">{custom && <button type="button" onClick={() => setRows(x => ({ ...x, [w.id]: { ...DEFAULT_ROW } }))} className="text-xs text-ivory/50 underline">Défaut</button>}</td>
              </tr>)
            })}</tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center gap-4 sticky bottom-4">
        <button type="button" disabled={saving} onClick={save} className="btn btn-solid">{saving ? 'Enregistrement…' : 'Enregistrer les tarifs'}</button>
        {msg && <p className="text-sm text-sage">{msg}</p>}
      </div>
    </>)}
  </div>)
}
