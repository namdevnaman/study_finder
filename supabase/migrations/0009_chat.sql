-- Study Group Finder — WhatsApp-style chat (group + 1:1 direct)
-- Migration 0009
-- Requires: 0001 (profiles, study_groups, study_group_members)

-- ============================================================
-- 1) TABLES
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct', 'group')),
  title text,
  study_group_id uuid references public.study_groups(id) on delete cascade,
  direct_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_direct on public.conversations(direct_key);
create index if not exists idx_conversations_group on public.conversations(study_group_id);
create index if not exists idx_conversation_members_user on public.conversation_members(user_id);
create index if not exists idx_conversation_members_conv on public.conversation_members(conversation_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);

-- helper to compute a deterministic direct_key
create or replace function public.direct_conversation_key(a uuid, b uuid)
returns text
language sql
immutable
as $$
  select 'd:' || least(a::text, b::text) || ':' || greatest(a::text, b::text);
$$;

-- ============================================================
-- 2) RLS
-- ============================================================
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Someone can see a conversation if they are a member of it.
create policy "Users see conversations they are part of"
  on public.conversations for select to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = public.conversations.id
        and cm.user_id = auth.uid()
    )
  );

-- Conversation row creation happens only via the RPCs below (security definer),
-- so no direct insert/update/delete policies are granted to clients.

-- A user can see membership rows for conversations they belong to
-- (needed to render peer info and updated read markers).
create policy "Users see members of conversations they belong to"
  on public.conversation_members for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.conversation_members me
      where me.conversation_id = public.conversation_members.conversation_id
        and me.user_id = auth.uid()
    )
  );

-- Scripted membership additions (group-chat triggers) run security definer.
create policy "Users can leave conversations they belong to"
  on public.conversation_members for delete to authenticated
  using (user_id = auth.uid());

-- Messages: read + send only if you belong to the conversation.
create policy "Users can read messages in their conversations"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = public.messages.conversation_id
        and cm.user_id = auth.uid()
    )
  );

create policy "Users can send messages in their conversations"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = public.messages.conversation_id
        and cm.user_id = auth.uid()
    )
  );

-- ============================================================
-- 3) RPCs
-- ============================================================

