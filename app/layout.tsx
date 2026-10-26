import './globals.css'
import type { Metadata } from 'next'
import { Playfair_Display, Montserrat } from 'next/font/google'
import { CartProvider } from '@/lib/cart'
import { FavoritesProvider } from '@/lib/favorites'
import { WilayaProvider } from '@/lib/wilaya'
import { StoreSettingsProvider } from '@/lib/store-settings'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
// Playfair Display : titres élégants. Montserrat : navigation, boutons, texte.
const serif = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-serif', display: 'swap' })
const sans = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sans', display: 'swap' })
export const metadata: Metadata = {
  title: { default: 'COSMÉTIQUE LE K — Beauty in every detail', template: '%s — COSMÉTIQUE LE K' },
  description: 'Boutique de cosmétiques à Oran, Algérie. Livraison disponible et paiement à la livraison.',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="fr" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('wp_theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}" }} /></head><body className={`${serif.variable} ${sans.variable}`}><StoreSettingsProvider><WilayaProvider><CartProvider><FavoritesProvider><Navbar /><main className="min-h-screen pb-20 md:pb-0">{children}</main><Footer /></FavoritesProvider></CartProvider></WilayaProvider></StoreSettingsProvider></body></html>)
}
