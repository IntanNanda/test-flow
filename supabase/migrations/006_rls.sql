-- ================================================================
-- 006_rls.sql
-- Row Level Security policies for all tables
-- ================================================================

-- Enable RLS
alter table public.profiles             enable row level security;
alter table public.teams                enable row level security;
alter table public.team_members         enable row level security;
alter table public.team_invites         enable row level security;
alter table public.projects             enable row level security;
alter table public.features             enable row level security;
alter table public.test_cases           enable row level security;
alter table public.test_steps           enable row level security;
alter table public.api_test_configs     enable row level security;
alter table public.lighthouse_configs   enable row level security;
alter table public.test_templates       enable row level security;
alter table public.test_runs            enable row level security;
alter table public.test_case_runs       enable row level security;
alter table public.api_perf_results     enable row level security;
alter table public.lighthouse_results   enable row level security;
alter table public.test_artifacts       enable row level security;
alter table public.schedules            enable row level security;
alter table public.notification_channels enable row level security;
alter table public.notification_rules   enable row level security;
alter table public.notification_log     enable row level security;
alter table public.run_summaries        enable row level security;
alter table public.performance_history  enable row level security;
alter table public.audit_log            enable row level security;

-- ── Drop all policies before recreating (idempotent) ─────────────
drop policy if exists "Users can view their own profile"                    on public.profiles;
drop policy if exists "Users can update their own profile"                  on public.profiles;
drop policy if exists "Team members can view team"                          on public.teams;
drop policy if exists "Team owners/admins can update team"                  on public.teams;
drop policy if exists "Team members can view membership list"               on public.team_members;
drop policy if exists "Team owners/admins can manage members"               on public.team_members;
drop policy if exists "Team admins can manage invites"                      on public.team_invites;
drop policy if exists "Anyone can read their own invite by token"           on public.team_invites;
drop policy if exists "Team members can view projects"                      on public.projects;
drop policy if exists "Team members (non-viewer) can insert projects"       on public.projects;
drop policy if exists "Team members (non-viewer) can update projects"       on public.projects;
drop policy if exists "Team owners/admins can delete projects"              on public.projects;
drop policy if exists "Team members can view features"                      on public.features;
drop policy if exists "Team members (non-viewer) can manage features"       on public.features;
drop policy if exists "Team members can view test cases"                    on public.test_cases;
drop policy if exists "Team members (non-viewer) can manage test cases"     on public.test_cases;
drop policy if exists "Team members can view test steps"                    on public.test_steps;
drop policy if exists "Team members (non-viewer) can manage test steps"     on public.test_steps;
drop policy if exists "Team members can view api configs"                   on public.api_test_configs;
drop policy if exists "Team members (non-viewer) can manage api configs"    on public.api_test_configs;
drop policy if exists "Team members can view lighthouse configs"            on public.lighthouse_configs;
drop policy if exists "Team members (non-viewer) can manage lighthouse configs" on public.lighthouse_configs;
drop policy if exists "Anyone authenticated can view global templates"      on public.test_templates;
drop policy if exists "Team members can create private templates"           on public.test_templates;
drop policy if exists "Team members can view test runs"                     on public.test_runs;
drop policy if exists "Team members (non-viewer) can insert test runs"      on public.test_runs;
drop policy if exists "Team members can view case runs"                     on public.test_case_runs;
drop policy if exists "Team members can view schedules"                     on public.schedules;
drop policy if exists "Team members (non-viewer) can manage schedules"      on public.schedules;
drop policy if exists "Team members can view notification channels"         on public.notification_channels;
drop policy if exists "Team admins can manage notification channels"        on public.notification_channels;
drop policy if exists "Team members can view notification rules"            on public.notification_rules;
drop policy if exists "Team admins can manage notification rules"           on public.notification_rules;
drop policy if exists "Team members can view run summaries"                 on public.run_summaries;
drop policy if exists "Team members can view performance history"           on public.performance_history;
drop policy if exists "Team members can view audit log"                     on public.audit_log;

-- ── Helper functions ─────────────────────────────────────────────

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and profile_id = auth.uid()
  );
$$;

create or replace function public.team_role(p_team_id uuid)
returns text
language sql security definer stable
as $$
  select role from public.team_members
  where team_id = p_team_id
    and profile_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_write_team(p_team_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and profile_id = auth.uid()
      and role in ('owner','admin','member')
  );
$$;

-- ── Profiles ─────────────────────────────────────────────────────
create policy "Users can view their own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- ── Teams ─────────────────────────────────────────────────────────
create policy "Team members can view team"
  on public.teams for select
  using (public.is_team_member(id));

create policy "Team owners/admins can update team"
  on public.teams for update
  using (public.team_role(id) in ('owner','admin'));

-- ── Team Members ─────────────────────────────────────────────────
create policy "Team members can view membership list"
  on public.team_members for select
  using (public.is_team_member(team_id));

create policy "Team owners/admins can manage members"
  on public.team_members for all
  using (public.team_role(team_id) in ('owner','admin'));

-- ── Team Invites ─────────────────────────────────────────────────
create policy "Team admins can manage invites"
  on public.team_invites for all
  using (public.team_role(team_id) in ('owner','admin'));

create policy "Anyone can read their own invite by token"
  on public.team_invites for select
  using (email = (select email from public.profiles where id = auth.uid()));

-- ── Projects ─────────────────────────────────────────────────────
create policy "Team members can view projects"
  on public.projects for select
  using (public.is_team_member(team_id));

create policy "Team members (non-viewer) can insert projects"
  on public.projects for insert
  with check (public.can_write_team(team_id));

create policy "Team members (non-viewer) can update projects"
  on public.projects for update
  using (public.can_write_team(team_id));

