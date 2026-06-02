-- ============================================================
-- Render table read model
-- Mirrors data/tables/*.json using layout-based records.
-- Existing Supabase workbench tables are kept during transition.
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists render_screen_routes (
  id          text        primary key,
  module_id   text,
  name        text        not null,
  order_index integer,
  process_id  text,
  raw         jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists render_screen_variants (
  id              text        primary key,
  screen_route_id text        not null references render_screen_routes(id) on delete cascade,
  name            text        not null,
  order_index     integer,
  variant_type    text        not null default 'base',
  follow_up       text,
  raw             jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint render_screen_variants_type_check check (variant_type in ('base', 'edge'))
);

create table if not exists render_screens (
  id                   text        primary key,
  screen_variant_id    text        references render_screen_variants(id) on delete set null,
  version              text        not null default '0.1.0',
  min_renderer_version text,
  metadata             jsonb       not null default '{}'::jsonb,
  theme                jsonb,
  screen               jsonb       not null,
  layout               text,
  order_index          integer,
  raw                  jsonb       not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists render_areas (
  id         text        primary key,
  type       text        not null,
  version    text        not null default '0.1.0',
  metadata   jsonb       not null default '{}'::jsonb,
  props      jsonb,
  children   jsonb       not null default '[]'::jsonb,
  layout     text,
  raw        jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists render_components (
  id         text        primary key,
  type       text        not null,
  version    text        not null default '0.1.0',
  metadata   jsonb       not null default '{}'::jsonb,
  props      jsonb,
  children   jsonb       not null default '[]'::jsonb,
  hooks      jsonb,
  display    jsonb,
  layout     text,
  raw        jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_render_screen_routes_order
  on render_screen_routes(order_index, id);

create index if not exists idx_render_screen_variants_route_order
  on render_screen_variants(screen_route_id, order_index, id);

create index if not exists idx_render_screens_variant_order
  on render_screens(screen_variant_id, order_index, id);

create index if not exists idx_render_areas_layout
  on render_areas(layout);

create index if not exists idx_render_components_layout
  on render_components(layout);

drop trigger if exists trg_render_screen_routes_updated_at on render_screen_routes;
create trigger trg_render_screen_routes_updated_at
  before update on render_screen_routes
  for each row execute function set_updated_at();

drop trigger if exists trg_render_screen_variants_updated_at on render_screen_variants;
create trigger trg_render_screen_variants_updated_at
  before update on render_screen_variants
  for each row execute function set_updated_at();

drop trigger if exists trg_render_screens_updated_at on render_screens;
create trigger trg_render_screens_updated_at
  before update on render_screens
  for each row execute function set_updated_at();

drop trigger if exists trg_render_areas_updated_at on render_areas;
create trigger trg_render_areas_updated_at
  before update on render_areas
  for each row execute function set_updated_at();

drop trigger if exists trg_render_components_updated_at on render_components;
create trigger trg_render_components_updated_at
  before update on render_components
  for each row execute function set_updated_at();

alter table render_screen_routes enable row level security;
alter table render_screen_variants enable row level security;
alter table render_screens enable row level security;
alter table render_areas enable row level security;
alter table render_components enable row level security;

drop policy if exists "anon can read render_screen_routes" on render_screen_routes;
create policy "anon can read render_screen_routes"
  on render_screen_routes for select to anon, authenticated using (true);

drop policy if exists "authenticated can write render_screen_routes" on render_screen_routes;
create policy "authenticated can write render_screen_routes"
  on render_screen_routes for all to authenticated using (true) with check (true);

drop policy if exists "anon can read render_screen_variants" on render_screen_variants;
create policy "anon can read render_screen_variants"
  on render_screen_variants for select to anon, authenticated using (true);

drop policy if exists "authenticated can write render_screen_variants" on render_screen_variants;
create policy "authenticated can write render_screen_variants"
  on render_screen_variants for all to authenticated using (true) with check (true);

drop policy if exists "anon can read render_screens" on render_screens;
create policy "anon can read render_screens"
  on render_screens for select to anon, authenticated using (true);

drop policy if exists "authenticated can write render_screens" on render_screens;
create policy "authenticated can write render_screens"
  on render_screens for all to authenticated using (true) with check (true);

drop policy if exists "anon can read render_areas" on render_areas;
create policy "anon can read render_areas"
  on render_areas for select to anon, authenticated using (true);

drop policy if exists "authenticated can write render_areas" on render_areas;
create policy "authenticated can write render_areas"
  on render_areas for all to authenticated using (true) with check (true);

drop policy if exists "anon can read render_components" on render_components;
create policy "anon can read render_components"
  on render_components for select to anon, authenticated using (true);

drop policy if exists "authenticated can write render_components" on render_components;
create policy "authenticated can write render_components"
  on render_components for all to authenticated using (true) with check (true);

