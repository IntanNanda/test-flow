-- ================================================================
-- 003_test_runs.sql
-- Test runs, case runs, performance results, artifacts
-- ================================================================

-- ── Enums ────────────────────────────────────────────────────────
do $$ begin
  create type public.run_status as enum ('pending','queued','running','passed','failed','error','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.case_run_status as enum ('pending','running','passed','failed','error','skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.trigger_type as enum ('manual','scheduled','api');
exception when duplicate_object then null; end $$;

-- ── Test Runs (top-level execution) ──────────────────────────────
create table if not exists public.test_runs (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  name               text,
  status             public.run_status not null default 'pending',
  trigger_type       public.trigger_type not null default 'manual',
  triggered_by       uuid references public.profiles(id),
  schedule_id        uuid,  -- FK added after schedules table
  environment        text not null default 'production',
  base_url_override  text,
  total_cases        integer not null default 0,
  passed             integer not null default 0,
  failed             integer not null default 0,
  skipped            integer not null default 0,
  errored            integer not null default 0,
  started_at         timestamptz,
  completed_at       timestamptz,
  duration_ms        integer,
  worker_node_id     text,
  metadata           jsonb not null default '{}',
  created_at         timestamptz not null default now()
);

create index if not exists idx_test_runs_project_id on public.test_runs(project_id);
create index if not exists idx_test_runs_status on public.test_runs(status);
create index if not exists idx_test_runs_created_at on public.test_runs(created_at desc);

-- ── Test Case Runs (per-case result within a run) ────────────────
create table if not exists public.test_case_runs (
  id              uuid primary key default gen_random_uuid(),
  test_run_id     uuid not null references public.test_runs(id) on delete cascade,
  test_case_id    uuid not null references public.test_cases(id),
  status          public.case_run_status not null default 'pending',
  started_at      timestamptz,
  completed_at    timestamptz,
  duration_ms     integer,
  error_message   text,
  error_stack     text,
  step_results    jsonb,
  screenshot_urls text[] not null default '{}',
  video_url       text,
  console_log     text,
  network_log     jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_test_case_runs_run_id on public.test_case_runs(test_run_id);
create index if not exists idx_test_case_runs_test_case_id on public.test_case_runs(test_case_id);

-- ── API Performance Results ───────────────────────────────────────
create table if not exists public.api_perf_results (
  id               uuid primary key default gen_random_uuid(),
  case_run_id      uuid not null references public.test_case_runs(id) on delete cascade,
  total_requests   integer not null,
  successful       integer not null,
  failed_requests  integer not null,
  p50_ms           numeric(10,2),
  p75_ms           numeric(10,2),
  p95_ms           numeric(10,2),
  p99_ms           numeric(10,2),
  min_ms           numeric(10,2),
  max_ms           numeric(10,2),
  avg_ms           numeric(10,2),
  error_rate       numeric(5,4),
  throughput_rps   numeric(10,2),
  raw_timings      jsonb,
  threshold_result jsonb,
  created_at       timestamptz not null default now()
);

-- ── Lighthouse Results ───────────────────────────────────────────
create table if not exists public.lighthouse_results (
  id                    uuid primary key default gen_random_uuid(),
  case_run_id           uuid not null references public.test_case_runs(id) on delete cascade,
  run_number            integer not null,
  is_median             boolean not null default false,
  performance_score     integer,
  accessibility_score   integer,
  best_practices_score  integer,
  seo_score             integer,
  -- Core Web Vitals
  lcp_ms                numeric(10,2),
  cls                   numeric(6,4),
  fid_ms                numeric(10,2),
  ttfb_ms               numeric(10,2),
  fcp_ms                numeric(10,2),
  tbt_ms                numeric(10,2),
  si_ms                 numeric(10,2),
  -- Environment metadata
  chrome_version        text,
  lighthouse_version    text,
  throttling_profile    text,
  -- Report files
  report_url            text,
  raw_json_url          text,
  -- Regression
  regression_detected   boolean not null default false,
  previous_score        integer,
  created_at            timestamptz not null default now()
);

create index if not exists idx_lighthouse_results_case_run_id on public.lighthouse_results(case_run_id);

-- ── Test Artifacts ───────────────────────────────────────────────
create table if not exists public.test_artifacts (
  id              uuid primary key default gen_random_uuid(),
  case_run_id     uuid not null references public.test_case_runs(id) on delete cascade,
  artifact_type   text not null check (artifact_type in ('screenshot','video','har','log','report')),
  storage_path    text not null,
  file_size_bytes bigint,
  mime_type       text,
  step_order      integer,
  created_at      timestamptz not null default now()
);
