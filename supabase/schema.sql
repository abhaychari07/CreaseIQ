-- Run this file in Supabase Dashboard → SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  batting_hand text check (batting_hand in ('right', 'left')),
  academy_name text,
  profile_completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists profile_completed_at timestamptz;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_path text not null,
  original_filename text not null,
  technique text not null,
  camera_angle text not null,
  reference_style text not null default 'balanced',
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'complete', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid unique not null references public.sessions(id) on delete cascade,
  model_version text not null,
  overall_score integer check (overall_score between 0 and 100),
  confidence text check (confidence in ('low', 'medium', 'high')),
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.technique_scores (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  checkpoint_id text not null,
  score integer not null check (score between 0 and 100),
  status text not null check (status in ('good', 'improve', 'pending')),
  message text,
  unique (analysis_id, checkpoint_id)
);

create table if not exists public.drill_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  drill_id text not null,
  completed_at timestamptz not null default now()
);

-- Create a matching public profile whenever a player signs in.
create or replace function public.create_profile_for_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_profile_for_user();

insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data ->> 'display_name', split_part(email, '@', 1)) from auth.users
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('cricket-videos', 'cricket-videos', false) on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.analyses enable row level security;
alter table public.technique_scores enable row level security;
alter table public.drill_completions enable row level security;

-- Policies are dropped first so this setup script can be safely re-run.
drop policy if exists "players manage own profile" on public.profiles;
drop policy if exists "players manage own sessions" on public.sessions;
drop policy if exists "players read own analyses" on public.analyses;
drop policy if exists "players read own technique scores" on public.technique_scores;
drop policy if exists "players manage drill completions" on public.drill_completions;
drop policy if exists "players create own analyses" on public.analyses;
drop policy if exists "players create own technique scores" on public.technique_scores;
drop policy if exists "players upload own videos" on storage.objects;
drop policy if exists "players view own videos" on storage.objects;
drop policy if exists "players delete own videos" on storage.objects;

create policy "players manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "players manage own sessions" on public.sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "players read own analyses" on public.analyses for select using (exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "players read own technique scores" on public.technique_scores for select using (exists (select 1 from public.analyses a join public.sessions s on s.id = a.session_id where a.id = analysis_id and s.user_id = auth.uid()));
create policy "players manage drill completions" on public.drill_completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "players create own analyses" on public.analyses for insert with check (exists (select 1 from public.sessions s where s.id = session_id and s.user_id = auth.uid()));
create policy "players create own technique scores" on public.technique_scores for insert with check (exists (select 1 from public.analyses a join public.sessions s on s.id = a.session_id where a.id = analysis_id and s.user_id = auth.uid()));
create policy "players upload own videos" on storage.objects for insert to authenticated with check (bucket_id = 'cricket-videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "players view own videos" on storage.objects for select to authenticated using (bucket_id = 'cricket-videos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "players delete own videos" on storage.objects for delete to authenticated using (bucket_id = 'cricket-videos' and (storage.foldername(name))[1] = auth.uid()::text);
