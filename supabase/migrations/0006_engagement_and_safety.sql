-- Study Group Finder — engagement, safety & session features

-- ============================================================
-- POST LIKES
-- ============================================================
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists idx_post_likes_post on public.post_likes(post_id);
create index if not exists idx_post_likes_user on public.post_likes(user_id);

alter table public.post_likes enable row level security;

create policy "likes are readable by signed-in users"
  on public.post_likes for select to authenticated using (true);

create policy "users like as themselves"
  on public.post_likes for insert to authenticated with check (auth.uid() = user_id);

create policy "users unlike their own"
  on public.post_likes for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- BOOKMARKS (saved posts)
-- ============================================================
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
create index if not exists idx_bookmarks_post on public.bookmarks(post_id);

alter table public.bookmarks enable row level security;

create policy "bookmarks visible to owner"
  on public.bookmarks for select to authenticated using (auth.uid() = user_id);

create policy "users bookmark as themselves"
  on public.bookmarks for insert to authenticated with check (auth.uid() = user_id);

create policy "users unbookmark their own"
  on public.bookmarks for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- CONTENT REPORTS
-- ============================================================
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment', 'group', 'resource')),
  target_id uuid not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  detail text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists idx_content_reports_status on public.content_reports(status);
create index if not exists idx_content_reports_target on public.content_reports(target_type, target_id);

alter table public.content_reports enable row level security;

create policy "users see their own reports"
  on public.content_reports for select to authenticated using (auth.uid() = reporter_id);

create policy "users report as themselves"
  on public.content_reports for insert to authenticated with check (auth.uid() = reporter_id);

-- ============================================================
-- COMMENTS — pinning (creator moderation)
-- ============================================================
alter table public.comments
  add column if not exists is_pinned boolean not null default false;

-- ============================================================
-- STUDY GROUP MEMBERS — attendance check-in
-- ============================================================
alter table public.study_group_members
  add column if not exists attended boolean not null default false;

-- ============================================================
-- SESSION REMINDERS
-- ============================================================
create table if not exists public.session_reminders (
  id uuid primary key default gen_random_uuid(),
  study_group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reminded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (study_group_id, user_id)
);

create index if not exists idx_session_reminders_user on public.session_reminders(user_id);

alter table public.session_reminders enable row level security;

create policy "reminders visible to owner"
  on public.session_reminders for select to authenticated using (auth.uid() = user_id);

create policy "users set their own reminders"
  on public.session_reminders for insert to authenticated with check (auth.uid() = user_id);

create policy "users remove their own reminders"
  on public.session_reminders for delete to authenticated using (auth.uid() = user_id);

-- ============================================================
-- PROFILES — notification preferences
-- ============================================================
alter table public.profiles
  add column if not exists notification_prefs jsonb
  not null default '{"join_requests": true, "comments": true, "likes": false, "sessions": true}';

-- keep signup metadata flowing into the profile (college name, interests)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, college_name, subjects_of_interest)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'college_name', ''),
    case
      when jsonb_typeof(new.raw_user_meta_data->'subjects_of_interest') = 'array'
      then (select array_agg(value) from jsonb_array_elements_text(new.raw_user_meta_data->'subjects_of_interest'))
      else '{}'
    end
  );
  return new;
end;
$$;