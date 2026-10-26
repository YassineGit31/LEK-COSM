'use client'
import { useState } from 'react'
import { useWilaya } from '@/lib/wilaya'
import { da } from '@/lib/format'
import Icon from './Icons'

export default function WilayaSelector({ compact = false }: { compact?: boolean }) {
  const { wilaya, setWilaya, wilayas, isServed, officeFee, homeFee, officeOk, homeOk, loading } = useWilaya()
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open} className={`flex items-center gap-2 text-[13px] font-medium transition hover:text-gold ${compact ? 'px-0' : 'w-full rounded-xl border border-sage/20 bg-white px-4 py-3'}`}
      >
        <Icon name="pin" className="h-4 w-4" />
        <span className="max-w-[9rem] truncate">{wilaya || 'Livraison : ma wilaya'}</span>
        {loading && <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-2xl border border-sage/15 bg-white shadow-lg">
          <div className="sticky top-0 border-b border-sage/10 bg-white p-3 text-xs text-sage/75">Choisissez votre wilaya de livraison</div>
          {wilayas.map(w => (
            <button
              key={w.id}
              onClick={() => { setWilaya(w.name); setOpen(false) }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-sand/30 ${wilaya === w.name ? 'bg-sand/40 font-medium' : ''}`}
            >
              {w.code}. {w.name}
            </button>
          ))}
        </div>
      )}
      {wilaya && !loading && (
        <p className="mt-1 text-xs text-sage/75">
          {isServed ? (<>
            {officeOk && officeFee != null && <span className="block">Bureau : <span className="font-medium">{da(officeFee)}</span></span>}
            {homeOk && homeFee != null && <span className="block">Domicile : <span className="font-medium">{da(homeFee)}</span></span>}
          </>) : <span className="text-red-700">Livraison indisponible pour cette wilaya</span>}
        </p>
      )}
    </div>
  )
}