-- Find or create a direct conversation between the caller and `peer`.
-- Returns the conversation id.
create or replace function public.ensure_direct_conversation(peer uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  v_key text;
  v_conv uuid;
begin
  if me is null then
    raise exception 'not_authenticated';
  end if;
  if peer = me then
    raise exception 'cannot_chat_with_yourself';
  end if;

  v_key := public.direct_conversation_key(me, peer);

  select id into v_conv from public.conversations where direct_key = v_key;
  if v_conv is not null then
    -- make sure the caller is a member (they might have been removed)
    insert into public.conversation_members (conversation_id, user_id)
    values (v_conv, me)
    on conflict (conversation_id, user_id) do nothing;
    return v_conv;
  end if;

  insert into public.conversations (kind, direct_key)
  values ('direct', v_key)
  returning id into v_conv;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (v_conv, me),
    (v_conv, peer);

  return v_conv;
end;
$$;

-- Find or create the group chat for a study group.
-- The study group creator is enrolled first; everyone else is enrolled by a
-- trigger when their membership becomes active ('member').
create or replace function public.get_or_create_group_conversation(target_group uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv uuid;
  v_group public.study_groups%rowtype;
  can_enroll boolean := false;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_group from public.study_groups where id = target_group;
  if not found then
    raise exception 'group_not_found';
  end if;

  select id into v_conv from public.conversations where study_group_id = target_group;
  if v_conv is null then
    insert into public.conversations (kind, title, study_group_id)
    values ('group', v_group.title, target_group)
    returning id into v_conv;
  end if;

  -- Only the creator (or an active member) can open / join the group chat.
  if v_group.creator_id = auth.uid() then
    can_enroll := true;
  else
    select exists (
      select 1 from public.study_group_members sgm
      where sgm.study_group_id = target_group
        and sgm.user_id = auth.uid()
        and sgm.status = 'member'
    ) into can_enroll;
  end if;

  if not can_enroll then
    raise exception 'must_be_member';
  end if;

  insert into public.conversation_members (conversation_id, user_id)
  values (v_conv, auth.uid())
  on conflict (conversation_id, user_id) do nothing;

  return v_conv;
end;
$$;

-- Enroll a user into the group chat of the study group they just joined.
-- Called from the study_group_members trigger.
create or replace function public.enroll_group_chat_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv uuid;
begin
  if new.status <> 'member' then
    return new;
  end if;

  select id into v_conv from public.conversations where study_group_id = new.study_group_id;
  if v_conv is not null then
    insert into public.conversation_members (conversation_id, user_id)
    values (v_conv, new.user_id)
    on conflict (conversation_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_member_group_chat_enroll on public.study_group_members;
create trigger on_member_group_chat_enroll
  after insert on public.study_group_members
  for each row execute function public.enroll_group_chat_member();

-- Un-enroll when membership is removed.
create or replace function public.leave_group_chat_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.conversation_members cm
  using public.conversations c
  where c.id = cm.conversation_id
    and c.study_group_id = old.study_group_id
    and cm.user_id = old.user_id;
  return old;
end;
$$;

drop trigger if exists on_member_group_chat_leave on public.study_group_members;
create trigger on_member_group_chat_leave
  after delete on public.study_group_members
  for each row execute function public.leave_group_chat_member();

-- Conversation summary for the chat inbox (both kinds).
create or replace function public.get_my_conversations()
returns table (
  conversation_id uuid,
  kind text,
  title text,
  peer_id uuid,
  peer_name text,
  peer_avatar text,
  peer_branch text,
  study_group_id uuid,
  last_message text,
  last_message_at timestamptz,
  last_sender_id uuid,
  unread_count bigint
)
language sql
security definer
set search_path = public
as $$
  with mine as (
    select cm.conversation_id, cm.last_read_at
    from public.conversation_members cm
    where cm.user_id = auth.uid()
  ),
  last_msg as (
    select distinct on (m.conversation_id)
      m.conversation_id,
      m.body,
      m.created_at,
      m.sender_id
    from public.messages m
    order by m.conversation_id, m.created_at desc
  ),
  unread as (
    select m.conversation_id, count(*)::bigint as unread_count
    from public.messages m
    join mine on mine.conversation_id = m.conversation_id
    where m.sender_id <> auth.uid()
      and m.created_at > mine.last_read_at
    group by m.conversation_id
  )
  select
    c.id,
    c.kind,
    c.title,
    peer.id,
    peer.full_name,
    peer.avatar_url,
    peer.branch,
    c.study_group_id,
    lm.body,
    lm.created_at,
    lm.sender_id,
    coalesce(u.unread_count, 0)
  from public.conversations c
  join mine on mine.conversation_id = c.id
  left join last_msg lm on lm.conversation_id = c.id
  left join unread u on u.conversation_id = c.id
  left join public.conversation_members peer_cm
    on peer_cm.conversation_id = c.id
    and peer_cm.user_id <> auth.uid()
    and c.kind = 'direct'
  left join public.profiles peer on peer.id = peer_cm.user_id
  order by lm.created_at desc nulls last, c.created_at desc;
$$;

-- Total unread chat messages for the nav badge.
create or replace function public.get_chat_unread_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.messages m
  join public.conversation_members cm on cm.conversation_id = m.conversation_id
  where cm.user_id = auth.uid()
    and m.sender_id <> auth.uid()
    and m.created_at > cm.last_read_at;
$$;

-- Mark a conversation as read up to now.
create or replace function public.mark_conversation_read(target uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.conversation_members
  set last_read_at = now()
  where conversation_id = target and user_id = auth.uid();
$$;

revoke all on function public.ensure_direct_conversation(uuid) from public, anon;
revoke all on function public.get_or_create_group_conversation(uuid) from public, anon;
revoke all on function public.get_my_conversations() from public, anon;
revoke all on function public.get_chat_unread_count() from public, anon;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.ensure_direct_conversation(uuid) to authenticated;
grant execute on function public.get_or_create_group_conversation(uuid) to authenticated;
grant execute on function public.get_my_conversations() to authenticated;
grant execute on function public.get_chat_unread_count() to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- ============================================================
-- 4) REALTIME — broadcast new messages to members
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.conversation_members;