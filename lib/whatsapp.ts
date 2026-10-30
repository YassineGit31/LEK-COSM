import { da, fmtLabel } from './format'
import { METHOD_LABEL, type DeliveryMethod } from './delivery'

// Numéro algérien (0550123456, +213550123456, 00213550123456…) -> format wa.me (213550123456).
export function waNumber(raw?: string | null): string {
  let d = String(raw || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0')) d = '213' + d.slice(1)
  return d.length >= 9 ? d : ''
}

export interface WaOrder {
  number: string; name: string; phone: string; wilaya: string; commune: string; address: string; notes?: string
  method: DeliveryMethod; pickup?: { name: string; address: string } | null
  items: { name: string; format: any; size: string; qty: number; price: number }[]
  subtotal: number; discount: number; delivery: number; total: number
}

// Message envoyé au numéro WhatsApp de la boutique (les montants viennent du serveur).
export function waOrderText(o: WaOrder): string {
  const lines = [
    `*Nouvelle commande ${o.number}*`, '',
    `Client : ${o.name}`, `Téléphone : ${o.phone}`, '',
    '*Articles*',
    ...o.items.map(i => `• ${i.name} — ${fmtLabel(i.format, i.size)} × ${i.qty} = ${da(i.price * i.qty)}`), '',
    `Sous-total : ${da(o.subtotal)}`,
    ...(o.discount > 0 ? [`Remise : -${da(o.discount)}`] : []),
    `Livraison : ${o.method === 'pickup' ? 'Gratuit (retrait)' : o.delivery ? da(o.delivery) : 'Offerte'}`,
    `*Total : ${da(o.total)}*`, '',
    `Mode : ${METHOD_LABEL[o.method].fr}`,
  ]
  if (o.method === 'pickup') lines.push(`Retrait : ${[o.pickup?.name, o.pickup?.address].filter(Boolean).join(' — ')}`)
  else lines.push(`Wilaya : ${o.wilaya}`, `Commune : ${o.commune}`, ...(o.method === 'home' && o.address ? [`Adresse : ${o.address}`] : []))
  if (o.notes) lines.push(`Remarques : ${o.notes}`)
  return lines.join('\n')
}
export const waUrl = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`
