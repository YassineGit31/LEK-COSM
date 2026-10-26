'use client'
import Link from 'next/link'
import { options, da, productSoldOut, type Product } from '@/lib/format'
import { useStoreSettings } from '@/lib/store-settings'
import { useFavorites } from '@/lib/favorites'
import { PLACEHOLDER_IMG } from '@/lib/categories'
import Icon from './Icons'
export default function ProductCard({ p }: { p: Product }) {
  const { has, toggle } = useFavorites()
  const opts = options(p); const fav = has(p.id)
  const { stockManagement } = useStoreSettings()
  const soldOut = productSoldOut(p, stockManagement)
  const from = opts.length ? Math.min(...opts.map(o => o.price)) : null
  const img = p.images?.[0]
  return (<article className="group relative">
    <button aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={fav} onClick={() => toggle(p.id)} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-sage shadow-sm transition hover:bg-white">
      <Icon name="heart" filled={fav} className={`h-[18px] w-[18px] ${fav ? 'text-gold' : ''}`} /></button>
    <Link href={`/product/${p.slug}`} className="block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand/40">
        <img loading="lazy" src={img || PLACEHOLDER_IMG} alt={img ? p.name : ''} className={img ? 'h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]' : 'absolute inset-0 m-auto w-1/3 opacity-40'} />
        {p.is_new && !soldOut && <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[11px] font-medium text-sage">Nouveau</span>}
        {soldOut && <span className="absolute left-3 top-3 rounded-full bg-cream px-3 py-1 text-[11px] font-medium text-sage">{stockManagement ? 'Rupture de stock' : 'Indisponible'}</span>}
      </div>
      <div className="mt-4 px-1">
        <p className="text-xs text-sage/75">{p.brand}</p>
        <h3 className="h mt-0.5 text-lg leading-snug decoration-gold underline-offset-4 group-hover:underline">{p.name}</h3>
        {from != null && <p className="mt-2 text-sm font-medium">{opts.length > 1 && <span className="font-normal text-sage/75">À partir de </span>}{da(from)}</p>}
      </div>
    </Link></article>)
}
