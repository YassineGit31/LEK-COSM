'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { sb } from '@/lib/supabase/client'
import { da, fmtLabel, STATUS } from '@/lib/format'
import { ORDER_ACTIONS } from '@/lib/admin'
import { StatusBadge, EmptyState, MethodBadge } from '@/components/admin/Widgets'

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [st, setSt] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [payment, setPayment] = useState('')
  const [method, setMethod] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await sb().from('orders').select('*, customers(name,phone,email), order_items(*)').order('created_at', { ascending: false })
    setOrders(data || []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function setStatus(id: string, s: string) {
    if (['annulee', 'refusee'].includes(s) && !confirm('Confirmer cette action ?')) return
    // Le retour / la sortie de stock est fait par un trigger PostgreSQL dans la même transaction que ce changement de statut.
    const { error } = await sb().from('orders').update({ status: s }).eq('id', id)
    if (error) alert(error.message.includes('OUT_OF_STOCK') ? `Stock insuffisant pour réactiver cette commande : ${error.message.split('OUT_OF_STOCK:')[1] ?? ''}` : `Erreur : ${error.message}`)
    load()
  }
  async function del(id: string) { if (confirm('Supprimer définitivement cette commande ? Le stock encore réservé par cette commande sera restitué automatiquement.')) { const { error } = await sb().from('orders').delete().eq('id', id); if (error) alert(`Erreur : ${error.message}`); load() } }

  const rows = orders.filter(o =>
    (!st || o.status === st) &&
    (!wilaya || o.wilaya === wilaya) &&
    (!payment || o.payment_method === payment) &&
    (!method || (o.delivery_method || 'home') === method) &&
    (!from || new Date(o.created_at) >= new Date(from)) &&
    (!to || new Date(o.created_at) <= new Date(to + 'T23:59:59')) &&
    `${o.order_number} ${o.customers?.name} ${o.customers?.phone}`.toLowerCase().includes(q.toLowerCase()))
  const wilayas = [...new Set(orders.map(o => o.wilaya))].sort()

  return (<div className="space-y-5">
    <div className="flex items-center justify-between"><h1 className="h text-3xl">Commandes</h1><p className="text-sm text-ivory/50">{rows.length} / {orders.length} commandes</p></div>

    <div className="grid md:grid-cols-7 gap-2">
      <input className="input md:col-span-2" placeholder="N° commande, nom, téléphone" value={q} onChange={e => setQ(e.target.value)} />
      <select className="input bg-ink" value={st} onChange={e => setSt(e.target.value)}><option value="">Tous statuts</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <select className="input bg-ink" value={wilaya} onChange={e => setWilaya(e.target.value)}><option value="">Toutes wilayas</option>{wilayas.map(w => <option key={w}>{w}</option>)}</select>
      <select className="input bg-ink" value={payment} onChange={e => setPayment(e.target.value)}><option value="">Tout paiement</option><option value="cod">Paiement à la livraison</option></select>
      <select className="input bg-ink" value={method} onChange={e => setMethod(e.target.value)}><option value="">Tous modes</option><option value="office">Bureau</option><option value="home">Domicile</option><option value="pickup">Retrait sur place</option></select>
      <div className="flex gap-2"><input type="date" className="input" value={from} onChange={e => setFrom(e.target.value)} /><input type="date" className="input" value={to} onChange={e => setTo(e.target.value)} /></div>
    </div>

    {loading ? <p className="text-sm text-ivory/50">Chargement…</p> : !rows.length ? <EmptyState text="Aucune commande ne correspond à ces filtres." /> : (
      <div className="overflow-x-auto bg-coal border border-ivory/10"><table className="w-full text-sm text-left">
        <thead className="text-xs uppercase tracking-widest text-ivory/50"><tr>{['Commande', 'Client', 'Livraison', 'Articles', 'Montants', 'Paiement', 'Statut', 'Actions'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{rows.map(o => (<tr key={o.id} className="border-t border-ivory/10 align-top hover:bg-ivory/5">
          <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="underline decoration-ivory/30 hover:decoration-gold">{o.order_number}</Link><br /><span className="text-ivory/40 text-xs">{new Date(o.created_at).toLocaleString('fr-FR')}</span></td>
          <td className="p-3">{o.customers?.name}<br /><a className="text-sage" href={`tel:${o.customers?.phone}`}>{o.customers?.phone}</a></td>
          <td className="p-3"><MethodBadge method={o.delivery_method} /><br />{o.wilaya}{o.delivery_method === 'pickup' ? '' : <>, {o.commune}</>}{o.delivery_method === 'home' && <><br /><span className="text-ivory/50 text-xs">{o.address}</span></>}{o.delivery_method === 'pickup' && o.pickup_info && <><br /><span className="text-ivory/50 text-xs whitespace-pre-line">{o.pickup_info}</span></>}</td>
          <td className="p-3">{o.order_items.map((i: any) => <p key={i.id}>{i.product_name}<br /><span className="text-ivory/50 text-xs">{fmtLabel(i.format, i.size)} × {i.quantity}</span></p>)}</td>
          <td className="p-3 text-xs whitespace-nowrap">Sous-total : {da(o.subtotal)}{o.discount > 0 && <><br />Remise : −{da(o.discount)}</>}<br />Livraison : {o.delivery_method === 'pickup' ? 'Gratuit' : o.delivery_fee ? da(o.delivery_fee) : 'Offerte'}<br /><b className="text-sm font-medium">Total : {da(o.total)}</b></td>
          <td className="p-3 text-xs">{o.payment_method === 'cod' ? (o.delivery_method === 'pickup' ? 'Au retrait' : 'À la livraison') : o.payment_method}{o.coupon_code && <><br /><span className="text-sage">{o.coupon_code}</span></>}</td>
          <td className="p-3"><StatusBadge status={o.status} /></td>
          <td className="p-3 space-x-1 space-y-1">
            {ORDER_ACTIONS.map(([s, l]) => <button key={s} disabled={o.status === s} onClick={() => setStatus(o.id, s)} className="border border-ivory/25 px-2 py-1 text-xs hover:border-gold disabled:opacity-30">{l}</button>)}
            <Link href={`/admin/orders/${o.id}`} className="border border-ivory/25 px-2 py-1 text-xs inline-block hover:border-gold">Ouvrir</Link>
            <button onClick={() => del(o.id)} className="border border-red-500 text-red-700 px-2 py-1 text-xs">Suppr.</button>
          </td>
        </tr>))}</tbody>
      </table></div>
    )}
  </div>)
}
