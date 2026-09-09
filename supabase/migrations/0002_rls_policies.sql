-- Study Group Finder — Row Level Security policies (Phase 1 MVP)
-- Enable RLS on all tables and grant the minimum required access.

-- ============================================================
-- ENABLE RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.resources enable row level security;
alter table public.notifications enable row level security;
alter table public.follows enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================
create policy "Profiles are visible to all authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- ============================================================
-- DEPARTMENTS / SUBJECTS / TOPICS (reference data, select for all)
-- ============================================================
create policy "Departments are readable by all authenticated users"
on public.departments for select
to authenticated
using (true);

create policy "Subjects are readable by all authenticated users"
on public.subjects for select
to authenticated
using (true);

create policy "Topics are readable by all authenticated users"
on public.topics for select
to authenticated
using (true);

-- ============================================================
-- STUDY GROUPS
-- ============================================================
create policy "Public study groups are readable by all authenticated users"
on public.study_groups for select
to authenticated
using (
  privacy = 'public'
  or creator_id = auth.uid()
  or exists (
    select 1 from public.study_group_members sgm
    where sgm.study_group_id = public.study_groups.id
      and sgm.user_id = auth.uid()
      and sgm.status = 'member'
  )
);

create policy "Users can create study groups"
on public.study_groups for insert
to authenticated
with check (creator_id = auth.uid());

create policy "Creators can update their study groups"
on public.study_groups for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

create policy "Creators can delete their study groups"
on public.study_groups for delete
to authenticated
using (creator_id = auth.uid());

-- ============================================================
-- STUDY GROUP MEMBERS
-- ============================================================
create policy "Membership is readable by group members"
on public.study_group_members for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.study_groups sg
    where sg.id = public.study_group_members.study_group_id
      and (sg.creator_id = auth.uid() or sg.privacy = 'public')
  )
);

create policy "Users can request to join or join study groups"
on public.study_group_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.study_groups sg
    where sg.id = public.study_group_members.study_group_id
  )
);

create policy "Users can leave a study group"
on public.study_group_members for delete
to authenticated
using (user_id = auth.uid());

-- ============================================================
-- POSTS
-- ============================================================
create policy "Posts are readable by all authenticated users"
on public.posts for select
to authenticated
using (true);

create policy "Users can create posts"
on public.posts for insert
to authenticated
with check (author_id = auth.uid());

create policy "Authors can update their own posts"
on public.posts for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "Authors can delete their own posts"
on public.posts for delete
to authenticated
using (author_id = auth.uid());

-- ============================================================
-- COMMENTS
-- ============================================================
create policy "Comments are readable by all authenticated users"
on public.comments for select
to authenticated
using (true);

create policy "Users can create comments"
on public.comments for insert
to authenticated
with check (author_id = auth.uid());

create policy "Authors can delete their own comments"
on public.comments for delete
to authenticated
using (author_id = auth.uid());

-- ============================================================
-- RESOURCES
-- ============================================================
create policy "Resources are readable by all authenticated users"
on public.resources for select
to authenticated
using (true);

create policy "Users can create resources"
on public.resources for insert
to authenticated
with check (author_id = auth.uid());

create policy "Authors can delete their own resources"
on public.resources for delete
to authenticated
using (author_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create policy "Users can read their own notifications"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

create policy "Users can update their own notifications"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- FOLLOWS
-- ============================================================
create policy "Follows are readable by all authenticated users"
on public.follows for select
to authenticated
using (true);

create policy "Users can follow"
on public.follows for insert
to authenticated
with check (follower_id = auth.uid());

create policy "Users can unfollow"
on public.follows for delete
to authenticated
using (follower_id = auth.uid());
