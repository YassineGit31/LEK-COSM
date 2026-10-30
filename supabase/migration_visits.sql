-- ============================================================
-- COSMÉTIQUE LE K — Statistiques de visites (visiteurs par jour)
-- Additive et idempotente. À exécuter une fois dans Supabase > SQL Editor.
--
-- Vie privée : on ne stocke AUCUNE donnée personnelle (ni IP, ni nom, ni user-agent).
-- Un identifiant aléatoire anonyme (créé dans le navigateur du visiteur) est compté une fois par jour.
-- ============================================================
begin;

create table if not exists site_visits (
  day        date        not null,
  visitor_id text        not null,
  page_views int         not null default 1,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  primary key (day, visitor_id)
);
alter table site_visits enable row level security;
-- Aucune policy publique : le navigateur ne peut ni lire ni écrire directement. Lecture réservée à l'admin.
drop policy if exists "admin read visits" on site_visits;
create policy "admin read visits" on site_visits for select using (is_admin());

-- Enregistrement d'une visite (appelée par le site). Jour calculé à l'heure d'Alger.
create or replace function track_visit(p_visitor text) returns void
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Africa/Algiers')::date;
begin
  if p_visitor is null or p_visitor !~ '^[A-Za-z0-9-]{8,64}$' then return; end if;
  insert into site_visits(day, visitor_id) values (d, p_visitor)
  on conflict (day, visitor_id) do update set page_views = site_visits.page_views + 1, last_seen = now();
end $$;
revoke execute on function track_visit(text) from public;
grant execute on function track_visit(text) to anon, authenticated;

-- Visiteurs uniques et pages vues par jour (admin uniquement). Les jours sans visite apparaissent avec 0.
create or replace function visits_daily(p_days int default 30)
returns table (day date, visitors bigint, page_views bigint)
language plpgsql stable security definer set search_path = public as $$
declare t date := (now() at time zone 'Africa/Algiers')::date; n int := greatest(1, least(coalesce(p_days, 30), 365));
begin
  if not is_admin() then raise exception 'FORBIDDEN'; end if;
  return query
    select g.d::date, count(v.visitor_id), coalesce(sum(v.page_views), 0)::bigint
    from generate_series((t - (n - 1))::timestamp, t::timestamp, interval '1 day') as g(d)
    left join site_visits v on v.day = g.d::date
    group by g.d order by g.d desc;
end $$;
revoke execute on function visits_daily(int) from public, anon;
grant execute on function visits_daily(int) to authenticated;

commit;
