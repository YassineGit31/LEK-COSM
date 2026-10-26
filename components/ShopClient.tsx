'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import ProductCard from './ProductCard'
import Icon from './Icons'
import { CATEGORIES } from '@/lib/categories'
import { options, productSoldOut, type Product } from '@/lib/format'
import { useStoreSettings } from '@/lib/store-settings'
export default function ShopClient({ products, title, active }: { products: Product[]; title: string; active?: string }) {
  const { stockManagement } = useStoreSettings()
  const [q, setQ] = useState(''); const [sort, setSort] = useState('new'); const [max, setMax] = useState(0); const [inStock, setInStock] = useState(false)
  const minPrice = (p: Product) => Math.min(...options(p).map(o => o.price))
  const list = useMemo(() => {
    const l = products.filter(p => (p.name + p.brand).toLowerCase().includes(q.toLowerCase()) && (!max || minPrice(p) <= max) && (!inStock || !productSoldOut(p, stockManagement)))
    const s: Record<string, (a: Product, b: Product) => number> = { new: (a, b) => +new Date(b.created_at) - +new Date(a.created_at), asc: (a, b) => minPrice(a) - minPrice(b), desc: (a, b) => minPrice(b) - minPrice(a), best: (a, b) => +b.is_best_seller - +a.is_best_seller, az: (a, b) => a.name.localeCompare(b.name) }
    return [...l].sort(s[sort])
  }, [products, q, sort, max, inStock, stockManagement])
  const chip = (on: boolean) => `whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${on ? 'border-sage bg-sage text-cream' : 'border-sage/25 bg-white hover:border-sage'}`
  return (<div className="mx-auto max-w-7xl px-5 py-10 md:py-14">
    <h1 className="h text-4xl md:text-5xl">{title}</h1>
    <p id="best" className="mt-2 text-sm text-sage/75" aria-live="polite">{list.length} {list.length > 1 ? 'produits' : 'produit'}</p>
    <nav aria-label="Catégories" className="-mx-5 mt-7 flex gap-2 overflow-x-auto px-5 pb-1">
      <Link href="/shop" className={chip(!active && title === 'Toute la boutique')}>Tout</Link>
      {CATEGORIES.map(c => <Link key={c.slug} href={`/shop/${c.slug}`} className={chip(active === c.slug)}>{c.name}</Link>)}
    </nav>
    <div className="my-8 grid gap-3 md:grid-cols-4">
      <label className="relative"><span className="sr-only">Rechercher</span><Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" /><input className="input pl-11" placeholder="Rechercher un produit" value={q} onChange={e => setQ(e.target.value)} /></label>
      <select aria-label="Prix" className="input" value={max} onChange={e => setMax(+e.target.value)}><option value={0}>Tous les prix</option><option value={2000}>≤ 2 000 DA</option><option value={5000}>≤ 5 000 DA</option><option value={10000}>≤ 10 000 DA</option></select>
      <select aria-label="Trier par" className="input" value={sort} onChange={e => setSort(e.target.value)}><option value="new">Nouveautés</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option><option value="best">Meilleures ventes</option><option value="az">Ordre alphabétique</option></select>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-sage" checked={inStock} onChange={e => setInStock(e.target.checked)} />{stockManagement ? 'En stock uniquement' : 'Disponibles uniquement'}</label>
    </div>
    {list.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{list.map(p => <ProductCard key={p.id} p={p} />)}</div>
      : <div className="py-24 text-center"><p className="h text-2xl">Aucun produit ne correspond.</p><p className="mt-2 text-sm text-sage/75">Modifiez votre recherche ou vos filtres.</p><Link href="/shop" className="btn mt-6">Voir toute la boutique</Link></div>}
  </div>)
}
