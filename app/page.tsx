import Link from 'next/link'
import { sbServer } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import Icon from '@/components/Icons'
import { CATEGORIES, PLACEHOLDER_IMG } from '@/lib/categories'
import { da, type Product } from '@/lib/format'
export const revalidate = 60

const TRUST = [
  ['truck', 'Livraison disponible', 'Dans les wilayas desservies'],
  ['cash', 'Paiement à la livraison', 'Vous payez à la réception'],
  ['box', 'Suivi de commande', 'Avec votre numéro de commande'],
  ['headset', 'Service client', 'À votre écoute'],
]

export default async function Home() {
  const [{ data }, { data: storeSetting }, { data: freeSetting }] = await Promise.all([
    sbServer().from('products').select('*').eq('is_active', true).eq('is_best_seller', true).limit(8),
    sbServer().from('settings').select('value').eq('key', 'store').maybeSingle(),
    sbServer().from('settings').select('value').eq('key', 'free_delivery_threshold').maybeSingle(),
  ])
  const products = (data || []) as Product[]
  const store = (storeSetting?.value || {}) as { instagram?: string }
  const igHandle = store.instagram?.replace(/^@/, '') || 'cosmetique.le.k'
  const free = freeSetting ? +freeSetting.value : 0
  const heroImg = products.find(p => p.images?.[0])?.images?.[0]
  return (<>
    {/* Hero */}
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 md:grid-cols-2 md:pb-24 md:pt-16">
      <div>
        <h1 className="h text-[2.6rem] leading-[1.08] md:text-6xl">Votre beauté, notre priorité.</h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-warm">Découvrez une sélection de produits cosmétiques originaux et importés pour une beauté sans compromis.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/shop" className="btn btn-solid">Découvrir la boutique</Link>
          <Link href="#meilleures-ventes" className="btn">Nos meilleures ventes</Link>
        </div>
      </div>
      <div className="relative mx-auto w-full max-w-sm md:max-w-md">
        <div className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-[2rem] bg-sand ring-1 ring-gold/50">
          <img src={heroImg || PLACEHOLDER_IMG} alt="" className={heroImg ? 'h-full w-full object-cover' : 'absolute inset-0 m-auto w-1/2 opacity-60'} />
        </div>
        <div aria-hidden className="absolute -left-5 bottom-14 h-24 w-24 rounded-full bg-mist/70 md:-left-8 md:h-28 md:w-28" />
        <div aria-hidden className="absolute -right-2 top-20 h-12 w-12 rounded-full border border-gold md:-right-5" />
      </div>
    </section>

    {/* Réassurance */}
    <section aria-label="Nos engagements" className="mx-auto max-w-7xl px-5">
      <div className="grid grid-cols-2 gap-y-6 rounded-3xl border border-sage/10 bg-coal px-4 py-7 md:grid-cols-4 md:px-8">
        {TRUST.map(([i, t, d]) => (<div key={t} className="flex flex-col items-center px-2 text-center md:flex-row md:gap-4 md:text-left">
          <Icon name={i} className="h-8 w-8 shrink-0 text-taupe" /><div className="mt-2 md:mt-0"><p className="text-sm font-medium">{t}</p><p className="mt-0.5 text-xs text-warm">{d}</p></div></div>))}
      </div>
    </section>

    {/* Catégories */}
    <section className="mx-auto mt-24 max-w-7xl px-5">
      <h2 className="h text-3xl md:text-4xl">Nos catégories</h2>
      <div className="mt-10 grid grid-cols-3 gap-x-4 gap-y-8 md:grid-cols-6">
        {CATEGORIES.map(c => (<Link key={c.slug} href={`/shop/${c.slug}`} className="group flex flex-col items-center text-center">
          <span className="flex aspect-square w-full max-w-[120px] items-center justify-center rounded-full bg-mist/30 text-sage transition-colors group-hover:bg-sand"><Icon name={c.icon} className="h-1/3 w-1/3" /></span>
          <span className="mt-3 text-sm font-medium">{c.name}</span></Link>))}
      </div>
    </section>

    {/* Meilleures ventes */}
    <section id="meilleures-ventes" className="mx-auto mt-24 max-w-7xl scroll-mt-28 px-5">
      <div className="flex items-end justify-between gap-4"><h2 className="h text-3xl md:text-4xl">Meilleures ventes</h2><Link href="/shop" className="shrink-0 border-b border-gold pb-0.5 text-sm font-medium">Tout voir</Link></div>
      {products.length ? <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{products.map(p => <ProductCard key={p.id} p={p} />)}</div>
        : <p className="mt-10 text-warm">Aucun produit pour le moment.</p>}
    </section>

    {/* Bannière promotionnelle (données réelles : seuil de livraison offerte si défini) */}
    <section className="mx-auto mt-24 max-w-7xl px-5">
      <div className="relative overflow-hidden rounded-3xl bg-sage px-8 py-14 text-cream md:px-16 md:py-20">
        <img src="/brand/lk-monogram-cream.png" alt="" aria-hidden className="pointer-events-none absolute -right-6 top-1/2 h-72 -translate-y-1/2 opacity-10 md:right-10 md:h-96" />
        <div className="relative max-w-lg">
          <h2 className="h text-3xl md:text-5xl">{free > 0 ? `Livraison offerte dès ${da(free)}` : 'Nos nouveautés'}</h2>
          <p className="mt-4 text-cream/85">{free > 0 ? 'Sur votre commande, dans les wilayas desservies.' : 'Découvrez les derniers produits ajoutés à la boutique.'}</p>
          <Link href="/shop" className="btn mt-8 border-cream bg-cream text-sage hover:border-gold hover:bg-gold">Voir la boutique</Link>
        </div>
      </div>
    </section>

    {/* La marque */}
    <section className="mx-auto mt-24 grid max-w-5xl items-center gap-10 px-5 md:grid-cols-5">
      <div className="mx-auto flex aspect-square w-48 items-center justify-center rounded-full bg-sand/50 md:col-span-2 md:w-full md:max-w-xs"><img src="/brand/lk-monogram.png" alt="" className="w-1/2" /></div>
      <div className="md:col-span-3">
        <h2 className="h text-3xl md:text-4xl">Beauty in every detail</h2>
        <p className="mt-5 leading-relaxed text-warm">COSMÉTIQUE LE K est une boutique en ligne de cosmétiques basée à Oran. Nous vous proposons une sélection soignée de produits originaux et importés, pour une expérience d&rsquo;achat simple, fiable et élégante.</p>
        <Link href="/about" className="mt-6 inline-block border-b border-gold pb-0.5 text-sm font-medium">En savoir plus</Link>
      </div>
    </section>

    {/* Instagram */}
    <section className="mx-auto mt-24 max-w-3xl px-5 text-center">
      <h2 className="h text-2xl md:text-3xl">Retrouvez-nous sur Instagram</h2>
      <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noreferrer" className="btn mt-6"><Icon name="instagram" className="h-4 w-4" />@{igHandle}</a>
    </section>
  </>)
}
