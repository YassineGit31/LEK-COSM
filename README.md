# COSMÉTIQUE LE K

Boutique en ligne de cosmétiques (Oran, Algérie) — vitrine client + back-office admin — Next.js 14 (App Router), TypeScript, Tailwind CSS et Supabase. *Beauty in every detail.*

## Charte graphique

| Rôle | Couleur | Token Tailwind |
|---|---|---|
| Couleur principale (boutons, texte, pied de page) | Sage Green `#2E5D4E` | `sage` |
| Accent secondaire | Sand Beige `#D9C9B2` | `sand` |
| Fond principal | Soft Cream `#F8F6F2` | `cream` |
| Détails, badges, soulignements | Soft Gold `#C9A96B` | `gold` |
| Sections secondaires | Muted Green `#A7B6A5` | `mist` |
| Texte secondaire, icônes | Warm Taupe `#8B8073` | `taupe` |
| Surfaces (cartes) | White `#FFFFFF` | `white` |

**Aucun noir.** Typographie : Playfair Display (titres, classe `.h`) et Montserrat (tout le reste). Boutons : `.btn` (contour) et `.btn-solid` (plein). Champs : `.input`.

Les anciens tokens `ink` / `coal` / `ivory` sont conservés comme **alias sémantiques** (fond / surface / texte) : le back-office, qui les utilise partout, adopte ainsi automatiquement la nouvelle charte claire sans réécriture.

## Catégories de la boutique

Exécutez `supabase/migration_cosmetics_categories.sql` (additif, idempotent) pour créer Soins visage, Maquillage, Soins cheveux, Parfums, Corps et Soins homme, puis rattachez chaque produit à sa catégorie dans Admin > Produits. Les routes `/shop/<slug>` filtrent par catégorie ; les anciennes routes `/shop/homme|femme|unisex` restent actives.

## Produits autres que parfums (sans changer la base)

Le stock est suivi en « ml » (héritage parfumerie). Pour un soin, un maquillage, etc. : contenance **« 1 pièce »**, décocher **10ML**, et saisir le **stock en nombre de pièces**. La fiche produit masque alors le sélecteur de format et les notes olfactives.

## Démarrage

