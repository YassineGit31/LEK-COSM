'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { da, fmtLabel } from '@/lib/format'
import { methodFr } from '@/lib/delivery'
import Icon from '@/components/Icons'
export default function Success() {
  const [o, setO] = useState<any>(null)
  useEffect(() => { try { setO(JSON.parse(sessionStorage.getItem('wp_last_order') || 'null')) } catch {} }, [])
  if (!o) return <div className="mx-auto max-w-md px-5 py-28 text-center"><p>Aucune commande récente.</p><Link className="btn mt-6" href="/track-order">Suivre une commande</Link></div>
  return (<div className="mx-auto max-w-2xl px-5 py-14 text-center md:py-20">
    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mist/40"><Icon name="check" className="h-7 w-7" /></span>
    <h1 className="h mt-6 text-4xl md:text-5xl">Merci pour votre commande</h1><p className="mt-3 text-warm">Votre commande a bien été enregistrée.</p>
    <p className="mt-8 text-sm text-warm">Numéro de commande</p><p className="h text-3xl">{o.number}</p>
    <div className="mt-8 space-y-2 rounded-3xl bg-coal p-6 text-left text-sm md:p-8">{o.items.map((i: any) => <p key={i.productId + i.format} className="flex justify-between gap-3"><span>{i.name}, {fmtLabel(i.format, i.size)} × {i.qty}</span><span className="shrink-0">{da(i.price * i.qty)}</span></p>)}
      <p className="flex justify-between border-t border-sage/10 pt-3"><span>Sous-total</span><span>{da(o.subtotal)}</span></p>
      {o.discount > 0 && <p className="flex justify-between text-sage"><span>Remise</span><span>−{da(o.discount)}</span></p>}
      <p className="flex justify-between"><span>{o.method === 'pickup' ? 'Retrait sur place' : 'Livraison'}</span><span>{o.method === 'pickup' ? 'Gratuit' : o.delivery ? da(o.delivery) : 'Offerte'}</span></p>
      <p className="flex items-baseline justify-between border-t border-sage/10 pt-3"><span className="h text-lg">Total</span><span className="h text-2xl">{da(o.total ?? o.subtotal + o.delivery)}</span></p>
      <p className="pt-2 text-warm">Mode de réception : <b className="font-medium">{methodFr(o.method)}</b></p>
      {o.method === 'pickup' && o.pickup
        ? <p className="whitespace-pre-line text-warm">À retirer : {[o.pickup.name, o.pickup.address, o.pickup.hours && `Horaires : ${o.pickup.hours}`, o.pickup.instructions].filter(Boolean).join('\n')}</p>
        : o.method === 'office'
          ? <p className="text-warm">Bureau de la société de livraison — {o.commune}, {o.wilaya}. Paiement à la réception.</p>
          : <p className="text-warm">Livraison : {o.name}, {o.address}, {o.commune}, {o.wilaya}. Paiement à la livraison.</p>}</div>
    <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/track-order" className="btn btn-solid">Suivre ma commande</Link><Link href="/shop" className="btn">Continuer vos achats</Link></div></div>)
}
