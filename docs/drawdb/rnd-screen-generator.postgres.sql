-- RND Screen Generator drawDB import source
-- Database: PostgreSQL
-- Source of truth: docs/development/DATA_MAP.md

create extension if not exists pgcrypto;

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table screen_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  module_kind text not null,
  screen_code text not null,
  name text not null,
  description text,
  route_path text,
  implementation_type text,
  policy_groups jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  transitions jsonb not null default '[]'::jsonb,
  case_branches jsonb not null default '[]'::jsonb,
  source_name text,
  source_hash text,
  source_json jsonb not null,
  schema_version text not null,
  normalized_json jsonb not null,
  validation_status text not null,
  validation_warnings jsonb not null default '[]'::jsonb,
  author text,
  document_version text,
  written_at date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_screen_sources_project_module_code
    unique (project_id, module_kind, screen_code),
  constraint chk_screen_sources_validation_status
    check (validation_status in ('valid', 'warning', 'failed'))
);

create table organism_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  module_kind text not null,
  organism_source_code text not null,
  name text not null,
  description text,
  layout text,
  visibility_rule text,
  visibility_cases jsonb not null default '[]'::jsonb,
  components jsonb not null default '[]'::jsonb,
  case_branches jsonb not null default '[]'::jsonb,
  policies jsonb not null default '[]'::jsonb,
  policy_groups jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  source_name text,
  source_hash text,
  source_json jsonb not null,
  schema_version text not null,
  normalized_json jsonb not null,
  validation_status text not null,
  validation_warnings jsonb not null default '[]'::jsonb,
  author text,
  document_version text,
  written_at date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_organism_sources_project_module_code
    unique (project_id, module_kind, organism_source_code),
  constraint chk_organism_sources_validation_status
    check (validation_status in ('valid', 'warning', 'failed'))
);

create table screen_source_organisms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  screen_source_id uuid not null references screen_sources(id) on delete cascade,
  organism_source_id uuid references organism_sources(id) on delete set null,
  module_kind text not null,
  organism_source_code text not null,
  section_no text not null,
  area_type text,
  area_description text,
  area_layout text,
  organism_name text,
  organism_description text,
  server_controls jsonb not null default '[]'::jsonb,
  min_count integer,
  max_count integer,
  priority integer,
  error_handling text,
  raw_item jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_screen_source_organisms_section
    unique (screen_source_id, section_no)
);

create table screen_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  screen_source_id uuid not null references screen_sources(id) on delete cascade,
  module_kind text not null,
  status text not null,
  generation_model text,
  review_model text,
  generation_execution_mode text,
  review_execution_mode text,
  generation_session_id text,
  review_session_id text,
  instruction text,
  selected_organism_source_ids uuid[],
  selected_screen_source_organism_ids uuid[],
  latest_set_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_screen_generation_jobs_status
    check (status in ('pending', 'completed', 'failed')),
  constraint chk_screen_generation_jobs_generation_execution_mode
    check (generation_execution_mode is null or generation_execution_mode in ('local_session', 'remote_api')),
  constraint chk_screen_generation_jobs_review_execution_mode
    check (review_execution_mode is null or review_execution_mode in ('local_session', 'remote_api'))
);

create table generated_screen_sets (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references screen_generation_jobs(id) on delete cascade,
  parent_set_id uuid references generated_screen_sets(id) on delete set null,
  version_number integer not null,
  feedback text,
  prompt text not null,
  prompt_inputs jsonb not null default '{}'::jsonb,
  validation_status text not null,
  validation_errors jsonb not null default '[]'::jsonb,
  review_status text,
  review_result jsonb,
  runtime_diagnostics jsonb,
  created_at timestamptz not null default now(),
  constraint uq_generated_screen_sets_number
    unique (job_id, version_number),
  constraint chk_generated_screen_sets_validation_status
    check (validation_status in ('valid', 'invalid')),
  constraint chk_generated_screen_sets_review_status
    check (review_status is null or review_status in ('pending', 'passed', 'failed', 'needs_regeneration'))
);

create table generated_screens (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references generated_screen_sets(id) on delete cascade,
  screen_type text not null,
  screen_code text not null,
  source_screen_code text,
  source_case_code text,
  title text,
  trigger text,
  difference_from_base text,
  follow_up text,
  layout_json jsonb not null default '{}'::jsonb,
  chrome_json jsonb not null default '{}'::jsonb,
  review_status text,
  review_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_generated_screens_screen_type
    check (screen_type in ('base', 'variant')),
  constraint chk_generated_screens_review_status
    check (review_status is null or review_status in ('pending', 'passed', 'failed', 'needs_regeneration')),
  constraint uq_generated_screens_set_code
    unique (set_id, screen_code)
);

create table generated_organisms (
  id uuid primary key default gen_random_uuid(),
  generated_screen_id uuid not null references generated_screens(id) on delete cascade,
  screen_source_organism_id uuid references screen_source_organisms(id) on delete set null,
  organism_source_id uuid references organism_sources(id) on delete set null,
  organism_source_code text not null,
  section_no text not null,
  area_type text,
  title text,
  layout_json jsonb not null default '{}'::jsonb,
  components_json jsonb not null default '[]'::jsonb,
  edited_json jsonb,
  edit_status text not null default 'none',
  review_status text,
  review_result jsonb,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_generated_organisms_edit_status
    check (edit_status in ('none', 'draft', 'published')),
  constraint chk_generated_organisms_review_status
    check (review_status is null or review_status in ('pending', 'passed', 'failed', 'needs_regeneration')),
  constraint uq_generated_organisms_screen_section
    unique (generated_screen_id, section_no)
);

alter table screen_generation_jobs
  add constraint fk_screen_generation_jobs_latest_set
  foreign key (latest_set_id)
  references generated_screen_sets(id)
  on delete set null;

