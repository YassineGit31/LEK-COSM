import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sbServer } from '@/lib/supabase/server'
import ShopClient from '@/components/ShopClient'
import { CATEGORIES, GENDERS } from '@/lib/categories'
import type { Product } from '@/lib/format'
export const revalidate = 60
const resolve = (g?: string) => {
  if (!g) return { title: 'Toute la boutique', cat: undefined, gender: undefined }
  const cat = CATEGORIES.find(c => c.slug === g)
  if (cat) return { title: cat.name, cat, gender: undefined }
  if ((GENDERS as readonly string[]).includes(g)) return { title: `Parfums ${g}`, cat: undefined, gender: g }
  return null
}
export function generateMetadata({ params }: { params: { gender?: string[] } }): Metadata { const r = resolve(params.gender?.[0]); return { title: r?.title } }
export default async function Shop({ params }: { params: { gender?: string[] } }) {
  const g = params.gender?.[0]; const r = resolve(g); if (!r) notFound()
  let q = sbServer().from('products').select('*').eq('is_active', true)
  if (r.gender) q = q.eq('gender', r.gender)
  if (r.cat) {
    const { data: c } = await sbServer().from('categories').select('id').eq('slug', r.cat.slug).maybeSingle()
    q = q.eq('category_id', c?.id ?? -1) // catégorie pas encore créée en base : aucun produit
  }
  const { data } = await q
  return <ShopClient products={(data || []) as Product[]} title={r.title} active={r.cat?.slug} />
}
