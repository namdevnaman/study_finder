-- Fix infinite recursion in the conversation_members SELECT policy.
--
-- The old policy self-referenced conversation_members in an EXISTS subquery,
-- which re-triggers the policy on the inner query: Postgres aborts with a
-- 42P17 "infinite recursion detected in policy" error. That broke every
-- client-side message/conversation read and insert (they were only working
-- through SECURITY DEFINER RPCs like get_my_conversations).

-- Security-definer helper that queries the table without re-applying RLS.
create or replace function public.can_view_conversation_members(conv_id uuid, user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = conv_id and cm.user_id = user_id
  );
$$;

revoke all on function public.can_view_conversation_members(uuid, uuid) from public;
grant execute on function public.can_view_conversation_members(uuid, uuid) to authenticated;

drop policy if exists "Users see members of conversations they belong to" on public.conversation_members;
create policy "Users see members of conversations they belong to"
on public.conversation_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.can_view_conversation_members(conversation_id, auth.uid())
);