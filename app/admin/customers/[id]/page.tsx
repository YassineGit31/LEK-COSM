'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { sb } from '@/lib/supabase/client'
import { da } from '@/lib/format'
import { StatusBadge, Card, EmptyState } from '@/components/admin/Widgets'
import { waLink } from '@/lib/admin'

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>()
  const [customer, setCustomer] = useState<any>(undefined)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      const c = sb()
      const [{ data: cu }, { data: os }] = await Promise.all([c.from('customers').select('*').eq('id', id).maybeSingle(), c.from('orders').select('*').eq('customer_id', id).order('created_at', { ascending: false })])
      setCustomer(cu); setOrders(os || [])
    })()
  }, [id])

  if (customer === undefined) return <p className="text-sm text-warm">Chargement…</p>
  if (!customer) return <p className="text-sm text-warm">Client introuvable.</p>
  const valid = orders.filter(o => !['annulee', 'refusee'].includes(o.status))
  const total = valid.reduce((s, o) => s + o.total, 0)
  const avg = valid.length ? Math.round(total / valid.length) : 0

  return (<div className="space-y-5 max-w-4xl">
    <Link href="/admin/customers" className="text-xs text-warm underline">← Tous les clients</Link>
    <h1 className="h text-3xl">{customer.name}</h1>
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Coordonnées">
        <p><a className="text-sage" href={`tel:${customer.phone}`}>{customer.phone}</a> · <a className="text-sage" target="_blank" href={waLink(customer.phone)}>WhatsApp</a></p>
        {customer.email && <p className="text-warm">{customer.email}</p>}
        <p className="text-warm mt-2">{customer.address}, {customer.commune}, {customer.wilaya}</p>
      </Card>
      <Card title="Statistiques">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="h text-2xl">{valid.length}</p><p className="text-xs text-warm">Commandes</p></div>
          <div><p className="h text-2xl">{da(total)}</p><p className="text-xs text-warm">Total dépensé</p></div>
          <div><p className="h text-2xl">{da(avg)}</p><p className="text-xs text-warm">Panier moyen</p></div>
        </div>
      </Card>
    </div>
    <Card title="Historique des commandes">
      {!orders.length ? <EmptyState text="Aucune commande." /> : <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase tracking-widest text-warm"><tr><th className="py-2">Commande</th><th>Date</th><th>Total</th><th>Statut</th><th></th></tr></thead>
        <tbody>{orders.map(o => (<tr key={o.id} className="border-t border-ivory/10">
          <td className="py-2">{o.order_number}</td><td>{new Date(o.created_at).toLocaleDateString('fr-FR')}</td><td>{da(o.total)}</td><td><StatusBadge status={o.status} /></td>
          <td><Link href={`/admin/orders/${o.id}`} className="underline text-xs">Ouvrir</Link></td>
        </tr>))}</tbody>
      </table>}
    </Card>
  </div>)
}
