-- Create study groups through a SECURITY DEFINER RPC.
-- Rationale: the direct PostgREST INSERT into study_groups fails with
-- "new row violates row-level security policy" (42501) on the transaction
-- pooler even though the row satisfies the insert with-check
-- (creator_id = auth.uid()). Routing creation through a security-definer
-- function (same pattern as join_study_group) makes creation robust in
-- every connection mode. creator_id always comes from auth.uid(), so
-- users can only ever create groups for themselves.

create or replace function public.create_study_group(
  p_title text,
  p_description text default null,
  p_subject_id uuid default null,
  p_topic_id uuid default null,
  p_session_date date default null,
  p_start_time time default null,
  p_end_time time default null,
  p_max_participants int default null,
  p_meet_link text default null,
  p_privacy public.study_group_privacy default 'public'
)
returns public.study_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.study_groups%rowtype;
begin
  if p_title is null or length(btrim(p_title)) = 0 then
    raise exception 'Give your group a title.'
      using errcode = '22023';
  end if;

  if p_max_participants is not null and (p_max_participants < 1 or p_max_participants > 100) then
    raise exception 'Max participants must be between 1 and 100.'
      using errcode = '22023';
  end if;

  if p_session_date is not null and p_start_time is not null and p_end_time is not null
     and p_end_time <= p_start_time then
    raise exception 'End time must be after start time.'
      using errcode = '22023';
  end if;

  insert into public.study_groups (
    creator_id, title, description, subject_id, topic_id,
    session_date, start_time, end_time, max_participants, meet_link, privacy
  )
  values (
    auth.uid(),
    btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''),
    p_subject_id,
    p_topic_id,
    p_session_date,
    p_start_time,
    p_end_time,
    p_max_participants,
    nullif(btrim(coalesce(p_meet_link, '')), ''),
    p_privacy
  )
  returning * into v_group;

  return v_group;
end;
$$;

revoke all on function public.create_study_group(
  text, text, uuid, uuid, date, time, time, int, text, public.study_group_privacy
) from public;
grant execute on function public.create_study_group(
  text, text, uuid, uuid, date, time, time, int, text, public.study_group_privacy
) to authenticated;