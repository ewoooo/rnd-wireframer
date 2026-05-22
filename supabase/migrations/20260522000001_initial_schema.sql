-- ============================================================
-- screen_routes
-- ============================================================
create table screen_routes (
  id            text        primary key,
  module_id     text        not null,
  name          text        not null,
  "order"       integer     not null,
  process_id    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- screen_variants
-- ============================================================
create table screen_variants (
  id                   text        primary key,
  screen_route_id      text        not null references screen_routes(id),
  name                 text        not null,
  "order"              integer     not null,
  variant_type         text        not null check (variant_type in ('base', 'edge')),
  base_variant_id      text        references screen_variants(id),
  trigger              text,
  difference_from_base text,
  follow_up            text,
  source_ref           jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ============================================================
-- screens
-- ============================================================
create table screens (
  id                   text        primary key,
  screen_variant_id    text        not null references screen_variants(id),
  version              text        not null,
  min_renderer_version text        not null,
  "order"              integer     not null,
  pattern_id           text,
  pattern_variant      text,
  theme_mode           text        not null default 'light',
  title                text,
  author               text,
  screen               jsonb       not null,
  source_ref           jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ============================================================
-- organisms
-- ============================================================
create table organisms (
  id               text        primary key,
  type             text        not null default 'Organism',
  version          text        not null,
  pattern_id       text,
  pattern_variant  text,
  title            text,
  author           text,
  props            jsonb,
  children         jsonb,
  states           jsonb,
  policy_refs      jsonb,
  feature_refs     jsonb,
  source_ref       jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- components
-- ============================================================
create table components (
  id               text        primary key,
  type             text        not null,
  version          text        not null,
  pattern_id       text,
  pattern_variant  text,
  title            text,
  author           text,
  props            jsonb,
  children         jsonb,
  hooks            jsonb,
  events           jsonb,
  display          jsonb,
  source_ref       jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- component_renderer_kinds
-- ============================================================
create table component_renderer_kinds (
  type  text primary key,
  kind  text not null
);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_screen_routes_updated_at
  before update on screen_routes
  for each row execute function set_updated_at();

create trigger trg_screen_variants_updated_at
  before update on screen_variants
  for each row execute function set_updated_at();

create trigger trg_screens_updated_at
  before update on screens
  for each row execute function set_updated_at();

create trigger trg_organisms_updated_at
  before update on organisms
  for each row execute function set_updated_at();

create trigger trg_components_updated_at
  before update on components
  for each row execute function set_updated_at();
