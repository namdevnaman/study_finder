-- Study Group Finder — pref-aware notifications + like notifications

-- Notification triggers now honor each recipient's `profiles.notification_prefs`
-- so rows are only created for notification types the user has enabled.

-- 1. member join / join request → group creator (respects join_requests)
create or replace function public.notify_member_join()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, data)
  select
    sg.creator_id,
    case when new.status = 'requested' then 'join_request' else 'member_joined' end,
    case when new.status = 'requested' then 'New join request' else 'Someone joined your group' end,
    p.full_name || case
      when new.status = 'requested' then ' wants to join "' || sg.title || '".'
      else ' joined "' || sg.title || '".'
    end,
    jsonb_build_object('study_group_id', sg.id, 'user_id', new.user_id)
  from public.study_groups sg
  join public.profiles p on p.id = new.user_id
  join public.profiles r on r.id = sg.creator_id
  where sg.id = new.study_group_id
    and sg.creator_id <> new.user_id
    and coalesce((r.notification_prefs->>'join_requests')::boolean, true);
  return new;
end;
$$;

-- 2. membership approved → requester (respects join_requests)
create or replace function public.notify_membership_approved()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  wants_join boolean;
begin
  if old.status = 'requested' and new.status = 'member' then
    select coalesce((p.notification_prefs->>'join_requests')::boolean, true)
    into wants_join from public.profiles p where p.id = new.user_id;
    if wants_join then
      insert into public.notifications (user_id, type, title, body, data)
      values (
        new.user_id,
        'join_approved',
        'Your request was approved',
        'You are now a member of "' || (select title from public.study_groups where id = new.study_group_id) || '".',
        jsonb_build_object('study_group_id', new.study_group_id)
      );
    end if;
  end if;
  return new;
end;
$$;

-- 3. new comment → post author (respects comments)
create or replace function public.notify_new_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  post_author uuid;
  post_title text;
  wants_comments boolean;
begin
  select author_id, title into post_author, post_title
  from public.posts where id = new.post_id;

  if post_author is not null and post_author <> new.author_id then
    select coalesce((p.notification_prefs->>'comments')::boolean, true)
    into wants_comments from public.profiles p where p.id = post_author;

    if wants_comments then
      insert into public.notifications (user_id, type, title, body, data)
      values (
        post_author,
        'new_comment',
        'New comment on "' || post_title || '"',
        (select full_name from public.profiles where id = new.author_id) || ' commented on your post.',
        jsonb_build_object('post_id', new.post_id, 'comment_id', new.id)
      );
    end if;
  end if;
  return new;
end;
$$;

-- 4. new like → post author (respects likes, default off)
create or replace function public.notify_post_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  post_author uuid;
  post_title text;
  wants_likes boolean;
begin
  select author_id, title into post_author, post_title
  from public.posts where id = new.post_id;

  if post_author is not null and post_author <> new.user_id then
    select coalesce((p.notification_prefs->>'likes')::boolean, false)
    into wants_likes from public.profiles p where p.id = post_author;

    if wants_likes then
      insert into public.notifications (user_id, type, title, body, data)
      values (
        post_author,
        'post_like',
        'New like on "' || post_title || '"',
        (select full_name from public.profiles where id = new.user_id) || ' liked your post.',
        jsonb_build_object('post_id', new.post_id)
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger on_post_like
after insert on public.post_likes
for each row execute function public.notify_post_like();