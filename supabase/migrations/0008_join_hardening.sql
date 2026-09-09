-- Study Group Finder — join-flow hardening (privacy + capacity enforcement)

-- ============================================================
-- 1) TIGHTEN DIRECT MEMBER INSERT
--    Previously any signed-in user could insert themselves as an
--    active 'member' of ANY group (bypassing approval_required
--    gating). Direct inserts are now limited to join *requests*;
--    all member joins go through join_study_group() below.
-- ============================================================
drop policy if exists "Users can request to join or join study groups"
  on public.study_group_members;

create policy "Users can only create join requests"
  on public.study_group_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'requested'
    and exists (
      select 1 from public.study_groups sg
      where sg.id = public.study_group_members.study_group_id
    )
  );

-- ============================================================
-- 2) JOIN VIA SECURITY-DEFINER RPC
--    Returns the resulting status: 'member' | 'requested'.
--    Idempotent — returns the caller's existing status if they
--    already have a membership row.
--    Enforces max_participants for member joins.
-- ============================================================
create or replace function public.join_study_group(target_group uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.study_groups%rowtype;
  v_member_count int;
  v_status public.study_group_member_status;
begin
  select * into v_group
    from public.study_groups
   where id = target_group;

  if not found then
    raise exception 'group_not_found';
  end if;

  select status into v_status
    from public.study_group_members
   where study_group_id = target_group and user_id = auth.uid();

  if found then
    return v_status::text;
  end if;

  if v_group.privacy = 'approval_required' then
    insert into public.study_group_members (study_group_id, user_id, status)
    values (target_group, auth.uid(), 'requested');
    return 'requested';
  end if;

  if v_group.max_participants is not null then
    select count(*) into v_member_count
      from public.study_group_members
     where study_group_id = target_group and status = 'member';

    if v_member_count >= v_group.max_participants then
      raise exception 'This study group is at full capacity.'
        using errcode = '22023';
    end if;
  end if;

  insert into public.study_group_members (study_group_id, user_id, status)
  values (target_group, auth.uid(), 'member');

  return 'member';
end;
$$;

revoke all on function public.join_study_group(uuid) from public, anon;
grant execute on function public.join_study_group(uuid) to authenticated;

-- ============================================================
-- 3) CAPACITY TRIGGER — protects the approve path too
--    Creator approving a request can still push a group over its
--    max_participants, so enforce the limit on ANY insert/status
--    transition into 'member'.
-- ============================================================
create or replace function public.enforce_study_group_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max int;
  v_count int;
begin
  if new.status = 'member' then
    select max_participants into v_max
      from public.study_groups
     where id = new.study_group_id;

    if v_max is not null then
      select count(*) into v_count
        from public.study_group_members
       where study_group_id = new.study_group_id
         and status = 'member';

      if tg_op = 'UPDATE' and old.status = 'member' then
        v_count := v_count - 1;
      end if;

      if v_count >= v_max then
        raise exception 'This study group is at full capacity.'
          using errcode = '22023';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_study_group_capacity on public.study_group_members;
create trigger trg_study_group_capacity
  before insert or update of status on public.study_group_members
  for each row execute function public.enforce_study_group_capacity();