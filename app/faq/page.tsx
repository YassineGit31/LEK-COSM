import type { Metadata } from 'next'
import Icon from '@/components/Icons'
export const metadata: Metadata = { title: 'FAQ', description: 'Questions fréquentes sur la livraison, le paiement et le suivi de commande.' }
const faqs: [string, string][] = [
  ['Livrez-vous dans toute l’Algérie ?', 'Nous livrons dans les wilayas desservies. Choisissez votre wilaya dans le panier pour connaître le frais de livraison et savoir si elle est desservie. Le délai estimé est de 2 à 5 jours ouvrés.'],
  ['Comment fonctionne le paiement à la livraison ?', 'Vous réglez en espèces directement au livreur au moment de la réception de votre commande, sans rien payer en ligne.'],
  ['Certains produits existent-ils en plusieurs formats ?', 'Oui. Lorsqu’un produit est proposé en plusieurs formats (par exemple un flacon complet et un format découverte de 10ML pour certains parfums), vous choisissez le format sur la page du produit.'],
  ['Puis-je suivre ma commande ?', 'Oui. Rendez-vous sur la page « Suivi de commande » et renseignez votre numéro de commande ainsi que votre numéro de téléphone.'],
  ['Puis-je modifier ou annuler ma commande ?', 'Contactez-nous rapidement après votre commande, tant qu’elle n’a pas encore été expédiée.'],
  ['Comment utiliser un code promo ?', 'Entrez votre code à l’étape de commande, dans le champ « Code promo ». La réduction est appliquée à la confirmation.'],
]
export default function FAQ() {
  return (<div className="mx-auto max-w-2xl px-5 py-14 md:py-20">
    <h1 className="h text-4xl md:text-5xl">Questions fréquentes</h1>
    <div className="mt-10 divide-y divide-sage/10 border-y border-sage/10">
      {faqs.map(([q, a]) => (<details key={q} className="group py-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">{q}<Icon name="chevron" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" /></summary>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-warm">{a}</p></details>))}
    </div></div>)
}
