-- Study Group Finder — Phase 1 (MVP) initial schema
-- One college campus.

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  branch text,
  year integer,
  semester integer,
  bio text,
  avatar_url text,
  subjects_of_interest text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SUBJECTS
-- ============================================================
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now(),
  unique (department_id, name)
);

-- ============================================================
-- TOPICS
-- ============================================================
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (subject_id, name)
);

-- ============================================================
-- STUDY GROUPS
-- ============================================================
create type public.study_group_privacy as enum ('public', 'private', 'approval_required');
create type public.study_group_member_status as enum ('member', 'requested');

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  description text,
  session_date date,
  start_time time,
  end_time time,
  max_participants integer,
  meet_link text,
  privacy public.study_group_privacy not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_group_members (
  id uuid primary key default gen_random_uuid(),
  study_group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.study_group_member_status not null default 'member',
  joined_at timestamptz not null default now(),
  unique (study_group_id, user_id)
);

-- ============================================================
-- POSTS (Doubts, Discussions, Resources, etc.)
-- ============================================================
create type public.post_type as enum (
  'question',
  'discussion',
  'study_partner_request',
  'study_group',
  'resource',
  'project_collaboration'
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  type public.post_type not null default 'question',
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RESOURCES
-- ============================================================
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  url text not null,
  description text,
  kind text, -- drive, github, docs, youtube, pdf
  created_at timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read boolean not null default false,
  data jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- FOLLOWS
-- ============================================================
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_subjects_department on public.subjects(department_id);
create index if not exists idx_topics_subject on public.topics(subject_id);
create index if not exists idx_study_groups_subject on public.study_groups(subject_id);
create index if not exists idx_study_groups_topic on public.study_groups(topic_id);
create index if not exists idx_study_group_members_group on public.study_group_members(study_group_id);
create index if not exists idx_posts_subject on public.posts(subject_id);
create index if not exists idx_posts_topic on public.posts(topic_id);
create index if not exists idx_comments_post on public.comments(post_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

create trigger set_updated_at
before update on public.study_groups
for each row execute function public.handle_updated_at();

create trigger set_updated_at
before update on public.posts
for each row execute function public.handle_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''),
          coalesce(new.email, ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
