'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { sb } from './supabase/client'
import { WILAYAS } from './format'

export interface WilayaRow { id: number; code: number; name: string }
interface WilayaCtx {
  wilaya: string
  setWilaya: (w: string) => void
  wilayas: WilayaRow[]
  /** Plus petit frais parmi les modes disponibles (indicatif, pour la navbar/fiche produit/panier). */
  fee: number | null
  /** true si au moins un mode de livraison (bureau ou domicile) est disponible dans la wilaya. */
  isServed: boolean
  officeFee: number | null
  homeFee: number | null
  officeOk: boolean
  homeOk: boolean
  loading: boolean
}
const Ctx = createContext<WilayaCtx | null>(null)
export const useWilaya = () => useContext(Ctx) as WilayaCtx

// Les frais affichés ici sont purement indicatifs (UX). La source de vérité reste la fonction SQL
// place_order(), qui recalcule le frais côté serveur à partir de la wilaya et du mode choisis,
// sans jamais faire confiance à ce que le navigateur envoie.
export function WilayaProvider({ children }: { children: React.ReactNode }) {
  const [wilaya, setWilayaState] = useState('')
  const [wilayas, setWilayas] = useState<WilayaRow[]>(WILAYAS.map((name, i) => ({ id: i + 1, code: i + 1, name })))
  const [o, setO] = useState<{ officeFee: number | null; homeFee: number | null; officeOk: boolean; homeOk: boolean }>({ officeFee: null, homeFee: null, officeOk: true, homeOk: true })
  const [loading, setLoading] = useState(false)
  const reqId = useRef(0)

  useEffect(() => {
    try { const w = localStorage.getItem('wp_wilaya'); if (w) setWilayaState(w) } catch {}
    sb().from('wilayas').select('id,code,name').order('code').then(({ data }) => { if (data?.length) setWilayas(data) })
  }, [])

  const load = useCallback(async (w: string) => {
    const id = ++reqId.current
    if (!w) { setO({ officeFee: null, homeFee: null, officeOk: true, homeOk: true }); return }
    setLoading(true)
    let next = null as null | { officeFee: number | null; homeFee: number | null; officeOk: boolean; homeOk: boolean }
    const r = await sb().rpc('get_delivery_options', { p_wilaya_name: w }).maybeSingle()
    if (!r.error && r.data) {
      const d = r.data as any
      next = { officeFee: d.office_fee, homeFee: d.home_fee, officeOk: !!d.office_ok, homeOk: !!d.home_ok }
    } else {
      // Repli (base pas encore migrée) : ancienne fonction à tarif unique.
      const old = await sb().rpc('get_delivery_fee', { p_wilaya_name: w }).maybeSingle()
      if (!old.error && old.data) { const d = old.data as any; next = { officeFee: d.fee, homeFee: d.fee, officeOk: !!d.is_served, homeOk: !!d.is_served } }
    }
    if (id !== reqId.current) return // une réponse plus récente existe : on ignore celle-ci
    if (next) setO(next)
    setLoading(false)
  }, [])
  useEffect(() => { load(wilaya) }, [wilaya, load])

  const setWilaya = (w: string) => { setWilayaState(w); try { localStorage.setItem('wp_wilaya', w) } catch {} }
  const avail = [o.officeOk ? o.officeFee : null, o.homeOk ? o.homeFee : null].filter((x): x is number => x != null)
  const fee = avail.length ? Math.min(...avail) : null
  const isServed = o.officeOk || o.homeOk
  return <Ctx.Provider value={{ wilaya, setWilaya, wilayas, fee, isServed, ...o, loading }}>{children}</Ctx.Provider>
}
