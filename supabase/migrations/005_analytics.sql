-- ================================================================
-- 005_analytics.sql
-- Run summaries (dashboard), performance history, audit log
-- ================================================================

-- ── Run Summaries (daily, refreshed via trigger) ─────────────────
create table if not exists public.run_summaries (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  feature_id      uuid references public.features(id),
  date            date not null,
  total_runs      integer not null default 0,
  total_cases_run integer not null default 0,
  passed          integer not null default 0,
  failed          integer not null default 0,
  pass_rate       numeric(5,4),
  bug_rate        numeric(5,4),
  avg_duration_ms integer,
  unique (project_id, feature_id, date)
);

create index if not exists idx_run_summaries_project_date on public.run_summaries(project_id, date desc);

-- Trigger to refresh run_summaries after each test_runs update
create or replace function public.refresh_run_summary()
returns trigger language plpgsql security definer as $$
declare
  v_date      date := coalesce(new.completed_at::date, now()::date);
  v_project   uuid := new.project_id;
begin
  -- Upsert overall project summary
  insert into public.run_summaries (project_id, feature_id, date, total_runs, total_cases_run, passed, failed, pass_rate, bug_rate)
  select
    project_id,
    null,
    v_date,
    count(*),
    sum(total_cases),
    sum(passed),
    sum(failed),
    case when sum(total_cases) > 0 then sum(passed)::numeric / sum(total_cases) else null end,
    case when sum(total_cases) > 0 then sum(failed)::numeric / sum(total_cases) else null end
  from public.test_runs
  where project_id = v_project
    and completed_at::date = v_date
    and status in ('passed','failed')
  group by project_id
  on conflict (project_id, feature_id, date) do update set
    total_runs      = excluded.total_runs,
    total_cases_run = excluded.total_cases_run,
    passed          = excluded.passed,
    failed          = excluded.failed,
    pass_rate       = excluded.pass_rate,
    bug_rate        = excluded.bug_rate;

  return new;
end;
$$;

drop trigger if exists after_test_run_complete on public.test_runs;
create trigger after_test_run_complete
  after update of status on public.test_runs
  for each row
  when (new.status in ('passed','failed'))
  execute procedure public.refresh_run_summary();

-- ── Performance History ───────────────────────────────────────────
create table if not exists public.performance_history (
  id                   uuid primary key default gen_random_uuid(),
  test_case_id         uuid not null references public.test_cases(id) on delete cascade,
  run_date             date not null,
  performance_score    integer,
  accessibility_score  integer,
  lcp_ms               numeric(10,2),
  cls                  numeric(6,4),
  fcp_ms               numeric(10,2),
  p95_ms               numeric(10,2),
  error_rate           numeric(5,4),
  created_at           timestamptz not null default now()
);

create index if not exists idx_perf_history_test_case_date on public.performance_history(test_case_id, run_date desc);

-- ── Audit Log ─────────────────────────────────────────────────────
create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid references public.teams(id),
  actor_id    uuid references public.profiles(id),
  action      text not null,
  resource    text not null,
  resource_id uuid,
  diff        jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_audit_log_team_id on public.audit_log(team_id, created_at desc);
create index if not exists idx_audit_log_resource on public.audit_log(resource, resource_id);
