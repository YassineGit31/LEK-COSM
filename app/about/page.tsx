import type { Metadata } from 'next'
import Link from 'next/link'
import Icon from '@/components/Icons'
export const metadata: Metadata = { title: 'À propos', description: 'COSMÉTIQUE LE K, boutique de cosmétiques basée à Oran, Algérie.' }
const VALUES = [['leaf', 'Naturelle', 'Une beauté simple et authentique'], ['check', 'Accessible', 'Une expérience d’achat fiable'], ['heart', 'Élégante', 'Des détails soignés, du choix au colis']]
export default function About() {
  return (<div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
    <div className="grid items-center gap-10 md:grid-cols-5">
      <div className="md:col-span-3"><h1 className="h text-4xl leading-tight md:text-5xl">Votre beauté, notre priorité.</h1>
        <div className="mt-7 max-w-prose space-y-5 leading-relaxed text-sage/85">
          <p>COSMÉTIQUE LE K est une boutique en ligne de cosmétiques basée à Oran, en Algérie. Nous proposons une sélection soignée de produits originaux et importés, pour une beauté sans compromis.</p>
          <p>Notre objectif : vous offrir une expérience d&rsquo;achat simple, fiable et élégante, avec des produits de qualité pour toutes vos envies beauté. Commandez en quelques clics et payez à la livraison.</p>
          <p>Une question sur un produit ou une commande ? Notre équipe reste à votre écoute.</p></div>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/shop" className="btn btn-solid">Découvrir la boutique</Link><Link href="/contact" className="btn">Nous contacter</Link></div></div>
      <div className="mx-auto flex aspect-square w-56 items-center justify-center rounded-full bg-sand/50 md:col-span-2 md:w-full"><img src="/brand/lk-monogram.png" alt="" className="w-1/2" /></div></div>
    <div className="mt-16 grid gap-4 sm:grid-cols-3">{VALUES.map(([i, t, d]) => <div key={t} className="rounded-3xl bg-white p-6"><Icon name={i} className="h-7 w-7 text-taupe" /><p className="h mt-4 text-xl">{t}</p><p className="mt-1 text-sm text-sage/75">{d}</p></div>)}</div>
  </div>)
}
