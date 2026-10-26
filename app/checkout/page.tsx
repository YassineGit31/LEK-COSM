'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart'
import { useWilaya } from '@/lib/wilaya'
import { useStoreSettings } from '@/lib/store-settings'
import { METHODS, METHOD_LABEL, type DeliveryMethod } from '@/lib/delivery'
import { da, fmtLabel } from '@/lib/format'

export default function Checkout() {
  const { items, subtotal, clear } = useCart(); const router = useRouter()
  const { wilaya, setWilaya, wilayas, officeFee, homeFee, officeOk, homeOk, loading: feeLoading } = useWilaya()
  const { pickup, freeThreshold: free } = useStoreSettings()
  const [f, setF] = useState({ name:'', phone:'', email:'', wilaya, commune:'', address:'', notes:'', coupon:'' })
  const [method, setMethod] = useState<DeliveryMethod | ''>('')
  const [discount, setDiscount] = useState(0)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('')

  useEffect(() => { if (wilaya && !f.wilaya) setF(prev => ({ ...prev, wilaya })) }, [wilaya]) // eslint-disable-line react-hooks/exhaustive-deps

  // Aperçu de la remise (le montant définitif est recalculé par place_order() côté serveur).
  useEffect(() => {
    const code = f.coupon.trim()
    if (!code) { setDiscount(0); return }
    const t = setTimeout(async () => {
      const { data, error } = await sb().rpc('preview_coupon', { p_code: code, p_subtotal: subtotal })
      setDiscount(!error && typeof data === 'number' ? data : 0)
    }, 400)
    return () => clearTimeout(t)
  }, [f.coupon, subtotal])

  const pickupReady = pickup.enabled && !!pickup.address.trim()
  const methodOk = (m: DeliveryMethod) => m === 'pickup' ? pickupReady : !f.wilaya ? true : m === 'office' ? officeOk : homeOk
  // Si le mode choisi n'est plus proposé (changement de wilaya), on retire la sélection.
  useEffect(() => { if (method && f.wilaya && !feeLoading && !methodOk(method)) setMethod('') }, [f.wilaya, officeOk, homeOk, feeLoading, pickupReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Frais affiché (indicatif) : par wilaya ET par mode ; retrait = toujours 0.
  const rawFee = method === 'pickup' ? 0 : method === 'office' ? officeFee : method === 'home' ? homeFee : null
  const delivery = method === 'pickup' ? 0 : free > 0 && subtotal - discount >= free ? 0 : (rawFee ?? 0)
  const total = Math.max(0, subtotal - discount) + delivery
  const feeOf = (m: DeliveryMethod) => m === 'pickup' ? 'Gratuit' : !f.wilaya ? 'Choisissez une wilaya' : feeLoading ? '…' : !methodOk(m) ? 'Indisponible' : da((m === 'office' ? officeFee : homeFee) ?? 0)
  const set = (k:string) => (e:any) => setF({ ...f, [k]:e.target.value })

  async function submit(e:React.FormEvent) {
    e.preventDefault(); setErr('')
    if (!/^(0)(5|6|7)\d{8}$/.test(f.phone.replace(/\s/g, ''))) return setErr('Numéro de téléphone invalide (ex : 0550123456).')
    if (!f.wilaya) return setErr('Veuillez choisir votre wilaya.')
    if (!method) return setErr('Veuillez choisir un mode de réception.')
    if (!methodOk(method)) return setErr(method === 'pickup' ? "Le retrait sur place n'est pas disponible pour le moment." : "Ce mode de livraison n'est pas disponible pour cette wilaya.")
    if (method !== 'pickup' && !f.commune.trim()) return setErr('Veuillez indiquer votre commune.')
    if (method === 'home' && !f.address.trim()) return setErr('Veuillez indiquer votre adresse complète.')
    setBusy(true)
    const { data, error } = await sb().rpc('place_order', { p_customer:{ name:f.name, phone:f.phone.replace(/\s/g, ''), email:f.email },
      p_address:{ wilaya:f.wilaya, commune: method === 'pickup' ? '' : f.commune, address: method === 'pickup' ? '' : f.address, notes:f.notes, delivery_method: method },
      p_items:items.map(i => ({ product_id:i.productId, format:i.format, quantity:i.qty })), p_coupon:f.coupon || null })
    if (error) {
      setBusy(false)
      const m = error.message
      if (m.includes('OUT_OF_STOCK')) return setErr("Un article n'est plus disponible en quantité suffisante.")
      if (m.includes('PRODUCT_UNAVAILABLE')) { const n = m.split('PRODUCT_UNAVAILABLE:')[1]?.split('\n')[0]?.trim(); return setErr(n ? `« ${n} » est actuellement indisponible. Retirez-le de votre panier pour continuer.` : "Un article de votre panier n'est plus disponible.") }
      if (m.includes('FORMAT_UNAVAILABLE')) return setErr("Un format choisi n'est plus proposé. Veuillez mettre à jour votre panier.")
      if (m.includes('WILAYA_NOT_SERVED')) return setErr("La livraison n'est pas disponible pour cette wilaya.")
      if (m.includes('DELIVERY_METHOD_UNAVAILABLE')) return setErr("Ce mode de livraison n'est pas disponible pour cette wilaya.")
      if (m.includes('PICKUP_UNAVAILABLE')) return setErr("Le retrait sur place n'est pas disponible pour le moment.")
      if (m.includes('INVALID_ADDRESS')) return setErr('Veuillez renseigner votre commune et votre adresse.')
      if (m.includes('INVALID_WILAYA')) return setErr('Wilaya invalide, veuillez la sélectionner dans la liste.')
      if (m.includes('INVALID_PHONE')) return setErr('Numéro de téléphone invalide.')
      return setErr('Erreur lors de la commande. Veuillez réessayer.')
    }
    const o = data[0]
    // Montants définitifs calculés par le serveur (relus via le suivi public), avec repli sur l'estimation affichée.
    let finalTotal = total, finalFee = delivery
    const tr = await sb().rpc('track_order', { p_number: o.order_number, p_phone: f.phone.replace(/\s/g, '') })
    if (!tr.error && tr.data) { finalTotal = (tr.data as any).total; finalFee = (tr.data as any).delivery_fee }
    setBusy(false)
    sessionStorage.setItem('wp_last_order', JSON.stringify({ number:o.order_number, phone:f.phone, items, subtotal, delivery: finalFee, discount: Math.max(0, subtotal + finalFee - finalTotal), total: finalTotal,
      method, pickup: method === 'pickup' ? pickup : null, name:f.name, wilaya:f.wilaya, commune:f.commune, address:f.address }))
    clear(); router.push('/order-success')
  }
  if (!items.length) return <div className="mx-auto max-w-md px-5 py-28 text-center"><h1 className="h text-4xl">Votre panier est vide</h1><Link href="/shop" className="btn btn-solid mt-8">Découvrir la boutique</Link></div>
  const sec = 'rounded-3xl bg-coal p-6 md:p-8'; const lab = 'mb-1.5 block text-sm font-medium'
  return (<form onSubmit={submit} className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:py-14 lg:grid-cols-5">
    <div className="space-y-6 lg:col-span-3"><h1 className="h text-4xl md:text-5xl">Commande</h1>
      <section className={sec}><h2 className="h mb-5 text-2xl">Vos coordonnées</h2><div className="space-y-4">
        <label className="block"><span className={lab}>Nom et prénom</span><input required autoComplete="name" className="input" value={f.name} onChange={set('name')} /></label>
        <label className="block"><span className={lab}>Numéro de téléphone</span><input required autoComplete="tel" inputMode="tel" placeholder="0550123456" className="input" value={f.phone} onChange={set('phone')} /></label>
        <label className="block"><span className={lab}>Email (optionnel)</span><input autoComplete="email" className="input" type="email" value={f.email} onChange={set('email')} /></label></div></section>

      <section className={sec}><h2 className="h mb-5 text-2xl">Votre wilaya</h2>
        <label className="block"><span className={lab}>Wilaya</span><select required className="input" value={f.wilaya} onChange={e => { setF({ ...f, wilaya: e.target.value }); setWilaya(e.target.value) }}>
          <option value="">Choisir une wilaya</option>{wilayas.map(w => <option key={w.id} value={w.name}>{w.code} - {w.name}</option>)}</select></label>
        {f.wilaya && !feeLoading && !officeOk && !homeOk && <p role="alert" className="mt-3 text-sm text-red-700">La livraison n&rsquo;est pas disponible pour cette wilaya. Le retrait sur place reste possible s&rsquo;il est proposé.</p>}</section>

      <section className={sec}><h2 className="h mb-1 text-2xl">Mode de réception</h2><p className="mb-5 text-sm text-warm">Choisissez comment vous souhaitez recevoir votre commande.</p>
        <div role="radiogroup" aria-label="Mode de réception" className="space-y-3">
          {METHODS.map(m => { const ok = methodOk(m); const on = method === m
            return (<label key={m} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm transition ${!ok ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${on ? 'border-sage bg-cream ring-1 ring-sage' : 'border-sage/20 bg-coal hover:border-sage/60'}`}>
              <input type="radio" name="delivery_method" className="mt-1 h-4 w-4 shrink-0 accent-sage" disabled={!ok} checked={on} onChange={() => setMethod(m)} />
              <span className="min-w-0 flex-1"><span className="flex flex-wrap items-baseline justify-between gap-x-3"><b className="font-medium">{METHOD_LABEL[m].fr}</b><span className={`shrink-0 ${ok ? 'font-medium' : 'text-red-700'}`}>{m === 'pickup' && !pickupReady ? 'Indisponible' : feeOf(m)}</span></span>
                <span dir="rtl" lang="ar" className="mt-0.5 block text-warm">{METHOD_LABEL[m].ar}</span></span></label>) })}
        </div>
        {!pickupReady && <p className="mt-3 text-xs text-warm">Le retrait sur place n&rsquo;est pas proposé pour le moment.</p>}</section>

      {method && <section className={sec}><h2 className="h mb-5 text-2xl">{method === 'pickup' ? 'Retrait sur place' : method === 'office' ? 'Livraison au bureau' : 'Adresse de livraison'}</h2>
        {method === 'pickup' ? (<div className="space-y-3 text-sm">
          <div className="rounded-2xl border border-sage/20 bg-cream p-4">
            {pickup.name && <p className="font-medium">{pickup.name}</p>}<p className="whitespace-pre-line">{pickup.address}</p>
            {pickup.hours && <p className="mt-2 text-warm">Horaires : {pickup.hours}</p>}
            {pickup.instructions && <p className="mt-2 whitespace-pre-line text-warm">{pickup.instructions}</p>}</div>
          <p className="text-warm">Aucun frais de livraison. Vous récupérez votre commande vous-même à cette adresse.</p>
          <label className="block"><span className={lab}>Remarques (optionnel)</span><textarea className="input" rows={3} value={f.notes} onChange={set('notes')} /></label></div>) : (<div className="space-y-4">
          {method === 'office' && <p className="rounded-2xl bg-sand/40 p-4 text-sm">Votre colis sera livré au <b className="font-medium">bureau de la société de livraison</b> de votre wilaya. Vous devrez vous y rendre pour le récupérer ; la société vous contactera à son arrivée.</p>}
          <label className="block"><span className={lab}>Commune</span><input required className="input" value={f.commune} onChange={set('commune')} /></label>
          {method === 'home' && <label className="block"><span className={lab}>Adresse complète</span><input required autoComplete="street-address" className="input" value={f.address} onChange={set('address')} /></label>}
          <label className="block"><span className={lab}>{method === 'home' ? 'Notes de livraison (optionnel)' : 'Remarques (optionnel)'}</span><textarea className="input" rows={3} value={f.notes} onChange={set('notes')} /></label></div>)}
      </section>}

      <section className={sec}><h2 className="h mb-5 text-2xl">Paiement</h2>
        <div className="flex items-start gap-3 rounded-2xl border border-sage bg-cream p-4 text-sm"><span aria-hidden className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-sage"><span className="h-2 w-2 rounded-full bg-sage" /></span><span><b className="font-medium">{method === 'pickup' ? 'Paiement au retrait' : 'Paiement à la livraison'}</b><br /><span className="text-warm">{method === 'pickup' ? 'Vous réglez votre commande sur place, au moment du retrait.' : 'Vous réglez en espèces à la réception de votre commande.'}</span></span></div>
        <label className="mt-5 block"><span className={lab}>Code promo (optionnel)</span><input className="input uppercase" value={f.coupon} onChange={set('coupon')} /></label></section>
    </div>
    <aside className="h-fit space-y-3 rounded-3xl bg-coal p-6 text-sm lg:sticky lg:top-28 lg:col-span-2"><h2 className="h text-2xl">Résumé</h2>
      {items.map(i => <p key={i.productId + i.format} className="flex justify-between gap-3"><span>{i.name}<br /><span className="text-warm">{fmtLabel(i.format, i.size)} × {i.qty}</span></span><span className="shrink-0">{da(i.price * i.qty)}</span></p>)}
      <p className="flex justify-between border-t border-sage/10 pt-3"><span>Sous-total</span><span>{da(subtotal)}</span></p>
      {discount > 0 && <p className="flex justify-between text-sage"><span>Remise ({f.coupon.trim().toUpperCase()})</span><span>−{da(discount)}</span></p>}
      <p className="flex justify-between"><span>{method === 'pickup' ? 'Retrait sur place' : 'Livraison'}</span><span>{!method ? '—' : method === 'pickup' ? 'Gratuit' : !f.wilaya ? '—' : delivery ? da(delivery) : 'Offerte'}</span></p>
      {method && <p className="text-xs text-warm">{METHOD_LABEL[method].fr}</p>}
      <p className="flex items-baseline justify-between border-t border-sage/10 pt-3"><span className="h text-xl">Total</span><span className="h text-2xl">{da(total)}</span></p>
      <p className="text-xs text-warm">Le montant définitif (remise et livraison) est confirmé par le serveur à la validation.</p>
      {err && <p role="alert" className="text-red-700">{err}</p>}<button disabled={busy} className="btn btn-solid w-full">{busy ? 'Envoi…' : 'Confirmer ma commande'}</button></aside></form>)
}
