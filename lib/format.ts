export type Fmt = 'full' | '10ml'
export interface Product { id:string; name:string; slug:string; brand:string; description:string|null; gender:'homme'|'femme'|'unisex'; category_id?:number|null; images:string[]|null;
  top_notes:string[]; heart_notes:string[]; base_notes:string[]; full_size:string; full_size_ml:number; full_price:number; full_stock:number; full_enabled:boolean;
  sample_10ml:boolean; price_10ml:number|null; stock_10ml:number; stock_ml:number; is_best_seller:boolean; is_new:boolean; is_available?:boolean; created_at:string }
export interface Opt { format:Fmt; label:string; size:string; price:number; stock:number }
export const options = (p:Product): Opt[] => [
  p.full_enabled ? { format:'full' as Fmt, label:'Full Size', size:p.full_size, price:p.full_price, stock:p.full_stock } : null,
  p.sample_10ml && p.price_10ml != null ? { format:'10ml' as Fmt, label:'10ML', size:'10ML', price:p.price_10ml, stock:p.stock_10ml } : null,
].filter(Boolean) as Opt[]
// Disponibilité à l'achat. Mode stock ON : le stock décide (rupture = stock <= 0).
// Mode stock OFF : seule la disponibilité MANUELLE du produit (is_available) décide, jamais la quantité.
export const manuallyAvailable = (p:Product) => p.is_available !== false
export const optBuyable = (p:Product, o:Opt, stockOn:boolean) => stockOn ? o.stock > 0 : manuallyAvailable(p)
export const productSoldOut = (p:Product, stockOn:boolean) => { const os = options(p); return stockOn ? os.length > 0 && os.every(o => o.stock <= 0) : !manuallyAvailable(p) }
export const da = (n:number) => `${n.toLocaleString('fr-FR')} DA`
export const fmtLabel = (f:string, size:string) => f === 'full' ? size : 'Format découverte 10ML'
export const STATUS: Record<string,string> = { nouvelle:'Nouvelle', a_confirmer:'À confirmer', confirmee:'Confirmée', en_preparation:'En préparation', expediee:'Expédiée', livree:'Livrée', annulee:'Annulée', refusee:'Refusée' }
export const WILAYAS = 'Adrar,Chlef,Laghouat,Oum El Bouaghi,Batna,Béjaïa,Biskra,Béchar,Blida,Bouira,Tamanrasset,Tébessa,Tlemcen,Tiaret,Tizi Ouzou,Alger,Djelfa,Jijel,Sétif,Saïda,Skikda,Sidi Bel Abbès,Annaba,Guelma,Constantine,Médéa,Mostaganem,M\'Sila,Mascara,Ouargla,Oran,El Bayadh,Illizi,Bordj Bou Arréridj,Boumerdès,El Tarf,Tindouf,Tissemsilt,El Oued,Khenchela,Souk Ahras,Tipaza,Mila,Aïn Defla,Naâma,Aïn Témouchent,Ghardaïa,Relizane,Timimoun,Bordj Badji Mokhtar,Ouled Djellal,Béni Abbès,In Salah,In Guezzam,Touggourt,Djanet,El M\'Ghair,El Meniaa,Aflou,El Abiodh Sidi Cheikh,El Aricha,El Kantara,Barika,Bousaâda,Bir El Ater,Ksar El Boukhari,Ksar Chellala,Aïn Oussera,Messaad'.split(',')
