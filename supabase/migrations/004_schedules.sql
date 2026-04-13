-- ================================================================
-- 004_schedules.sql
-- Schedules, notification channels, rules, log
-- ================================================================

-- ── Schedules ────────────────────────────────────────────────────
create table if not exists public.schedules (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  name                text not null,
  cron_expr           text not null,
  timezone            text not null default 'UTC',
  preset              text check (preset in ('nightly','weekly','hourly','custom')),
  is_active           boolean not null default true,
  filter_tags         text[],
  filter_feature_ids  uuid[],
  environment         text not null default 'production',
  base_url_override   text,
  created_by          uuid not null references public.profiles(id),
  last_run_at         timestamptz,
  next_run_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists schedules_updated_at on public.schedules;
create trigger schedules_updated_at
  before update on public.schedules
  for each row execute procedure public.set_updated_at();

-- Back-fill FK on test_runs (only if it doesn't already exist)
do $$ begin
  alter table public.test_runs
    add constraint test_runs_schedule_id_fkey
    foreign key (schedule_id) references public.schedules(id)
    on delete set null;
exception when duplicate_object then null; end $$;

-- ── Notification Channels ────────────────────────────────────────
create table if not exists public.notification_channels (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  name         text not null,
  channel_type text not null check (channel_type in ('slack','discord','email')),
  config       jsonb not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ── Notification Rules ───────────────────────────────────────────
create table if not exists public.notification_rules (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  channel_id    uuid not null references public.notification_channels(id) on delete cascade,
  on_failure    boolean not null default true,
  on_regression boolean not null default true,
  on_completion boolean not null default false,
  on_recovery   boolean not null default true,
  min_severity  text not null default 'high'
    check (min_severity in ('critical','high','medium','low')),
  quiet_start   time,
  quiet_end     time,
  created_at    timestamptz not null default now()
);

-- ── Notification Log ─────────────────────────────────────────────
create table if not exists public.notification_log (
  id           uuid primary key default gen_random_uuid(),
  rule_id      uuid references public.notification_rules(id),
  run_id       uuid references public.test_runs(id),
  channel_type text not null,
  status       text not null check (status in ('sent','failed','suppressed')),
  payload      jsonb,
  error        text,
  sent_at      timestamptz not null default now()
);
