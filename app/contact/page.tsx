'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/supabase/client'
import Icon from '@/components/Icons'

export default function Contact() {
  const [f, setF] = useState({ name: '', phone: '', email: '', subject: '', body: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [store, setStore] = useState<{ instagram?: string; whatsapp?: string }>({})
  useEffect(() => { sb().from('settings').select('value').eq('key', 'store').maybeSingle().then(({ data }) => setStore(data?.value || {})) }, [])
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true)
    const { error } = await sb().from('messages').insert({ name: f.name, phone: f.phone || null, email: f.email || null, subject: f.subject || null, body: f.body })
    setBusy(false)
    if (error) return setErr('Une erreur est survenue. Veuillez réessayer.')
    setDone(true)
  }
  const lab = 'mb-1.5 block text-sm font-medium'
  const direct = [
    store.whatsapp && { label: 'WhatsApp', href: `https://wa.me/${store.whatsapp.replace(/\D/g, '')}`, icon: 'whatsapp' },
    store.instagram && { label: 'Instagram', href: `https://instagram.com/${store.instagram.replace(/^@/, '').trim()}`, icon: 'instagram' },
  ].filter(Boolean) as { label: string; href: string; icon: string }[]

  if (done) return (<div className="mx-auto max-w-lg px-5 py-28 text-center">
    <h1 className="h text-4xl">Message envoyé</h1>
    <p className="mt-3 text-sage/75">Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.</p>
  </div>)

  return (<div className="mx-auto max-w-2xl px-5 py-14 md:py-20">
    <h1 className="h text-4xl md:text-5xl">Contact</h1>
    <p className="mt-3 text-sage/75">Une question sur un produit, une commande ou une livraison ? Écrivez-nous.</p>
    {!!direct.length && <div className="mt-6 flex flex-wrap gap-3">{direct.map(d => <a key={d.label} href={d.href} target="_blank" rel="noreferrer" className="btn btn-sm"><Icon name={d.icon} className="h-4 w-4" />{d.label}</a>)}</div>}
    <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl bg-white p-6 md:p-8">
      <label className="block"><span className={lab}>Nom et prénom</span><input required className="input" value={f.name} onChange={set('name')} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className={lab}>Téléphone</span><input className="input" inputMode="tel" value={f.phone} onChange={set('phone')} /></label>
        <label className="block"><span className={lab}>Email (optionnel)</span><input className="input" type="email" value={f.email} onChange={set('email')} /></label></div>
      <label className="block"><span className={lab}>Sujet</span><input className="input" value={f.subject} onChange={set('subject')} /></label>
      <label className="block"><span className={lab}>Votre message</span><textarea required className="input" rows={5} value={f.body} onChange={set('body')} /></label>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="btn btn-solid w-full">{busy ? 'Envoi…' : 'Envoyer le message'}</button>
    </form>
  </div>)
}
