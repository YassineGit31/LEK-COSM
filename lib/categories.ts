// Catégories de la boutique. Les slugs correspondent aux lignes de la table `categories`
// (voir supabase/migration_cosmetics_categories.sql). Les anciennes routes par genre
// (/shop/homme|femme|unisex) continuent de fonctionner.
export const CATEGORIES = [
  { slug: 'soins-visage', name: 'Soins visage', icon: 'face' },
  { slug: 'maquillage', name: 'Maquillage', icon: 'lipstick' },
  { slug: 'soins-cheveux', name: 'Soins cheveux', icon: 'hair' },
  { slug: 'parfums', name: 'Parfums', icon: 'perfume' },
  { slug: 'corps', name: 'Corps', icon: 'body' },
  { slug: 'soins-homme', name: 'Soins homme', icon: 'man' },
] as const
export const GENDERS = ['homme', 'femme', 'unisex'] as const
export const PLACEHOLDER_IMG = '/brand/lk-monogram.png'
