'use client'
import { useEffect, useMemo, useState } from 'react'
import { sb } from '@/lib/supabase/client'
import { StatCard, Card, EmptyState } from '@/components/admin/Widgets'

interface Day { day: string; visitors: number; page_views: number }
const fmtDay = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })

export default function Visitors() {
  const [rows, setRows] = useState<Day[]>([])
  const [range, setRange] = useState(30)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    (async () => {
      setLoading(true); setErr('')
      const { data, error } = await sb().rpc('visits_daily', { p_days: 90 })
      if (error) setErr(`Impossible de charger les visites : ${error.message}. Avez-vous exécuté supabase/migration_visits.sql ?`)
      setRows(((data as any[]) || []).map(r => ({ day: String(r.day), visitors: Number(r.visitors), page_views: Number(r.page_views) })))
      setLoading(false)
    })()
  }, [])

  // rows : du plus récent au plus ancien
  const shown = useMemo(() => rows.slice(0, range), [rows, range])
  const sum = (n: number, k: 'visitors' | 'page_views') => rows.slice(0, n).reduce((s, r) => s + r[k], 0)
  const today = rows[0]?.visitors ?? 0, yesterday = rows[1]?.visitors ?? 0
  const maxV = Math.max(1, ...shown.map(r => r.visitors))
  const chart = [...shown].reverse()

  return (<div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="h text-3xl">Visiteurs</h1>
      <select aria-label="Période" className="input !w-auto" value={range} onChange={e => setRange(+e.target.value)}>
        <option value={7}>7 derniers jours</option><option value={14}>14 derniers jours</option><option value={30}>30 derniers jours</option><option value={90}>90 derniers jours</option>
      </select>
    </div>
    {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
    {loading ? <p className="text-sm text-warm">Chargement…</p> : !rows.length && !err ? <EmptyState text="Aucune visite enregistrée pour le moment." /> : (<>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Aujourd'hui" value={today} sub="visiteurs uniques" />
        <StatCard label="Hier" value={yesterday} sub="visiteurs uniques" />
        <StatCard label="7 derniers jours" value={sum(7, 'visitors')} sub={`${sum(7, 'page_views')} pages vues`} />
        <StatCard label="30 derniers jours" value={sum(30, 'visitors')} sub={`${sum(30, 'page_views')} pages vues`} />
      </div>
      <Card title={`Visiteurs uniques par jour — ${range} jours`}>
        <div className="flex h-44 items-end gap-1" role="img" aria-label="Histogramme des visiteurs par jour">
          {chart.map(r => (<div key={r.day} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${fmtDay(r.day)} : ${r.visitors} visiteur(s)`}>
            <div className="w-full bg-gold" style={{ height: `${Math.max(r.visitors ? 3 : 0, (r.visitors / maxV) * 100)}%` }} />
          </div>))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-warm"><span>{chart[0] && fmtDay(chart[0].day)}</span><span>{chart.length && fmtDay(chart[chart.length - 1].day)}</span></div>
      </Card>
      <Card title="Détail par jour">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-widest text-warm"><tr><th className="p-2">Jour</th><th className="p-2">Visiteurs uniques</th><th className="p-2">Pages vues</th></tr></thead>
          <tbody>{shown.map(r => <tr key={r.day} className="border-t border-ivory/10"><td className="p-2">{fmtDay(r.day)}</td><td className="p-2 font-medium">{r.visitors}</td><td className="p-2 text-warm">{r.page_views}</td></tr>)}</tbody>
        </table></div>
      </Card>
      <p className="text-xs text-warm">Un visiteur est compté une seule fois par jour (identifiant anonyme stocké dans son navigateur). Le jour change à minuit, heure d&rsquo;Alger. Vos propres visites dans l&rsquo;espace admin ne sont pas comptées.</p>
    </>)}
  </div>)
}
