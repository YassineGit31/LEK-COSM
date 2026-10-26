'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { useWilaya } from '@/lib/wilaya'
import { useStoreSettings } from '@/lib/store-settings'
import { options, da, fmtLabel, optBuyable, type Product, type Fmt } from '@/lib/format'
import { PLACEHOLDER_IMG } from '@/lib/categories'
import WilayaSelector from './WilayaSelector'
import Icon from './Icons'
export default function ProductClient({ p }: { p: Product }) {
  const opts = options(p); const first = opts.find(o => o.stock > 0)?.format ?? opts[0]?.format
  const [fmt, setFmt] = useState<Fmt | undefined>(first); const [qty, setQty] = useState(1); const [img, setImg] = useState(0)
  const { add } = useCart(); const router = useRouter()
  const { wilaya, fee, isServed, officeFee, homeFee } = useWilaya()
  const { stockManagement } = useStoreSettings()
  const cur = opts.find(o => o.format === fmt)
  // Mode stock ON : le stock décide. Mode OFF : seule la disponibilité manuelle décide (jamais la quantité).
  const canBuy = !!cur && optBuyable(p, cur, stockManagement)
  const unavailableLabel = stockManagement ? 'Rupture de stock' : 'Indisponible'
  const maxQty = stockManagement ? Math.max(1, cur?.stock || 1) : 99
  const imgs = p.images?.length ? p.images : []
  const notes = [['Tête', p.top_notes], ['Cœur', p.heart_notes], ['Fond', p.base_notes]] as [string, string[]][]
  const hasNotes = notes.some(([, n]) => n?.length)
  const item = () => ({ productId: p.id, slug: p.slug, name: p.name, brand: p.brand, image: p.images?.[0] ?? null, format: cur!.format, size: cur!.size, price: cur!.price })
  const stockMsg = !cur ? '' : !canBuy ? (stockManagement ? 'Rupture de stock' : 'Ce produit est actuellement indisponible') : !stockManagement ? 'Disponible' : cur.stock <= 5 ? `Plus que ${cur.stock} en stock` : 'En stock'
  return (<div className="mx-auto max-w-7xl px-5 py-8 md:py-12">
    <nav aria-label="Fil d'Ariane" className="mb-6 flex items-center gap-2 text-xs text-sage/75"><Link href="/shop" className="hover:underline">Boutique</Link><Icon name="chevron" className="h-3 w-3" /><span className="truncate text-sage">{p.name}</span></nav>
    <div className="grid gap-10 md:grid-cols-2 md:gap-14">
      <div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand/40">
          <img src={imgs[img] || PLACEHOLDER_IMG} alt={imgs.length ? p.name : ''} className={imgs.length ? 'h-full w-full object-cover' : 'absolute inset-0 m-auto w-1/3 opacity-40'} />
        </div>
        {imgs.length > 1 && <div className="mt-3 grid grid-cols-5 gap-3">{imgs.slice(0, 5).map((src, i) => <button key={src + i} aria-label={`Photo ${i + 1}`} onClick={() => setImg(i)} className={`aspect-square overflow-hidden rounded-xl border-2 bg-sand/40 ${i === img ? 'border-sage' : 'border-transparent'}`}><img src={src} alt="" className="h-full w-full object-cover" /></button>)}</div>}
      </div>
      <div>
        <p className="text-sm text-sage/75">{p.brand}</p>
        <h1 className="h mt-1 text-4xl leading-tight md:text-5xl">{p.name}</h1>
        {cur && <p className="mt-5 text-2xl font-medium">{da(cur.price)}</p>}
        {cur && <p role={canBuy ? undefined : 'status'} className={`mt-1 text-sm ${!canBuy ? 'font-medium text-red-700' : 'text-sage/75'}`}>{stockMsg}</p>}

        {opts.length > 1 && <fieldset className="mt-8"><legend className="text-sm font-medium">Format</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{opts.map(o => (
            <button key={o.format} type="button" aria-pressed={fmt === o.format} disabled={!optBuyable(p, o, stockManagement)} onClick={() => { setFmt(o.format); setQty(1) }} className={`rounded-2xl border p-4 text-left transition disabled:opacity-40 ${fmt === o.format ? 'border-sage bg-white ring-1 ring-sage' : 'border-sage/20 bg-white hover:border-sage/60'}`}>
              <p className="text-sm font-medium">{fmtLabel(o.format, o.size)}</p><p className="mt-1 text-sm text-sage/75">{da(o.price)}{!optBuyable(p, o, stockManagement) && ` · ${unavailableLabel}`}</p></button>))}</div></fieldset>}
        {opts.length === 1 && cur && /\d\s*(ml|cl|l|g|kg)\b/i.test(cur.size) && <p className="mt-6 text-sm text-sage/75">Contenance : {cur.size}</p>}

        <p className="mt-8 text-sm font-medium">Quantité</p>
        <div className="mt-3 inline-flex items-center rounded-full border border-sage/25 bg-white">
          <button aria-label="Diminuer la quantité" className="h-11 w-11 text-lg" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
          <button aria-label="Augmenter la quantité" className="h-11 w-11 text-lg" onClick={() => setQty(Math.min(maxQty, qty + 1))}>+</button></div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button disabled={!canBuy} className="btn" onClick={() => add(item(), qty)}>Ajouter au panier</button>
          <button disabled={!canBuy} className="btn btn-solid" onClick={() => { add(item(), qty); router.push('/checkout') }}>Acheter maintenant</button></div>

        <div className="mt-8 space-y-4 rounded-2xl bg-white p-5 text-sm">
          <p className="flex items-start gap-3"><Icon name="truck" className="mt-0.5 h-5 w-5 shrink-0 text-taupe" /><span>
            {wilaya ? (isServed ? (fee != null ? <>Livraison vers <b className="font-medium">{wilaya}</b> : {officeFee != null && homeFee != null && officeFee !== homeFee ? <>bureau {da(officeFee)} · domicile {da(homeFee)}</> : da(fee)}</> : <>Livraison vers <b className="font-medium">{wilaya}</b></>) : <span className="text-red-700">Livraison indisponible vers {wilaya}</span>) : 'Choisissez votre wilaya pour connaître le frais de livraison.'}
            <span className="block text-sage/75">Délai estimé : 2 à 5 jours ouvrés.</span></span></p>
          {!wilaya && <WilayaSelector />}
          <p className="flex items-center gap-3"><Icon name="cash" className="h-5 w-5 shrink-0 text-taupe" />Paiement à la livraison</p>
        </div>

        {p.description && <div className="mt-10"><h2 className="h text-2xl">Description</h2><p className="mt-3 max-w-prose leading-relaxed text-sage/85">{p.description}</p></div>}
        {hasNotes && <div className="mt-10"><h2 className="h text-2xl">Notes olfactives</h2><div className="mt-4 grid grid-cols-3 gap-3">{notes.map(([t, n]) => <div key={t} className="rounded-2xl border border-sage/15 bg-white p-4"><p className="text-xs font-medium text-sage/75">{t}</p><p className="mt-1 text-sm">{n?.join(', ') || '—'}</p></div>)}</div></div>}
      </div>
    </div></div>)
}