create policy "Team owners/admins can delete projects"
  on public.projects for delete
  using (public.team_role(team_id) in ('owner','admin'));

-- ── Features ─────────────────────────────────────────────────────
create policy "Team members can view features"
  on public.features for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and public.is_team_member(p.team_id)
    )
  );

create policy "Team members (non-viewer) can manage features"
  on public.features for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and public.can_write_team(p.team_id)
    )
  );

-- ── Test Cases ───────────────────────────────────────────────────
create policy "Team members can view test cases"
  on public.test_cases for select
  using (
    exists (
      select 1 from public.features f
      join public.projects p on p.id = f.project_id
      where f.id = feature_id
        and public.is_team_member(p.team_id)
    )
  );

create policy "Team members (non-viewer) can manage test cases"
  on public.test_cases for all
  using (
    exists (
      select 1 from public.features f
      join public.projects p on p.id = f.project_id
      where f.id = feature_id
        and public.can_write_team(p.team_id)
    )
  );

-- ── Test Steps ───────────────────────────────────────────────────
create policy "Team members can view test steps"
  on public.test_steps for select
  using (
    exists (
      select 1 from public.test_cases tc
      join public.features f on f.id = tc.feature_id
      join public.projects p on p.id = f.project_id
      where tc.id = test_case_id
        and public.is_team_member(p.team_id)
    )
  );

create policy "Team members (non-viewer) can manage test steps"
  on public.test_steps for all
  using (
    exists (
      select 1 from public.test_cases tc
      join public.features f on f.id = tc.feature_id
      join public.projects p on p.id = f.project_id
      where tc.id = test_case_id
        and public.can_write_team(p.team_id)
    )
  );

-- ── API / Lighthouse Configs ──────────────────────────────────────
create policy "Team members can view api configs"
  on public.api_test_configs for select
  using (
    exists (
      select 1 from public.test_cases tc
      join public.features f on f.id = tc.feature_id
      join public.projects p on p.id = f.project_id
      where tc.id = test_case_id and public.is_team_member(p.team_id)
    )
  );

create policy "Team members (non-viewer) can manage api configs"
  on public.api_test_configs for all
  using (
    exists (
      select 1 from public.test_cases tc
      join public.features f on f.id = tc.feature_id
      join public.projects p on p.id = f.project_id
      where tc.id = test_case_id and public.can_write_team(p.team_id)
    )
  );

create policy "Team members can view lighthouse configs"
  on public.lighthouse_configs for select
  using (
    exists (
      select 1 from public.test_cases tc
      join public.features f on f.id = tc.feature_id
      join public.projects p on p.id = f.project_id
      where tc.id = test_case_id and public.is_team_member(p.team_id)
    )
  );

create policy "Team members (non-viewer) can manage lighthouse configs"
  on public.lighthouse_configs for all
  using (
    exists (
      select 1 from public.test_cases tc
      join public.features f on f.id = tc.feature_id
      join public.projects p on p.id = f.project_id
      where tc.id = test_case_id and public.can_write_team(p.team_id)
    )
  );

-- ── Templates ─────────────────────────────────────────────────────
create policy "Anyone authenticated can view global templates"
  on public.test_templates for select
  using (is_global = true or (team_id is not null and public.is_team_member(team_id)));

create policy "Team members can create private templates"
  on public.test_templates for insert
  with check (is_global = false and public.can_write_team(team_id));

-- ── Test Runs ─────────────────────────────────────────────────────
create policy "Team members can view test runs"
  on public.test_runs for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and public.is_team_member(p.team_id)
    )
  );

create policy "Team members (non-viewer) can insert test runs"
  on public.test_runs for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and public.can_write_team(p.team_id)
    )
  );

-- ── Test Case Runs ────────────────────────────────────────────────
create policy "Team members can view case runs"
  on public.test_case_runs for select
  using (
    exists (
      select 1 from public.test_runs tr
      join public.projects p on p.id = tr.project_id
      where tr.id = test_run_id and public.is_team_member(p.team_id)
    )
  );

-- ── Schedules ─────────────────────────────────────────────────────
create policy "Team members can view schedules"
  on public.schedules for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and public.is_team_member(p.team_id)
    )
  );

create policy "Team members (non-viewer) can manage schedules"
  on public.schedules for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and public.can_write_team(p.team_id)
    )
  );

-- ── Notification Channels ─────────────────────────────────────────
create policy "Team members can view notification channels"
  on public.notification_channels for select
  using (public.is_team_member(team_id));

create policy "Team admins can manage notification channels"
  on public.notification_channels for all
  using (public.team_role(team_id) in ('owner','admin'));

-- ── Notification Rules ─────────────────────────────────────────────
create policy "Team members can view notification rules"
  on public.notification_rules for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and public.is_team_member(p.team_id)
    )
  );

create policy "Team admins can manage notification rules"
  on public.notification_rules for all
  using (
    exists (
      select 1 from public.projects p
      join public.teams t on t.id = p.team_id
      where p.id = project_id and public.team_role(t.id) in ('owner','admin')
    )
  );

-- ── Run Summaries & Performance History ───────────────────────────
create policy "Team members can view run summaries"
  on public.run_summaries for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and public.is_team_member(p.team_id)
    )
  );

create policy "Team members can view performance history"
  on public.performance_history for select
  using (
    exists (
      select 1 from public.test_cases tc
      join public.features f on f.id = tc.feature_id
      join public.projects p on p.id = f.project_id
      where tc.id = test_case_id and public.is_team_member(p.team_id)
    )
  );

-- ── Audit Log ─────────────────────────────────────────────────────
create policy "Team members can view audit log"
  on public.audit_log for select
  using (public.is_team_member(team_id));
