// Modes de réception d'une commande. Libellés FR (interface) + AR (sous-titre), identiques partout.
export type DeliveryMethod = 'office' | 'home' | 'pickup'
export const METHODS: DeliveryMethod[] = ['office', 'home', 'pickup']
export const METHOD_LABEL: Record<DeliveryMethod, { fr: string; ar: string }> = {
  office: { fr: 'Livraison au bureau', ar: 'التوصيل إلى مكتب شركة التوصيل' },
  home: { fr: 'Livraison à domicile', ar: 'التوصيل إلى المنزل' },
  pickup: { fr: 'Retrait sur place — Sans livraison', ar: 'استلام الطلب دون توصيل' },
}
export const methodFr = (m?: string | null) => METHOD_LABEL[(m as DeliveryMethod)]?.fr ?? 'Livraison à domicile'
