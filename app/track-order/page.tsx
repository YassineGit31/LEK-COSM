'use client'
import { useState } from 'react'
import { sb } from '@/lib/supabase/client'
import { da, fmtLabel } from '@/lib/format'
const steps = [['nouvelle', 'Commande reçue'], ['confirmee', 'Commande confirmée'], ['en_preparation', 'En préparation'], ['expediee', 'Expédiée'], ['livree', 'Livrée']]
export default function Track() {
  const [n, setN] = useState(''); const [ph, setPh] = useState(''); const [o, setO] = useState<any>(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function go(e: React.FormEvent) { e.preventDefault(); setBusy(true); setErr(''); setO(null)
    const { data } = await sb().rpc('track_order', { p_number: n.trim(), p_phone: ph.replace(/\s/g, '') }); setBusy(false)
    data ? setO(data) : setErr('Aucune commande trouvée. Vérifiez le numéro et le téléphone.') }
  const idx = o ? Math.max(steps.findIndex(s => s[0] === o.status), o.status === 'a_confirmer' ? 0 : -1) : -1
  return (<div className="mx-auto max-w-xl px-5 py-14 md:py-20"><h1 className="h text-4xl md:text-5xl">Suivi de commande</h1>
    <p className="mt-3 text-warm">Saisissez votre numéro de commande et le téléphone utilisé lors de la commande.</p>
    <form onSubmit={go} className="mt-8 space-y-3 rounded-3xl bg-coal p-6"><label className="block"><span className="mb-1.5 block text-sm font-medium">Numéro de commande</span><input required className="input" value={n} onChange={e => setN(e.target.value)} /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium">Téléphone</span><input required inputMode="tel" className="input" value={ph} onChange={e => setPh(e.target.value)} /></label>
      <button disabled={busy} className="btn btn-solid w-full">{busy ? 'Recherche…' : 'Suivre'}</button></form>
    {err && <p role="alert" className="mt-4 text-red-700">{err}</p>}
    {o && <div className="mt-10">{['annulee', 'refusee'].includes(o.status) ? <p className="rounded-2xl border border-red-700/40 bg-coal p-4 text-red-700">Commande {o.status === 'annulee' ? 'annulée' : 'refusée'}.</p> :
      <ol className="space-y-5">{steps.map(([k, l], i) => <li key={k} className="flex items-center gap-4"><span className={`h-4 w-4 rounded-full border ${i <= idx ? 'border-sage bg-sage' : 'border-sage/30'}`} /><span className={i <= idx ? 'font-medium' : 'text-warm'}>{l}</span></li>)}</ol>}
      <div className="mt-8 space-y-1 border-t border-sage/10 pt-4 text-sm">{o.items.map((i: any, k: number) => <p key={k} className="flex justify-between gap-3"><span>{i.name}, {fmtLabel(i.format, i.size)} × {i.quantity}</span><span className="shrink-0">{da(i.subtotal)}</span></p>)}<p className="flex items-baseline justify-between pt-2"><span className="h text-lg">Total</span><span className="h text-2xl">{da(o.total)}</span></p></div></div>}</div>)
}
