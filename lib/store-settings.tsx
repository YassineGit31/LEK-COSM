'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { sb } from './supabase/client'

export interface Pickup { enabled: boolean; name: string; address: string; hours: string; instructions: string }
export const EMPTY_PICKUP: Pickup = { enabled: false, name: '', address: '', hours: '', instructions: '' }
interface Ctx { loaded: boolean; stockManagement: boolean; pickup: Pickup; freeThreshold: number; whatsapp: string }

// Réglages publics lus dans Supabase (table `settings`, lecture publique). Rien n'est stocké en localStorage.
// Tant que la lecture n'est pas terminée, on suppose « gestion du stock ON » (comportement historique) ;
// de toute façon, place_order() refait toutes les vérifications côté serveur.
const Ctx = createContext<Ctx>({ loaded: false, stockManagement: true, pickup: EMPTY_PICKUP, freeThreshold: 0, whatsapp: '' })
export const useStoreSettings = () => useContext(Ctx)

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [v, setV] = useState<Ctx>({ loaded: false, stockManagement: true, pickup: EMPTY_PICKUP, freeThreshold: 0, whatsapp: '' })
  useEffect(() => {
    sb().from('settings').select('key,value').in('key', ['stock_management', 'pickup', 'free_delivery_threshold', 'store']).then(({ data }) => {
      const next: Ctx = { loaded: true, stockManagement: true, pickup: EMPTY_PICKUP, freeThreshold: 0, whatsapp: '' }
      data?.forEach((s: any) => {
        if (s.key === 'stock_management') next.stockManagement = !(s.value === false || s.value === 'false')
        if (s.key === 'pickup') next.pickup = { ...EMPTY_PICKUP, ...(s.value || {}) }
        if (s.key === 'free_delivery_threshold') next.freeThreshold = +s.value || 0
        if (s.key === 'store') next.whatsapp = String(s.value?.whatsapp || '')
      })
      setV(next)
    })
  }, [])
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}
