-- Fix RLS infinite recursion between study_groups and study_group_members
-- select policies, which reference each other via EXISTS subqueries
-- (Postgres error 42P17). A security-definer helper breaks the cycle while
-- preserving the exact same visibility semantics:
--   group visible to creator / members / anyone if privacy = 'public'

-- 1) SECURITY-DEFINER visibility helper (runs as owner, bypasses RLS on
--    the inner lookups so the policy evaluation terminates).
create or replace function public.can_view_study_group(target_group uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.study_groups g
     where g.id = target_group
       and (
         g.privacy = 'public'
         or g.creator_id = uid
         or exists (
           select 1
             from public.study_group_members m
            where m.study_group_id = target_group
              and m.user_id = uid
              and m.status = 'member'
         )
       )
  );
$$;

revoke all on function public.can_view_study_group(uuid, uuid) from public;
grant execute on function public.can_view_study_group(uuid, uuid) to authenticated;

-- 2) study_groups select policy -> use helper (no members subquery)
drop policy if exists "Public study groups are readable by all authenticated users"
  on public.study_groups;
create policy "Public study groups are readable by all authenticated users"
  on public.study_groups for select
  to authenticated
  using (public.can_view_study_group(public.study_groups.id, auth.uid()));

-- 3) study_group_members select policy -> use helper (no groups subquery)
drop policy if exists "Membership is readable by group members"
  on public.study_group_members;
create policy "Membership is readable by group members"
  on public.study_group_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.can_view_study_group(public.study_group_members.study_group_id, auth.uid())
  );