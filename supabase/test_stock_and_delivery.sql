-- ============================================================
-- COSMÉTIQUE LE K — Auto-test de migration_stock_delivery_v2.sql
-- À exécuter dans Supabase > SQL Editor APRÈS la migration.
-- Tout est exécuté dans UN bloc qui se termine volontairement par une erreur :
-- cela ANNULE (rollback) toutes les données de test. Vos vraies données ne sont pas modifiées.
--
-- Résultat attendu : une erreur dont le message commence par « TOUS LES TESTS SONT PASSÉS ».
-- Tout autre message d'erreur indique le test qui a échoué.
-- ============================================================
do $$
declare
  pa uuid; pb uuid; r record; o1 uuid; o2 uuid; o3 uuid; ml int; fee int; st text; n int;
  items jsonb; ph jsonb := '{"name":"Test","phone":"0550000000"}';
  addr_home jsonb := '{"wilaya":"Oran","commune":"Oran","address":"1 rue test","delivery_method":"home"}';
begin
  insert into products(name, slug, brand, gender, full_price, price_10ml, stock_ml)
    values ('ZZ TEST A', 'zz-test-a-' || gen_random_uuid(), 'TEST', 'unisex', 1000, 200, 1000) returning id into pa;   -- 1000 ml = 10 flacons de 100 ml
  insert into products(name, slug, brand, gender, full_price, price_10ml, stock_ml)
    values ('ZZ TEST B', 'zz-test-b-' || gen_random_uuid(), 'TEST', 'unisex', 1500, 300, 500) returning id into pb;
  insert into settings(key, value) values ('stock_management', 'true'::jsonb) on conflict (key) do update set value = excluded.value;

  -- Test 1 : 10 -> 9 après commande, retour à 10 après annulation
  select * into r from place_order(ph, jsonb_build_array(jsonb_build_object('product_id', pa, 'format', 'full', 'quantity', 1)), addr_home, null); o1 := r.order_id;
  select stock_ml into ml from products where id = pa; if ml <> 900 then raise exception 'T1a: stock attendu 900 ml, obtenu %', ml; end if;
  update orders set status = 'annulee' where id = o1;
  select stock_ml into ml from products where id = pa; if ml <> 1000 then raise exception 'T1b: stock attendu 1000 ml après annulation, obtenu %', ml; end if;

  -- Test 2 : annuler deux fois (et passer annulée -> refusée) ne restitue qu'une fois
  update orders set status = 'annulee' where id = o1;
  update orders set status = 'refusee' where id = o1;
  select stock_ml into ml from products where id = pa; if ml <> 1000 then raise exception 'T2: double restitution, stock = %', ml; end if;

  -- Test 4 : supprimer une commande déjà annulée ne restitue pas une 2e fois
  delete from orders where id = o1;
  select stock_ml into ml from products where id = pa; if ml <> 1000 then raise exception 'T4: restitution à la suppression d''une commande annulée, stock = %', ml; end if;

  -- Tests 3 + 6 : commande multi-produits, full + 10ML ; annulation = bons ml pour chaque produit
  items := jsonb_build_array(
    jsonb_build_object('product_id', pa, 'format', 'full', 'quantity', 2),    -- 200 ml
    jsonb_build_object('product_id', pa, 'format', '10ml', 'quantity', 3),    -- 30 ml
    jsonb_build_object('product_id', pb, 'format', 'full', 'quantity', 1));   -- 100 ml
  select * into r from place_order(ph, items, addr_home, null); o2 := r.order_id;
  select stock_ml into ml from products where id = pa; if ml <> 770 then raise exception 'T3a: produit A attendu 770 ml, obtenu %', ml; end if;
  select stock_ml into ml from products where id = pb; if ml <> 400 then raise exception 'T3b: produit B attendu 400 ml, obtenu %', ml; end if;
  update orders set status = 'annulee' where id = o2;
  select stock_ml into ml from products where id = pa; if ml <> 1000 then raise exception 'T3c: produit A attendu 1000 ml après annulation, obtenu %', ml; end if;
  select stock_ml into ml from products where id = pb; if ml <> 500 then raise exception 'T3d: produit B attendu 500 ml après annulation, obtenu %', ml; end if;

  -- Suppression d'une commande ACTIVE : le stock est restitué une fois
  select * into r from place_order(ph, jsonb_build_array(jsonb_build_object('product_id', pa, 'format', 'full', 'quantity', 1)), addr_home, null); o3 := r.order_id;
  delete from orders where id = o3;
  select stock_ml into ml from products where id = pa; if ml <> 1000 then raise exception 'T-del: stock attendu 1000 ml après suppression d''une commande active, obtenu %', ml; end if;

  -- Test 7 : réactivation impossible (stock insuffisant) => statut ET stock restent cohérents
  select * into r from place_order(ph, jsonb_build_array(jsonb_build_object('product_id', pa, 'format', 'full', 'quantity', 1)), addr_home, null); o1 := r.order_id;
  update orders set status = 'annulee' where id = o1;
  update products set stock_ml = 0 where id = pa;
  begin
    update orders set status = 'confirmee' where id = o1;
    raise exception 'DEVAIT_ECHOUER';
  exception when others then
    if sqlerrm not like 'OUT_OF_STOCK%' then raise exception 'T7a: erreur inattendue : %', sqlerrm; end if;
  end;
  select status::text into st from orders where id = o1; if st <> 'annulee' then raise exception 'T7b: statut attendu annulee, obtenu %', st; end if;
  select stock_ml into ml from products where id = pa; if ml <> 0 then raise exception 'T7c: stock attendu 0, obtenu %', ml; end if;
  update products set stock_ml = 1000 where id = pa;
  update orders set status = 'confirmee' where id = o1;           -- réactivation OK : le stock est redéduit une seule fois
  select stock_ml into ml from products where id = pa; if ml <> 900 then raise exception 'T7d: réactivation, attendu 900 ml, obtenu %', ml; end if;

  -- Stock insuffisant => commande refusée, aucun stock modifié
  begin
    perform place_order(ph, jsonb_build_array(jsonb_build_object('product_id', pb, 'format', 'full', 'quantity', 99)), addr_home, null);
    raise exception 'DEVAIT_ECHOUER';
  exception when others then
    if sqlerrm not like 'OUT_OF_STOCK%' then raise exception 'T-oos: erreur inattendue : %', sqlerrm; end if;
  end;

  -- Test 5 : gestion du stock DÉSACTIVÉE
  update settings set value = 'false'::jsonb where key = 'stock_management';
  update products set stock_ml = 0 where id = pb;                                   -- stock 0, mais « Disponible »
  select * into r from place_order(ph, jsonb_build_array(jsonb_build_object('product_id', pb, 'format', 'full', 'quantity', 3)), addr_home, null); o2 := r.order_id;
  select stock_ml into ml from products where id = pb; if ml <> 0 then raise exception 'T5a: le stock ne doit pas bouger en mode manuel, obtenu %', ml; end if;
  update orders set status = 'annulee' where id = o2;
  select stock_ml into ml from products where id = pb; if ml <> 0 then raise exception 'T5b: annulation en mode manuel ne doit pas toucher au stock, obtenu %', ml; end if;
  delete from orders where id = o2;
  select stock_ml into ml from products where id = pb; if ml <> 0 then raise exception 'T5c: suppression en mode manuel ne doit pas toucher au stock, obtenu %', ml; end if;
  update products set is_available = false where id = pb;                           -- « Indisponible »
  begin
    perform place_order(ph, jsonb_build_array(jsonb_build_object('product_id', pb, 'format', 'full', 'quantity', 1)), addr_home, null);
    raise exception 'DEVAIT_ECHOUER';
  exception when others then
    if sqlerrm not like 'PRODUCT_UNAVAILABLE%' then raise exception 'T5d: erreur inattendue : %', sqlerrm; end if;
  end;
  update products set is_available = true where id = pb;
  update settings set value = 'true'::jsonb where key = 'stock_management';

  -- Livraison : frais par wilaya et par mode, résolus côté serveur
  insert into wilaya_delivery_fees(wilaya_id, fee, fee_office, fee_home, office_enabled, home_enabled, is_served)
    select id, 700, 400, 700, true, true, true from wilayas where name = 'Oran'
    on conflict (wilaya_id) do update set fee = 700, fee_office = 400, fee_home = 700, office_enabled = true, home_enabled = true, is_served = true;
  update settings set value = '0'::jsonb where key = 'free_delivery_threshold';
  items := jsonb_build_array(jsonb_build_object('product_id', pa, 'format', '10ml', 'quantity', 1));
  select * into r from place_order(ph, items, '{"wilaya":"Oran","commune":"Oran","address":"","delivery_method":"office"}', null);
  select delivery_fee into fee from orders where id = r.order_id; if fee <> 400 then raise exception 'D1: frais bureau attendu 400, obtenu %', fee; end if;
  select * into r from place_order(ph, items, addr_home, null);
  select delivery_fee into fee from orders where id = r.order_id; if fee <> 700 then raise exception 'D2: frais domicile attendu 700, obtenu %', fee; end if;
  -- Retrait sur place : indisponible tant que non configuré, puis frais = 0
  insert into settings(key, value) values ('pickup', '{"enabled":false}'::jsonb) on conflict (key) do update set value = excluded.value;
  begin
    perform place_order(ph, items, '{"wilaya":"Oran","delivery_method":"pickup"}', null);
    raise exception 'DEVAIT_ECHOUER';
  exception when others then
    if sqlerrm not like 'PICKUP_UNAVAILABLE%' then raise exception 'D3: erreur inattendue : %', sqlerrm; end if;
  end;
  update settings set value = '{"enabled":true,"name":"Test","address":"Adresse de test","hours":"","instructions":""}'::jsonb where key = 'pickup';
  select * into r from place_order(ph, items, '{"wilaya":"Oran","delivery_method":"pickup"}', null);
  select delivery_fee into fee from orders where id = r.order_id; if fee <> 0 then raise exception 'D4: retrait = frais 0 attendu, obtenu %', fee; end if;
  select delivery_method into st from orders where id = r.order_id; if st <> 'pickup' then raise exception 'D5: mode enregistré attendu pickup, obtenu %', st; end if;
  -- Mode désactivé pour la wilaya : refusé côté serveur
  update wilaya_delivery_fees set office_enabled = false where wilaya_id = (select id from wilayas where name = 'Oran');
  begin
    perform place_order(ph, items, '{"wilaya":"Oran","commune":"Oran","delivery_method":"office"}', null);
    raise exception 'DEVAIT_ECHOUER';
  exception when others then
    if sqlerrm not like 'DELIVERY_METHOD_UNAVAILABLE%' then raise exception 'D6: erreur inattendue : %', sqlerrm; end if;
  end;
  begin
    perform place_order(ph, items, '{"wilaya":"Oran","commune":"Oran","address":"x","delivery_method":"drone"}', null);
    raise exception 'DEVAIT_ECHOUER';
  exception when others then
    if sqlerrm not like 'INVALID_DELIVERY_METHOD%' then raise exception 'D7: erreur inattendue : %', sqlerrm; end if;
  end;

  raise exception 'TOUS LES TESTS SONT PASSÉS (stock ON/OFF, restitution, livraison bureau/domicile/retrait). Données de test annulées par rollback.';
end $$;
