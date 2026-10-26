import type { MetadataRoute } from 'next'
import { sbServer } from '@/lib/supabase/server'
const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await sbServer().from('products').select('slug, created_at').eq('is_active', true)
  const staticRoutes = ['', '/shop', '/shop/soins-visage', '/shop/maquillage', '/shop/soins-cheveux', '/shop/parfums', '/shop/corps', '/shop/soins-homme', '/about', '/contact', '/faq', '/track-order'].map(p => ({ url: `${site}${p}`, lastModified: new Date() }))
  const productRoutes = (data || []).map(p => ({ url: `${site}/product/${p.slug}`, lastModified: new Date(p.created_at) }))
  return [...staticRoutes, ...productRoutes]
}
