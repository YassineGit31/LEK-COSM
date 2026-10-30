'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { sb } from '@/lib/supabase/client'

// Compte les visiteurs uniques par jour (anonyme : identifiant aléatoire local, aucune donnée personnelle).
// Ne compte pas l'espace admin ni les robots.
export default function VisitTracker() {
  const path = usePathname()
  useEffect(() => {
    if (path.startsWith('/admin')) return
    try {
      if (/bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent) || (navigator as any).webdriver) return
      let id = localStorage.getItem('wp_vid')
      if (!id) { id = (crypto as any).randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('wp_vid', id) }
      sb().rpc('track_visit', { p_visitor: id }).then(() => {}, () => {})
    } catch {}
  }, [path])
  return null
}
