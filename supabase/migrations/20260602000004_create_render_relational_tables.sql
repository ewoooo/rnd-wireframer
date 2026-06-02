-- ============================================================
-- Relational render read model
-- Keeps existing old screen_routes/screens/components tables for Puck/Web.
-- The render_* tables below are the DB-backed materializer read model.
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop table if exists render_component_children cascade;
drop table if exists render_area_children cascade;
drop table if exists render_screen_region_children cascade;
drop table if exists render_components cascade;
drop table if exists render_areas cascade;
drop table if exists render_screen_regions cascade;
drop table if exists render_screens cascade;
drop table if exists render_screen_variants cascade;
drop table if exists render_screen_routes cascade;

drop type if exists render_area_type cascade;
drop type if exists render_screen_region_type cascade;
drop type if exists render_screen_type cascade;
drop type if exists render_screen_variant_type cascade;

create type render_screen_variant_type as enum ('base', 'edge');
create type render_screen_type as enum ('page', 'bottomsheet', 'popup');
create type render_screen_region_type as enum ('header', 'contents', 'bottom');
create type render_area_type as enum ('area_static', 'area_dynamic');

create table render_screen_routes (
  id          text        primary key,
  module_id   text,
  process_id  text,
  name        text        not null,
  order_index integer     not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table render_screen_variants (
  id              text                       primary key,
  screen_route_id text                       not null references render_screen_routes(id) on delete cascade,
  name            text                       not null,
  order_index     integer                    not null,
  type            render_screen_variant_type not null default 'base',
  created_at      timestamptz                not null default now(),
  updated_at      timestamptz                not null default now()
);

create table render_screens (
  id                text               primary key,
  screen_variant_id text               not null references render_screen_variants(id) on delete cascade,
  version           text               not null default '0.1.0',
  type              render_screen_type not null default 'page',
  layout_id         text               not null,
  order_index       integer            not null default 0,
  name              text               not null,
  description       text,
  author            text,
  created_at        timestamptz        not null default now(),
  updated_at        timestamptz        not null default now()
);

create table render_screen_regions (
  id         text                      primary key,
  screen_id  text                      not null references render_screens(id) on delete cascade,
  type       render_screen_region_type not null,
  layout_id  text                      not null,
  created_at timestamptz               not null default now(),
  updated_at timestamptz               not null default now(),
  unique (screen_id, type)
);

create table render_areas (
  id          text             primary key,
  type        render_area_type not null,
  version     text             not null default '0.1.0',
  layout_id   text             not null,
  name        text             not null,
  description text,
  author      text,
  props       jsonb,
  created_at  timestamptz      not null default now(),
  updated_at  timestamptz      not null default now()
);

create table render_components (
  id          text        primary key,
  type        text        not null,
  version     text        not null default '0.1.0',
  layout_id   text        not null,
  name        text        not null,
  description text,
  author      text,
  display     jsonb,
  hooks       jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table render_screen_region_children (
  id               uuid        primary key default gen_random_uuid(),
  screen_region_id text        not null references render_screen_regions(id) on delete cascade,
  area_id          text        not null references render_areas(id) on delete restrict,
  order_index      integer     not null,
  created_at       timestamptz not null default now(),
  unique (screen_region_id, order_index)
);

create table render_area_children (
  id           uuid        primary key default gen_random_uuid(),
  area_id      text        not null references render_areas(id) on delete cascade,
  component_id text        not null references render_components(id) on delete restrict,
  order_index  integer     not null,
  created_at   timestamptz not null default now(),
  unique (area_id, order_index)
);

create table render_component_children (
  id                     uuid        primary key default gen_random_uuid(),
  component_id           text        not null references render_components(id) on delete cascade,
  order_index            integer     not null,
  catalog_component_type text        not null,
  variant                text,
  props                  jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (component_id, order_index)
);

create index idx_render_screen_routes_module_order
  on render_screen_routes(module_id, order_index, id);

create index idx_render_screen_routes_process
  on render_screen_routes(process_id);

create index idx_render_screen_variants_route_order
  on render_screen_variants(screen_route_id, order_index, id);

create index idx_render_screen_variants_type
  on render_screen_variants(type);

create index idx_render_screens_variant_order
  on render_screens(screen_variant_id, order_index, id);

create index idx_render_screens_layout
  on render_screens(layout_id);

create index idx_render_screen_regions_layout
  on render_screen_regions(layout_id);

create index idx_render_screen_region_children_area
  on render_screen_region_children(area_id);

create index idx_render_areas_layout
  on render_areas(layout_id);

create index idx_render_areas_type
  on render_areas(type);

create index idx_render_area_children_component
  on render_area_children(component_id);

create index idx_render_components_type
  on render_components(type);

create index idx_render_components_layout
  on render_components(layout_id);

create index idx_render_component_children_catalog_type
  on render_component_children(catalog_component_type);

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

drop trigger if exists trg_render_screen_regions_updated_at on render_screen_regions;
create trigger trg_render_screen_regions_updated_at
  before update on render_screen_regions
  for each row execute function set_updated_at();

drop trigger if exists trg_render_areas_updated_at on render_areas;
create trigger trg_render_areas_updated_at
  before update on render_areas
  for each row execute function set_updated_at();

drop trigger if exists trg_render_components_updated_at on render_components;
create trigger trg_render_components_updated_at
  before update on render_components
  for each row execute function set_updated_at();

drop trigger if exists trg_render_component_children_updated_at on render_component_children;
create trigger trg_render_component_children_updated_at
  before update on render_component_children
  for each row execute function set_updated_at();

alter table render_screen_routes enable row level security;
alter table render_screen_variants enable row level security;
alter table render_screens enable row level security;
alter table render_screen_regions enable row level security;
alter table render_screen_region_children enable row level security;
alter table render_areas enable row level security;
alter table render_area_children enable row level security;
alter table render_components enable row level security;
alter table render_component_children enable row level security;

create policy "anon can read render_screen_routes"
  on render_screen_routes for select to anon, authenticated using (true);
create policy "authenticated can write render_screen_routes"
  on render_screen_routes for all to authenticated using (true) with check (true);

create policy "anon can read render_screen_variants"
  on render_screen_variants for select to anon, authenticated using (true);
create policy "authenticated can write render_screen_variants"
  on render_screen_variants for all to authenticated using (true) with check (true);

create policy "anon can read render_screens"
  on render_screens for select to anon, authenticated using (true);
create policy "authenticated can write render_screens"
  on render_screens for all to authenticated using (true) with check (true);

create policy "anon can read render_screen_regions"
  on render_screen_regions for select to anon, authenticated using (true);
create policy "authenticated can write render_screen_regions"
  on render_screen_regions for all to authenticated using (true) with check (true);

create policy "anon can read render_screen_region_children"
  on render_screen_region_children for select to anon, authenticated using (true);
create policy "authenticated can write render_screen_region_children"
  on render_screen_region_children for all to authenticated using (true) with check (true);

create policy "anon can read render_areas"
  on render_areas for select to anon, authenticated using (true);
create policy "authenticated can write render_areas"
  on render_areas for all to authenticated using (true) with check (true);

create policy "anon can read render_area_children"
  on render_area_children for select to anon, authenticated using (true);
create policy "authenticated can write render_area_children"
  on render_area_children for all to authenticated using (true) with check (true);

create policy "anon can read render_components"
  on render_components for select to anon, authenticated using (true);
create policy "authenticated can write render_components"
  on render_components for all to authenticated using (true) with check (true);

create policy "anon can read render_component_children"
  on render_component_children for select to anon, authenticated using (true);
create policy "authenticated can write render_component_children"
  on render_component_children for all to authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated, service_role;

grant select on table
  render_screen_routes,
  render_screen_variants,
  render_screens,
  render_screen_regions,
  render_screen_region_children,
  render_areas,
  render_area_children,
  render_components,
  render_component_children
to anon, authenticated;

grant select, insert, update, delete on table
  render_screen_routes,
  render_screen_variants,
  render_screens,
  render_screen_regions,
  render_screen_region_children,
  render_areas,
  render_area_children,
  render_components,
  render_component_children
to authenticated, service_role;
