-- ============================================================
-- COSMÉTIQUE LE K — Migration v2
--   1. Interrupteur global « gestion du stock » (ON/OFF) + disponibilité manuelle par produit
--   2. 3 modes de livraison : bureau / domicile / retrait sur place
--   3. Frais de livraison séparés bureau / domicile par wilaya
--   4. Restauration automatique du stock à l'annulation / suppression d'une commande
--
-- ADDITIVE ET IDEMPOTENTE : peut être exécutée plusieurs fois sans risque.
-- Ne supprime ni ne recrée aucune table. Conserve produits, commandes, clients, tarifs.
-- À exécuter dans Supabase > SQL Editor APRÈS toutes les migrations existantes
-- (schema.sql, migration_wilaya_pricing.sql, migration_storage.sql,
--  migration_delivery_by_wilaya.sql, migration_unified_stock.sql).
--
-- IMPORTANT : cette migration REMPLACE place_order() par une version complète qui réunit
-- tout (stock en ml, frais par wilaya, validation téléphone/quantité). Elle corrige donc
-- aussi le piège de l'ordre d'exécution des anciennes migrations.
-- ============================================================

begin;

do $$ begin
  if to_regclass('public.wilaya_delivery_fees') is null or to_regclass('public.wilayas') is null then
    raise exception 'Exécutez d''abord migration_wilaya_pricing.sql et migration_delivery_by_wilaya.sql';
  end if;
end $$;

-- ---------- 1. Disponibilité manuelle des produits + réglages ----------
alter table products add column if not exists is_available boolean not null default true;

-- Gestion du stock : true = suivi automatique (comportement actuel), false = disponibilité manuelle.
insert into settings(key, value) values ('stock_management', 'true'::jsonb) on conflict (key) do nothing;
-- Point de retrait : AUCUNE adresse inventée. Désactivé tant que vous ne le configurez pas
-- dans Admin > Livraison par wilaya.
insert into settings(key, value) values ('pickup', '{"enabled":false,"name":"","address":"","hours":"","instructions":""}'::jsonb) on conflict (key) do nothing;

-- Jamais de stock négatif (NOT VALID : n'échoue pas sur d'éventuelles anciennes lignes, mais protège toute nouvelle écriture).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'products_stock_ml_nonneg') then
    alter table products add constraint products_stock_ml_nonneg check (stock_ml >= 0) not valid;
  end if;
end $$;

-- ---------- 2. Frais de livraison séparés bureau / domicile ----------
alter table wilaya_delivery_fees add column if not exists fee_office int check (fee_office is null or fee_office >= 0);
alter table wilaya_delivery_fees add column if not exists fee_home   int check (fee_home   is null or fee_home   >= 0);
alter table wilaya_delivery_fees add column if not exists office_enabled boolean not null default true;
alter table wilaya_delivery_fees add column if not exists home_enabled   boolean not null default true;
-- Reprise des données existantes : l'ancien tarif unique devient le tarif bureau ET domicile.
-- (fee_office / fee_home NULL = « tarif par défaut des Paramètres ». L'ancienne colonne `fee` est conservée, maintenue = tarif domicile.)
update wilaya_delivery_fees set fee_office = coalesce(fee_office, fee), fee_home = coalesce(fee_home, fee);
-- Une wilaya déjà marquée « non desservie » le reste pour les deux modes.
update wilaya_delivery_fees set office_enabled = false, home_enabled = false where is_served = false and office_enabled and home_enabled;

-- ---------- 3. Colonnes de commande ----------
alter table orders add column if not exists delivery_method text not null default 'home';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_delivery_method_chk') then
    alter table orders add constraint orders_delivery_method_chk check (delivery_method in ('office','home','pickup'));
  end if;
end $$;
alter table orders add column if not exists pickup_info text;

-- stock_deducted = « cette commande détient actuellement du stock » (idempotence anti double restitution).
-- stock_ml_deducted = nombre de ml réellement retirés pour cette ligne.
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='stock_deducted') then
    alter table orders add column stock_deducted boolean not null default false;
    alter table order_items add column if not exists stock_ml_deducted int not null default 0;
    -- Reprise de l'existant (exécuté une seule fois) : les commandes actives ont déjà retiré du stock.
    update order_items i set stock_ml_deducted = i.quantity * case when i.format = 'full' then p.full_size_ml else 10 end
      from products p where p.id = i.product_id;
    update orders set stock_deducted = true where status not in ('annulee','refusee');
  end if;
