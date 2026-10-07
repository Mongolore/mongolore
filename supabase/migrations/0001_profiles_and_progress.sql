-- ТҮҮХ MAP — learner accounts and progress.
--
-- Run once: Supabase dashboard → SQL Editor → New query → paste this whole
-- file → Run. Safe to run again; it only creates what's missing.
--
-- profiles         one row per user: name, XP, level, streak, daily goal
-- lesson_progress  one row per finished lesson, with its best stars

-- ---------------------------------------------------------------- tables

create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text,
  xp              integer not null default 0 check (xp >= 0),
  level           integer not null default 1,
  level_title     text,
  streak          integer not null default 0,
  best_streak     integer not null default 0,
  last_active_day date,
  daily_xp        integer not null default 0,
  daily_day       date,
  -- One-off rewards already paid out, e.g. {"daily:2026-10-07": true, "map-quiz:khunnu": true}
  claimed         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  lesson_id    text not null,
  stars        smallint not null check (stars between 1 and 3),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create index if not exists profiles_xp_idx on public.profiles (xp desc);

-- ---------------------------------------------------------- row security
-- Signed-in users may read only their own rows. All writes go through the
-- server (app/api/progress, using the secret key), so the public API gets no
-- insert/update/delete rights and nobody can edit their XP directly.

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;

revoke all on public.profiles, public.lesson_progress from anon;
revoke insert, update, delete, truncate on public.profiles, public.lesson_progress from authenticated;
grant select on public.profiles, public.lesson_progress to authenticated;

drop policy if exists "Own profile: read" on public.profiles;
create policy "Own profile: read" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Own lessons: read" on public.lesson_progress;
create policy "Own lessons: read" on public.lesson_progress
  for select to authenticated using ((select auth.uid()) = user_id);

-- Policies from an earlier draft of this file, if it was run before.
drop policy if exists "Own profile: update" on public.profiles;
drop policy if exists "Own lessons: write" on public.lesson_progress;
drop policy if exists "Own lessons: update" on public.lesson_progress;

-- --------------------------------------------- a profile for every user
-- New sign-ups get a profile row automatically.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Only the trigger should run this; keep it off the public API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users who signed up before this migration.
insert into public.profiles (id, display_name)
select id, raw_user_meta_data ->> 'display_name' from auth.users
on conflict (id) do nothing;