1. `npm install`
2. Créez un projet [Supabase](https://supabase.com), puis exécutez **dans l'ordre**, dans l'éditeur SQL :
   1. `supabase/schema.sql` (tables, RLS, fonctions `place_order`/`track_order`, données de démonstration)
   2. `supabase/migration_wilaya_pricing.sql` (crée la table des 69 wilayas — la partie « prix produit par wilaya » de ce fichier est immédiatement remplacée par l'étape suivante, gardez-le pour les 69 wilayas)
   3. `supabase/migration_storage.sql` (bucket `product-images`, idempotent)
   4. `supabase/migration_delivery_by_wilaya.sql` — supprime le système de prix produit par wilaya et le remplace par un frais de livraison par wilaya, identique pour tous les produits
   5. `supabase/migration_unified_stock.sql` **(nouveau)** — si votre projet existe déjà : relie le stock du flacon plein et celui des portions 10ML (même liquide, un seul stock physique en ml). Pas nécessaire sur un projet neuf : `schema.sql` inclut déjà ce comportement.
   6. `supabase/migration_stock_delivery_v2.sql` **(nouveau, à exécuter en dernier)** — interrupteur global de gestion du stock, disponibilité manuelle par produit, 3 modes de réception (bureau / domicile / retrait sur place), frais bureau et domicile par wilaya, restauration automatique du stock à l'annulation/suppression. Idempotent. Remplace `place_order()` par une version complète. Test optionnel : `supabase/test_stock_and_delivery.sql`.
3. Copiez `.env.example` vers `.env.local` et renseignez l'URL + la clé anonyme du projet.
4. Créez un utilisateur admin dans Supabase Auth (Authentication → Add user, **avec mot de passe**, pas « Invite ») puis exécutez :
   ```sql
   insert into admins(user_id, full_name)
   select id, 'Admin' from auth.users where email = '<email-de-l-admin>';
   ```
5. `npm run dev` → http://localhost:3000 (admin : `/admin`, protégé par `middleware.ts`)

## Ce qui est inclus

**Boutique client** — accueil (hero, catégories, meilleures ventes, avantages, bannière collection, grille Instagram), `/shop` avec recherche/filtres/tri, fiche produit avec sélecteur Full Size / 10ML, panier, checkout (wilayas, paiement à la livraison, code promo), confirmation de commande, suivi de commande public, favoris, à propos, FAQ, contact (formulaire → base de données), sitemap.xml et robots.txt.

**Admin** (`/admin`, authentification Supabase requise) — dashboard avec CA (jour/semaine/mois/total), graphiques 14 jours, meilleures ventes, répartition des statuts, stock faible ; gestion des commandes avec filtres/statuts/actions et page de détail (timeline, WhatsApp, appel, notes) ; produits (CRUD complet, formats Full Size/10ML indépendants) ; catégories ; stock (mise à jour inline, seuils, alertes) ; clients (historique, total dépensé) ; promotions (codes, %, montant fixe, dates, limites d'usage) ; messages de contact ; paramètres (infos boutique, livraison, seuils) ; notifications en temps réel (nouvelle commande, annulation, stock faible/rupture, nouveau message).

**Base de données** — schéma Supabase complet (`products`, `categories`, `orders`, `order_items`, `customers`, `coupons`, `stock_movements`, `notifications`, `messages`, `newsletter_subscribers`, `settings`, `admins`), Row Level Security, triggers d'historique de statut, fonctions `place_order` (transactionnelle, gère stock/coupon/notifications) et `track_order` (suivi public sécurisé par numéro + téléphone), 14 produits de démonstration.

## Mise à jour — livraison par wilaya (remplace le prix produit par wilaya)

Le prix d'un parfum est désormais **le même partout en Algérie**. Ce qui varie par wilaya, c'est le **frais de livraison**, de la même façon pour tous les produits :

- Table `wilaya_delivery_fees` (wilaya, frais, desservie ou non). Sans ligne pour une wilaya, le frais par défaut des Paramètres s'applique.
- `place_order()` résout le frais de livraison **côté serveur uniquement** à partir de la wilaya envoyée — jamais confiance au navigateur — et refuse la commande si la wilaya n'est pas desservie (`WILAYA_NOT_SERVED`) ou inconnue (`INVALID_WILAYA`).
- Admin : `/admin/delivery` (grille des 69 wilayas, tarif + case « desservie », actions groupées, recherche). Client : sélecteur de wilaya dans la navbar / panier / checkout, qui affiche le frais de livraison estimé (`get_delivery_fee()`), plus un message si la wilaya n'est pas desservie.
- L'ancienne table `product_wilaya_prices` (prix produit par wilaya) et les fonctions/vues associées sont supprimées par `migration_delivery_by_wilaya.sql`.

## Corrections de sécurité

- **`middleware.ts`** ne vérifiait auparavant que la présence d'une session Supabase authentifiée pour laisser passer vers `/admin/*`, sans vérifier l'appartenance à la table `admins`. Les données restaient protégées par les policies RLS (`is_admin()`), mais un utilisateur authentifié non-admin pouvait tout de même atteindre l'interface `/admin`. Le middleware vérifie maintenant explicitement une ligne dans `admins`, et déconnecte + redirige avec un message sinon.
- **Upsert client dans `place_order()`** : une commande passée avec le numéro de téléphone d'un client existant n'écrase plus son nom enregistré (seules les coordonnées de livraison, légitimement amenées à changer, sont mises à jour). Notez que l'adresse de livraison de chaque commande est de toute façon toujours conservée telle quelle sur la commande elle-même (`orders.address/commune/wilaya`), indépendamment de la fiche client.
- **Validation téléphone et quantité côté serveur** dans `place_order()` (`INVALID_PHONE`, `INVALID_QUANTITY`) : le formulaire de checkout validait déjà ces champs, mais rien n'empêchait un appel direct à la fonction SQL (ex. via l'API Supabase) de les contourner.

## Refonte COSMÉTIQUE LE K
- Nouvelle charte (palette sans noir, Playfair Display + Montserrat), nouveau logo (`public/brand/lk-*.png`), icônes en trait fin (`components/Icons.tsx`).
- Le hero 3D (three.js / React Three Fiber) a été **retiré** : il ne correspondait plus à la marque et alourdissait fortement la page d'accueil, surtout sur mobile. Trois dépendances en moins.
- Les animations d'apparition au scroll ont été retirées (sobriété) ; le menu mobile et le respect de `prefers-reduced-motion` sont conservés.
- Aucune logique métier modifiée : `middleware.ts`, clients Supabase, `place_order()`, frais par wilaya, stock, coupons, suivi de commande et tout le SQL existant sont identiques.
- Variable `NEXT_PUBLIC_SITE_URL` à renseigner avec le vrai domaine (sitemap, robots, balises canoniques).

## À compléter selon vos besoins

- Conversion automatique des images en WebP/AVIF à l'upload (actuellement : stockées telles quelles)
- Traductions arabe/anglais (l'architecture est prête : `lang` sur `<html>`, tous les textes en dur en français)
- Recherche avec autocomplétion et « récemment consultés »
- Un vrai modèle 3D de flacon si vous en fournissez un (actuellement : scène abstraite, cf. section 3D ci-dessus)

## Notes techniques

- Les pages admin lisent/écrivent directement via le client Supabase (RLS + policy `is_admin()`), sans API routes intermédiaires.
- Les polices sont chargées via `next/font/google` : le `npm run build` nécessite un accès à Google Fonts (disponible sur Vercel).

## Mise à jour v2 — stock ON/OFF, 3 modes de réception, restauration du stock

- **Admin > Stock** : interrupteur *Gestion du stock* (ON = suivi automatique ; OFF = disponibilité manuelle Disponible/Indisponible par produit, aucune quantité modifiée). Réglage stocké dans `settings.stock_management`.
- **Admin > Livraison & retrait** : frais *bureau* et *domicile* par wilaya (+ activation de chaque mode), et configuration du point de retrait (aucune adresse par défaut ; désactivé tant que non configuré). Retrait = toujours gratuit.
- **Checkout** : wilaya → mode (bureau / domicile / retrait) → champs adaptés → résumé (sous-total, remise, livraison, total). Tout est recalculé et validé par `place_order()`.
- **Stock restitué par PostgreSQL** (triggers sur `orders`) : annulation/refus → stock rendu une fois ; suppression d'une commande active → stock rendu avant suppression ; réactivation → stock redéduit après vérification. Le drapeau `orders.stock_deducted` empêche toute double restitution.
- La newsletter a été retirée du site (la table `newsletter_subscribers` est conservée intacte).