end $$;
alter table order_items add column if not exists stock_ml_deducted int not null default 0;

-- ---------- 4. Fonctions utilitaires ----------
create or replace function stock_mgmt_enabled() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select lower(value #>> '{}') <> 'false' from settings where key = 'stock_management'), true)
$$;
grant execute on function stock_mgmt_enabled() to anon, authenticated;

-- Options de livraison d'une wilaya (public, indicatif : place_order() recalcule tout côté serveur).
create or replace function get_delivery_options(p_wilaya_name text)
returns table (office_fee int, office_ok boolean, home_fee int, home_ok boolean)
language plpgsql stable security definer set search_path = public as $$
declare v_default int; v_wid int; r wilaya_delivery_fees;
begin
  select coalesce((value #>> '{}')::int, 600) into v_default from settings where key = 'delivery_fee';
  v_default := coalesce(v_default, 600);
  select w.id into v_wid from wilayas w where w.name = p_wilaya_name;
  select * into r from wilaya_delivery_fees where wilaya_id = v_wid;
  if r.id is null then
    return query select v_default, true, v_default, true;
  else
    return query select coalesce(r.fee_office, v_default), (r.is_served and r.office_enabled),
                        coalesce(r.fee_home,   v_default), (r.is_served and r.home_enabled);
  end if;
end $$;
revoke execute on function get_delivery_options(text) from public;
grant execute on function get_delivery_options(text) to anon, authenticated;

-- Compatibilité : ancienne fonction (même signature) utilisée par d'anciens écrans.
create or replace function get_delivery_fee(p_wilaya_name text)
returns table (fee int, is_served boolean) language sql stable security definer set search_path = public as $$
  select case when o.home_ok then o.home_fee else o.office_fee end, (o.home_ok or o.office_ok)
  from get_delivery_options(p_wilaya_name) o
$$;
grant execute on function get_delivery_fee(text) to anon, authenticated;

-- ---------- 5. Retrait / retour du stock d'une commande (interne, jamais appelable par le navigateur) ----------
create or replace function restore_order_stock(p_order uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select i.product_id, i.format, i.quantity, i.stock_ml_deducted from order_items i
           where i.order_id = p_order and i.product_id is not null and i.stock_ml_deducted > 0
           order by i.product_id
  loop
    perform 1 from products where id = r.product_id for update;   -- verrou de ligne
    if found then
      update products set stock_ml = stock_ml + r.stock_ml_deducted where id = r.product_id;
      insert into stock_movements(product_id, format, delta, reason, order_id) values (r.product_id, r.format, r.quantity, p_reason, p_order);
    end if;
  end loop;
end $$;

create or replace function deduct_order_stock(p_order uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare r record; p products; v_ml int;
begin
  for r in select i.id, i.product_id, i.format, i.quantity, i.size from order_items i
           where i.order_id = p_order and i.product_id is not null order by i.product_id, i.id
  loop
    select * into p from products where id = r.product_id for update;
    if not found then continue; end if;
    v_ml := r.quantity * case when r.format = 'full' then p.full_size_ml else 10 end;
    if p.stock_ml < v_ml then raise exception 'OUT_OF_STOCK:% (%)', p.name, r.size; end if;
    update products set stock_ml = stock_ml - v_ml where id = p.id;
    update order_items set stock_ml_deducted = v_ml where id = r.id;
    insert into stock_movements(product_id, format, delta, reason, order_id) values (p.id, r.format, -r.quantity, p_reason, p_order);
  end loop;
end $$;
revoke execute on function restore_order_stock(uuid, text), deduct_order_stock(uuid, text) from public, anon, authenticated;

-- Changement de statut : annulation/refus => stock rendu (une seule fois) ; réactivation => stock redéduit après vérification.
-- Tout se passe dans la même transaction que l'UPDATE du statut : si la restitution échoue, le statut ne change pas.
create or replace function order_stock_on_status() returns trigger language plpgsql security definer set search_path = public as $$
declare v_rel boolean := new.status in ('annulee','refusee'); v_was boolean := old.status in ('annulee','refusee');
begin
  if new.status is not distinct from old.status then return new; end if;
  if not stock_mgmt_enabled() then return new; end if;     -- mode manuel : on ne touche JAMAIS au stock
  if v_rel and not v_was then
    if old.stock_deducted then
      perform restore_order_stock(old.id, 'order_cancel_restore');
      new.stock_deducted := false;
    end if;
  elsif v_was and not v_rel then
    if not old.stock_deducted then
      perform deduct_order_stock(old.id, 'order_reactivate');  -- lève OUT_OF_STOCK si indisponible
      new.stock_deducted := true;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_order_stock_sync on orders;
create trigger trg_order_stock_sync before update of status on orders for each row execute function order_stock_on_status();

-- Suppression définitive : le stock est rendu AVANT la suppression, sauf s'il l'a déjà été (stock_deducted = false).
create or replace function order_stock_on_delete() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.stock_deducted and stock_mgmt_enabled() then
    perform restore_order_stock(old.id, 'order_delete_restore');
  end if;
  return old;
end $$;
drop trigger if exists trg_order_stock_del on orders;
create trigger trg_order_stock_del before delete on orders for each row execute function order_stock_on_delete();

-- ---------- 6. place_order() : version complète ----------
-- Signature INCHANGÉE (compatible avec le front existant). Nouveau : p_address->>'delivery_method' = office | home | pickup
-- (défaut 'home'). Prix, remise, frais et total sont TOUJOURS calculés ici, jamais lus depuis le navigateur.
create or replace function place_order(p_customer jsonb, p_items jsonb, p_address jsonb, p_coupon text default null)
returns table (order_number text, order_id uuid) language plpgsql security definer set search_path = public as $$
declare
  it jsonb; p products; v_fmt perfume_format; v_qty int; v_price int; v_stock int; v_size text; v_unit_ml int; v_ml int; v_new_full int; v_new_10ml int;
  v_sub int := 0; v_disc int := 0; v_fee int := 0; v_free int; v_low int; v_cust uuid; v_order uuid; v_num text; c coupons; v_auto boolean;
  v_wilaya_id int; v_wdf wilaya_delivery_fees; v_default_fee int; v_method text; v_stock_on boolean; v_pk jsonb; v_pickup_info text;
  v_commune text; v_addr text;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_CART'; end if;
  if p_customer->>'phone' !~ '^0[5-7][0-9]{8}$' then raise exception 'INVALID_PHONE'; end if;
  if coalesce(trim(p_customer->>'name'), '') = '' then raise exception 'INVALID_NAME'; end if;

  v_method := coalesce(nullif(p_address->>'delivery_method', ''), 'home');
  if v_method not in ('office','home','pickup') then raise exception 'INVALID_DELIVERY_METHOD'; end if;

  v_stock_on := stock_mgmt_enabled();
  select coalesce((value #>> '{}')::int, 600) into v_default_fee from settings where key = 'delivery_fee'; v_default_fee := coalesce(v_default_fee, 600);
  select coalesce((value #>> '{}')::int, 0)   into v_free from settings where key = 'free_delivery_threshold'; v_free := coalesce(v_free, 0);
  select coalesce((value #>> '{}')::int, 5)   into v_low  from settings where key = 'low_stock_threshold'; v_low := coalesce(v_low, 5);
  select coalesce((value #>> '{}')::boolean, false) into v_auto from settings where key = 'auto_confirm'; v_auto := coalesce(v_auto, false);

  select id into v_wilaya_id from wilayas where name = p_address->>'wilaya';
  if v_wilaya_id is null then raise exception 'INVALID_WILAYA'; end if;

  -- Frais de livraison résolus par wilaya ET par mode (serveur uniquement).
  v_commune := coalesce(trim(p_address->>'commune'), ''); v_addr := coalesce(trim(p_address->>'address'), '');
  if v_method = 'pickup' then
    select value into v_pk from settings where key = 'pickup';
    if v_pk is null or coalesce((v_pk->>'enabled')::boolean, false) is not true or coalesce(trim(v_pk->>'address'), '') = '' then
      raise exception 'PICKUP_UNAVAILABLE';
    end if;
    v_fee := 0;
    v_pickup_info := concat_ws(E'\n', nullif(trim(v_pk->>'name'), ''), nullif(trim(v_pk->>'address'), ''),
                               nullif(trim(v_pk->>'hours'), ''), nullif(trim(v_pk->>'instructions'), ''));
    v_commune := ''; v_addr := 'Retrait sur place — sans livraison';
  else
    if v_commune = '' then raise exception 'INVALID_ADDRESS'; end if;
    select * into v_wdf from wilaya_delivery_fees where wilaya_id = v_wilaya_id;
    if v_wdf.id is null then
      v_fee := v_default_fee;
    else
      if not v_wdf.is_served then raise exception 'WILAYA_NOT_SERVED'; end if;
      if v_method = 'office' then
        if not v_wdf.office_enabled then raise exception 'DELIVERY_METHOD_UNAVAILABLE'; end if;
        v_fee := coalesce(v_wdf.fee_office, v_default_fee);
      else
        if not v_wdf.home_enabled then raise exception 'DELIVERY_METHOD_UNAVAILABLE'; end if;
        v_fee := coalesce(v_wdf.fee_home, v_default_fee);
      end if;
    end if;
    if v_method = 'home' and v_addr = '' then raise exception 'INVALID_ADDRESS'; end if;
    if v_method = 'office' and v_addr = '' then v_addr := 'Retrait au bureau de la société de livraison'; end if;
  end if;

  insert into customers(name, phone, email, wilaya, commune, address)
  values (p_customer->>'name', p_customer->>'phone', nullif(p_customer->>'email', ''), p_address->>'wilaya', v_commune, v_addr)
  on conflict (phone) do update set
    email = coalesce(excluded.email, customers.email),
    wilaya = excluded.wilaya,
    commune = case when v_method = 'pickup' then customers.commune else excluded.commune end,
    address = case when v_method = 'pickup' then customers.address else excluded.address end
  returning id into v_cust;

  v_num := 'WP-' || extract(year from now())::int || '-' || lpad(nextval('order_seq')::text, 6, '0');
  insert into orders(order_number, customer_id, status, subtotal, delivery_fee, total, wilaya, commune, address, notes, delivery_method, pickup_info, stock_deducted)
  values (v_num, v_cust, (case when v_auto then 'confirmee' else 'nouvelle' end)::order_status, 0, 0, 0, p_address->>'wilaya', v_commune, v_addr, p_address->>'notes', v_method, v_pickup_info, v_stock_on)
  returning id into v_order;

  -- Lignes triées (produit, format) : ordre de verrouillage constant => pas d'interblocage entre deux commandes simultanées.
  for it in select e.value from jsonb_array_elements(p_items) as e order by e.value->>'product_id', e.value->>'format' loop
    select * into p from products where id = (it->>'product_id')::uuid and is_active for update;   -- verrou de ligne
    if not found then raise exception 'PRODUCT_UNAVAILABLE'; end if;
    v_fmt := (it->>'format')::perfume_format; v_qty := (it->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then raise exception 'INVALID_QUANTITY'; end if;

    -- Indisponible MANUELLEMENT (mode OFF) : distinct d'une rupture de stock (mode ON).
    if not v_stock_on and not p.is_available then raise exception 'PRODUCT_UNAVAILABLE:%', p.name; end if;

    if v_fmt = 'full' then
      if not p.full_enabled then raise exception 'FORMAT_UNAVAILABLE:%', p.name; end if;
      v_price := p.full_price; v_stock := p.full_stock; v_size := p.full_size; v_unit_ml := p.full_size_ml;
    else
      if not p.sample_10ml or p.price_10ml is null then raise exception 'FORMAT_UNAVAILABLE:%', p.name; end if;
      v_price := p.price_10ml; v_stock := p.stock_10ml; v_size := '10ML'; v_unit_ml := 10;
    end if;
    v_ml := v_unit_ml * v_qty;

    if v_stock_on then
      if v_stock < v_qty or p.stock_ml < v_ml then raise exception 'OUT_OF_STOCK:% (%)', p.name, v_size; end if;
    end if;

    insert into order_items(order_id, product_id, product_name, format, size, quantity, unit_price, subtotal, stock_ml_deducted)
    values (v_order, p.id, p.name, v_fmt, v_size, v_qty, v_price, v_price * v_qty, case when v_stock_on then v_ml else 0 end);
    v_sub := v_sub + v_price * v_qty;

    if v_stock_on then
      -- On ne met à jour QUE stock_ml : full_stock / stock_10ml sont des colonnes générées.
      update products set stock_ml = stock_ml - v_ml where id = p.id returning full_stock, stock_10ml into v_new_full, v_new_10ml;
      insert into stock_movements(product_id, format, delta, reason, order_id) values (p.id, v_fmt, -v_qty, 'order', v_order);

      if p.full_enabled then
        if v_new_full <= 0 then insert into notifications(type,title,body,product_id) values ('out_of_stock','Rupture de stock', p.name||' — '||p.full_size, p.id);
        elsif v_new_full <= v_low then insert into notifications(type,title,body,product_id) values ('low_stock','Stock faible', p.name||' — '||p.full_size||' ('||v_new_full||')', p.id);
        end if;
      end if;
      if p.sample_10ml then
        if v_new_10ml <= 0 then insert into notifications(type,title,body,product_id) values ('out_of_stock','Rupture de stock', p.name||' — 10ML', p.id);
        elsif v_new_10ml <= v_low then insert into notifications(type,title,body,product_id) values ('low_stock','Stock faible', p.name||' — 10ML ('||v_new_10ml||')', p.id);
        end if;
      end if;
    end if;
  end loop;

  if p_coupon is not null and p_coupon <> '' then
    select * into c from coupons where code = upper(p_coupon) and is_active
      and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())
      and (max_uses is null or used_count < max_uses) and v_sub >= min_order
    for update;
    if found then
      v_disc := case when c.discount_type = 'percent' then v_sub * c.value / 100 else least(c.value, v_sub) end;
      update coupons set used_count = used_count + 1 where id = c.id;
    end if;
  end if;

  if v_method <> 'pickup' and v_free > 0 and (v_sub - v_disc) >= v_free then v_fee := 0; end if;
  update orders set subtotal = v_sub, discount = v_disc, delivery_fee = v_fee, total = v_sub - v_disc + v_fee,
    coupon_code = case when v_disc > 0 then upper(p_coupon) end where id = v_order;
  insert into notifications(type,title,body,order_id) values ('new_order','Nouvelle commande', v_num||' — '||(v_sub-v_disc+v_fee)||' DA', v_order);

  return query select v_num, v_order;
end $$;
revoke execute on function place_order(jsonb, jsonb, jsonb, text) from public;
grant execute on function place_order(jsonb, jsonb, jsonb, text) to anon, authenticated;

-- ---------- 7. Suivi public : ajoute le mode de livraison (même signature, même sécurité) ----------
create or replace function track_order(p_number text, p_phone text) returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'order_number', o.order_number, 'status', o.status, 'total', o.total, 'delivery_fee', o.delivery_fee, 'created_at', o.created_at,
    'delivery_method', o.delivery_method, 'pickup_info', o.pickup_info,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('name',i.product_name,'format',i.format,'size',i.size,'quantity',i.quantity,'unit_price',i.unit_price,'subtotal',i.subtotal)),'[]') from order_items i where i.order_id=o.id),
    'history', (select coalesce(jsonb_agg(jsonb_build_object('status',h.status,'at',h.created_at) order by h.created_at),'[]') from order_status_history h where h.order_id=o.id))
  from orders o join customers c on c.id=o.customer_id
  where o.order_number = upper(p_number) and c.phone = p_phone
$$;

-- ---------- 8. Aperçu public du code promo (affichage dans le résumé de commande ; place_order() reste l'autorité) ----------
create or replace function preview_coupon(p_code text, p_subtotal int) returns int
language sql stable security definer set search_path = public as $$
  select coalesce((
    select case when c.discount_type = 'percent' then p_subtotal * c.value / 100 else least(c.value, p_subtotal) end
    from coupons c
    where c.code = upper(p_code) and c.is_active
      and (c.starts_at is null or c.starts_at <= now()) and (c.ends_at is null or c.ends_at >= now())
      and (c.max_uses is null or c.used_count < c.max_uses) and p_subtotal >= c.min_order
  ), 0)
$$;
revoke execute on function preview_coupon(text, int) from public;
grant execute on function preview_coupon(text, int) to anon, authenticated;

commit;
