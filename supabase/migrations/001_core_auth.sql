-- ================================================================
-- 001_core_auth.sql
-- User profiles, teams, memberships, invites
-- ================================================================

-- Profiles extend auth.users (created automatically via trigger)
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Teams / workspaces
create table if not exists public.teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  owner_id   uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Team memberships
create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'member'
    check (role in ('owner', 'admin', 'member', 'viewer')),
  invited_by uuid references public.profiles(id),
  joined_at  timestamptz not null default now(),
  unique (team_id, profile_id)
);

-- Team invites (token-based)
create table if not exists public.team_invites (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  email      text not null,
  role       text not null default 'member'
    check (role in ('admin', 'member', 'viewer')),
  token      text unique not null default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid not null references public.profiles(id),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Trigger: auto-create profile + personal team on signup ───────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_team_id uuid;
  v_slug    text;
begin
  -- Insert profile
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );

  -- Create personal team
  v_slug := regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9]', '-', 'g');
  v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.teams (name, slug, owner_id)
  values (
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)) || '''s workspace',
    v_slug,
    new.id
  )
  returning id into v_team_id;

  -- Add as owner
  insert into public.team_members (team_id, profile_id, role)
  values (v_team_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── updated_at trigger ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
