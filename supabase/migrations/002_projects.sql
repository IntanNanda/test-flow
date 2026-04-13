-- ================================================================
-- 002_projects.sql
-- Projects, features, test cases, steps, configs, templates
-- ================================================================

-- ── Enums ────────────────────────────────────────────────────────
do $$ begin
  create type public.test_scenario_type as enum ('positive', 'negative', 'edge');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.test_type as enum ('functional', 'api_performance', 'frontend_performance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.test_priority as enum ('critical', 'high', 'medium', 'low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.test_case_status as enum ('draft', 'active', 'deprecated');
exception when duplicate_object then null; end $$;

-- ── Projects ─────────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  name        text not null,
  slug        text not null,
  description text,
  base_url    text,
  status      text not null default 'active' check (status in ('active', 'archived')),
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (team_id, slug)
);

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

-- ── Features ─────────────────────────────────────────────────────
create table if not exists public.features (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  slug        text not null,
  description text,
  sort_order  integer not null default 0,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (project_id, slug)
);

drop trigger if exists features_updated_at on public.features;
create trigger features_updated_at
  before update on public.features
  for each row execute procedure public.set_updated_at();

-- ── Test Cases ───────────────────────────────────────────────────
create table if not exists public.test_cases (
  id                    uuid primary key default gen_random_uuid(),
  feature_id            uuid not null references public.features(id) on delete cascade,
  title                 text not null,
  description           text,
  scenario_type         public.test_scenario_type not null default 'positive',
  test_type             public.test_type not null default 'functional',
  priority              public.test_priority not null default 'medium',
  status                public.test_case_status not null default 'draft',
  preconditions         text,
  test_data             jsonb,
  tags                  text[] not null default '{}',
  assignee_id           uuid references public.profiles(id),
  estimated_duration_ms integer,
  last_run_at           timestamptz,
  last_run_status       text,
  created_by            uuid not null references public.profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists test_cases_updated_at on public.test_cases;
create trigger test_cases_updated_at
  before update on public.test_cases
  for each row execute procedure public.set_updated_at();

create index if not exists idx_test_cases_feature_id on public.test_cases(feature_id);
create index if not exists idx_test_cases_tags on public.test_cases using gin(tags);

-- ── Test Steps ───────────────────────────────────────────────────
create table if not exists public.test_steps (
  id                 uuid primary key default gen_random_uuid(),
  test_case_id       uuid not null references public.test_cases(id) on delete cascade,
  step_order         integer not null,
  action             text not null,
  selector           text,
  value              text,
  description        text,
  screenshot_on_step boolean not null default false,
  created_at         timestamptz not null default now(),
  unique (test_case_id, step_order)
);

create index if not exists idx_test_steps_test_case_id on public.test_steps(test_case_id);

-- ── API Test Configs ─────────────────────────────────────────────
create table if not exists public.api_test_configs (
  id                   uuid primary key default gen_random_uuid(),
  test_case_id         uuid unique not null references public.test_cases(id) on delete cascade,
  method               text not null check (method in ('GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS')),
  endpoint_path        text not null,
  headers              jsonb not null default '{}',
  request_body         jsonb,
  auth_type            text check (auth_type in ('none','bearer','basic','api_key')),
  auth_config          jsonb,
  concurrency          integer not null default 1 check (concurrency between 1 and 50),
  request_count        integer not null default 10,
  threshold_p50_ms     integer not null default 200,
  threshold_p95_ms     integer not null default 500,
  threshold_p99_ms     integer not null default 1000,
  threshold_error_rate numeric(5,4) not null default 0.05,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

drop trigger if exists api_test_configs_updated_at on public.api_test_configs;
create trigger api_test_configs_updated_at
  before update on public.api_test_configs
  for each row execute procedure public.set_updated_at();

-- ── Lighthouse Configs ───────────────────────────────────────────
create table if not exists public.lighthouse_configs (
  id                        uuid primary key default gen_random_uuid(),
  test_case_id              uuid unique not null references public.test_cases(id) on delete cascade,
  url                       text not null,
  device                    text not null default 'desktop' check (device in ('desktop','mobile')),
  run_count                 integer not null default 3 check (run_count between 1 and 10),
  throttling                text not null default 'simulated' check (throttling in ('none','simulated','applied')),
  threshold_performance     integer not null default 70 check (threshold_performance between 0 and 100),
  threshold_accessibility   integer not null default 90 check (threshold_accessibility between 0 and 100),
  threshold_best_practices  integer not null default 80 check (threshold_best_practices between 0 and 100),
  threshold_seo             integer not null default 70 check (threshold_seo between 0 and 100),
  regression_delta          integer not null default 5,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

drop trigger if exists lighthouse_configs_updated_at on public.lighthouse_configs;
create trigger lighthouse_configs_updated_at
  before update on public.lighthouse_configs
  for each row execute procedure public.set_updated_at();

-- ── Template Library ─────────────────────────────────────────────
create table if not exists public.test_templates (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  test_type     public.test_type not null,
  scenario_type public.test_scenario_type not null,
  category      text not null,
  steps_json    jsonb not null,
  is_global     boolean not null default true,
  team_id       uuid references public.teams(id),
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);
