'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sb } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart'
import { useWilaya } from '@/lib/wilaya'
import WilayaSelector from '@/components/WilayaSelector'
import { PLACEHOLDER_IMG } from '@/lib/categories'
import { da, fmtLabel } from '@/lib/format'
export default function Cart() {
  const { items, subtotal, setQty, remove } = useCart()
  const { wilaya, fee, isServed, officeFee, homeFee } = useWilaya()
  const [free, setFree] = useState(0)
  useEffect(() => { sb().from('settings').select('*').eq('key', 'free_delivery_threshold').maybeSingle().then(({ data }) => { if (data) setFree(+data.value) }) }, [])
  if (!items.length) return <div className="mx-auto max-w-md px-5 py-28 text-center"><h1 className="h text-4xl">Votre panier est vide</h1><p className="mt-3 text-sage/75">Découvrez nos produits et ajoutez vos préférés.</p><Link href="/shop" className="btn btn-solid mt-8">Continuer vos achats</Link></div>
  const reached = free > 0 && subtotal >= free
  return (<div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><h1 className="h text-4xl md:text-5xl">Panier</h1><div className="w-full sm:w-72"><WilayaSelector /></div></div>
    {!wilaya && <p className="mb-6 rounded-2xl bg-sand/40 p-4 text-sm">Choisissez votre wilaya pour voir les frais de livraison (bureau ou domicile). Le prix des produits reste le même partout en Algérie.</p>}
    {wilaya && !isServed && <p role="alert" className="mb-6 rounded-2xl border border-red-700/40 bg-white p-4 text-sm text-red-700">La livraison n&rsquo;est pas disponible pour {wilaya} actuellement.</p>}
    <div className="grid gap-10 lg:grid-cols-3">
      <ul className="lg:col-span-2">
        {items.map(i => <li key={i.productId + i.format} className="flex gap-4 border-b border-sage/10 py-6 first:pt-0">
          <img src={i.image || PLACEHOLDER_IMG} alt="" className={`h-28 w-24 shrink-0 rounded-2xl bg-sand/40 ${i.image ? 'object-cover' : 'object-contain p-6 opacity-50'}`} />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-xs text-sage/75">{i.brand}</p>
            <Link href={`/product/${i.slug}`} className="h text-lg leading-snug hover:underline">{i.name}</Link>
            <p className="mt-0.5 text-sm text-sage/75">{fmtLabel(i.format, i.size)}</p>
            <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
              <span className="inline-flex items-center rounded-full border border-sage/25 bg-white text-sm"><button aria-label="Diminuer la quantité" className="h-9 w-9" onClick={() => setQty(i.productId, i.format, i.qty - 1)}>−</button><span className="w-6 text-center">{i.qty}</span><button aria-label="Augmenter la quantité" className="h-9 w-9" onClick={() => setQty(i.productId, i.format, i.qty + 1)}>+</button></span>
              <button className="text-sm underline underline-offset-4" onClick={() => remove(i.productId, i.format)}>Retirer</button></div></div>
          <p className="shrink-0 text-sm font-medium">{da(i.price * i.qty)}</p></li>)}
      </ul>
      <aside className="h-fit space-y-3 rounded-3xl bg-white p-6 text-sm">
        <h2 className="h text-2xl">Récapitulatif</h2>
        <p className="flex justify-between pt-2"><span>Sous-total</span><span>{da(subtotal)}</span></p>
        <p className="flex justify-between text-sage/75"><span>Livraison</span><span>{wilaya && fee != null ? (isServed ? (reached ? 'Offerte' : (officeFee != null && homeFee != null && officeFee !== homeFee ? `dès ${da(fee)}` : da(fee))) : 'Non disponible') : 'Choisissez une wilaya'}</span></p>
        {free > 0 && !reached && <p className="rounded-xl bg-sand/40 p-3 text-xs">Plus que {da(free - subtotal)} pour profiter de la livraison offerte.</p>}
        <Link href="/checkout" className="btn btn-solid mt-4 w-full">Passer la commande</Link><Link href="/shop" className="btn w-full">Continuer vos achats</Link>
        <p className="pt-1 text-center text-xs text-sage/75">Paiement à la livraison</p>
      </aside>
    </div></div>)
}
