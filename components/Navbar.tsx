'use client'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart'
import { useFavorites } from '@/lib/favorites'
import { CATEGORIES } from '@/lib/categories'
import WilayaSelector from './WilayaSelector'
import Icon from './Icons'

const links: [string, string][] = [['/shop', 'Boutique'], ['/shop/soins-visage', 'Soins visage'], ['/shop/maquillage', 'Maquillage'], ['/shop/parfums', 'Parfums'], ['/about', 'À propos'], ['/contact', 'Contact']]

export default function Navbar() {
  const path = usePathname(); const { count } = useCart(); const { ids } = useFavorites()
  const [menu, setMenu] = useState(false)
  if (path.startsWith('/admin')) return null
  const active = (h: string) => (h === '/shop' ? path === '/shop' : path.startsWith(h))
  const Badge = ({ n }: { n: number }) => n > 0 ? <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sage px-1 text-[10px] font-medium text-cream">{n}</span> : null
  return (<>
    <div className="bg-sage px-5 py-2 text-center text-xs text-cream">Livraison disponible dans les wilayas desservies. Paiement à la livraison.</div>
    <header className="sticky top-0 z-40 border-b border-sage/10 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 md:h-20">
        <div className="flex items-center gap-3">
          <button aria-label="Ouvrir le menu" onClick={() => setMenu(true)} className="-ml-2 flex h-10 w-10 items-center justify-center md:hidden"><Icon name="menu" className="h-6 w-6" /></button>
          <Link href="/" aria-label="COSMÉTIQUE LE K — accueil"><img src="/brand/lk-logo-horizontal.png" alt="COSMÉTIQUE LE K" className="h-9 w-auto md:h-11" /></Link>
        </div>
        <nav aria-label="Navigation principale" className="hidden items-center gap-7 text-[13px] font-medium md:flex">
          {links.map(([h, l]) => <Link key={h} href={h} className={`border-b py-1 transition-colors hover:border-gold ${active(h) ? 'border-gold' : 'border-transparent'}`}>{l}</Link>)}
        </nav>
        <div className="flex items-center gap-5">
          <span className="hidden lg:block"><WilayaSelector compact /></span>
          <Link href="/favoris" aria-label={`Favoris (${ids.length})`} className="relative hidden sm:block"><Icon name="heart" className="h-6 w-6" /><Badge n={ids.length} /></Link>
          <Link href="/cart" aria-label={`Panier (${count})`} className="relative"><Icon name="bag" className="h-6 w-6" /><Badge n={count} /></Link>
        </div>
      </div>
    </header>

    {menu && (<div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-sage/50" onClick={() => setMenu(false)} />
      <div className="mobile-menu-in absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col gap-6 overflow-y-auto bg-cream p-6">
        <div className="flex items-center justify-between"><img src="/brand/lk-logo-horizontal.png" alt="COSMÉTIQUE LE K" className="h-9 w-auto" /><button aria-label="Fermer le menu" onClick={() => setMenu(false)} className="flex h-10 w-10 items-center justify-center"><Icon name="close" className="h-6 w-6" /></button></div>
        <nav className="flex flex-col text-sm font-medium">
          <Link href="/shop" onClick={() => setMenu(false)} className="border-b border-sage/10 py-3">Toute la boutique</Link>
          {CATEGORIES.map(c => <Link key={c.slug} href={`/shop/${c.slug}`} onClick={() => setMenu(false)} className="flex items-center gap-3 border-b border-sage/10 py-3"><Icon name={c.icon} className="h-5 w-5 text-taupe" />{c.name}</Link>)}
          <Link href="/about" onClick={() => setMenu(false)} className="border-b border-sage/10 py-3">À propos</Link>
          <Link href="/track-order" onClick={() => setMenu(false)} className="border-b border-sage/10 py-3">Suivre ma commande</Link>
          <Link href="/contact" onClick={() => setMenu(false)} className="py-3">Contact</Link>
        </nav>
        <WilayaSelector />
      </div>
    </div>)}

    <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-sage/10 bg-cream/95 pb-[env(safe-area-inset-bottom)] text-center text-[11px] font-medium backdrop-blur md:hidden">
      {[['/', 'Accueil', 'leaf', 0], ['/shop', 'Boutique', 'search', 0], ['/favoris', 'Favoris', 'heart', ids.length], ['/cart', 'Panier', 'bag', count]].map(([h, l, i, n]) => (
        <Link key={h as string} href={h as string} className={`relative flex flex-col items-center gap-1 py-2.5 ${(h === '/' ? path === '/' : path.startsWith(h as string)) ? 'text-sage' : 'text-sage/65'}`}>
          <span className="relative"><Icon name={i as string} className="h-5 w-5" />{(n as number) > 0 && <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sage px-1 text-[9px] text-cream">{n}</span>}</span>{l}
        </Link>))}
    </nav></>)
}
