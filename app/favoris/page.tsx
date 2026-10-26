'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { sb } from '@/lib/supabase/client'
import { useFavorites } from '@/lib/favorites'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/lib/format'
export default function Favoris() {
  const { ids } = useFavorites()
  const [products, setProducts] = useState<Product[]>([])
  useEffect(() => { if (!ids.length) return setProducts([]); sb().from('products').select('*').in('id', ids).then(({ data }) => setProducts((data || []) as Product[])) }, [ids])
  if (!ids.length) return <div className="mx-auto max-w-md px-5 py-28 text-center"><h1 className="h text-4xl">Aucun favori pour le moment</h1><p className="mt-3 text-sage/75">Touchez le cœur d&rsquo;un produit pour le retrouver ici.</p><Link href="/shop" className="btn btn-solid mt-8">Découvrir la boutique</Link></div>
  return (<div className="mx-auto max-w-7xl px-5 py-10 md:py-14"><h1 className="h mb-10 text-4xl md:text-5xl">Mes favoris</h1>
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{products.map(p => <ProductCard key={p.id} p={p} />)}</div></div>)
}
