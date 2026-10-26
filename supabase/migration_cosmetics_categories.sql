-- COSMÉTIQUE LE K — catégories de la boutique (additif, idempotent, ne modifie aucune donnée existante).
-- La boutique filtre les produits par catégorie via les slugs ci-dessous ; rattachez ensuite
-- chaque produit à sa catégorie dans Admin > Produits. Les routes par genre (/shop/homme|femme|unisex)
-- continuent de fonctionner et les anciennes catégories Homme/Femme/Unisex sont conservées.
insert into categories (name, slug, gender) values
  ('Soins visage',  'soins-visage',  null),
  ('Maquillage',    'maquillage',    null),
  ('Soins cheveux', 'soins-cheveux', null),
  ('Parfums',       'parfums',       null),
  ('Corps',         'corps',         null),
  ('Soins homme',   'soins-homme',   null)
on conflict (slug) do nothing;
