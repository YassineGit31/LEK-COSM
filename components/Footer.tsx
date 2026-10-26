'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { sb } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/categories'
import Icon from './Icons'
export default function Footer() {
  const [store, setStore] = useState<{ instagram?: string; tiktok?: string; facebook?: string; whatsapp?: string }>({})
  useEffect(() => { sb().from('settings').select('value').eq('key', 'store').maybeSingle().then(({ data }) => setStore(data?.value || {})) }, [])
  if (usePathname().startsWith('/admin')) return null
  const clean = (h?: string) => h?.replace(/^@/, '').trim() || ''
  const links = [
    store.instagram && { label: 'Instagram', href: `https://instagram.com/${clean(store.instagram)}`, icon: 'instagram' },
    store.whatsapp && { label: 'WhatsApp', href: `https://wa.me/${store.whatsapp.replace(/\D/g, '')}`, icon: 'whatsapp' },
    store.tiktok && { label: 'TikTok', href: `https://tiktok.com/@${clean(store.tiktok)}` },
    store.facebook && { label: 'Facebook', href: `https://facebook.com/${clean(store.facebook)}` },
  ].filter(Boolean) as { label: string; href: string; icon?: string }[]
  const col = 'space-y-3 text-sm'; const a = 'block text-cream/80 transition-colors hover:text-gold'; const hd = 'mb-4 font-serif text-lg text-cream'
  return (<footer className="mt-24 bg-sage text-cream">
    <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-12">
      <div className="md:col-span-4">
        <img src="/brand/lk-logo-horizontal-cream.png" alt="COSMÉTIQUE LE K" className="h-14 w-auto" />
        <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/80">Boutique de cosmétiques basée à Oran, Algérie. Livraison disponible et paiement à la livraison.</p>
      </div>
      <div className={`${col} md:col-span-2`}><p className={hd}>Boutique</p>{CATEGORIES.map(c => <Link key={c.slug} className={a} href={`/shop/${c.slug}`}>{c.name}</Link>)}</div>
      <div className={`${col} md:col-span-3`}><p className={hd}>Aide</p>
        <Link className={a} href="/track-order">Suivre ma commande</Link><Link className={a} href="/faq">Livraison, paiement et FAQ</Link><Link className={a} href="/about">À propos</Link><Link className={a} href="/contact">Nous contacter</Link></div>
      <div className={`${col} md:col-span-3`}><p className={hd}>Suivez-nous</p>
        {links.length ? links.map(l => <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={`${a} flex items-center gap-2`}>{l.icon && <Icon name={l.icon} className="h-4 w-4" />}{l.label}</a>) : <Link className={a} href="/contact">Nous écrire</Link>}
        <p className="flex items-center gap-2 pt-2 text-cream/80"><Icon name="pin" className="h-4 w-4" />Oran, Algérie</p></div>
    </div>
    <div className="border-t border-cream/15 px-5 py-5 text-center text-xs text-cream/70 pb-24 md:pb-5">© {new Date().getFullYear()} COSMÉTIQUE LE K. Tous droits réservés.</div>
  </footer>)
}
