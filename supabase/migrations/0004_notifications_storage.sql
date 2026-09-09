-- Study Group Finder — automatic notifications + avatar storage + extra RLS
-- Part 1: Notification triggers (security definer so RLS never blocks inserts)

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
  where sg.id = new.study_group_id and sg.creator_id <> new.user_id;
  return new;
end;
$$;

create trigger on_study_group_member_join
after insert on public.study_group_members
for each row execute function public.notify_member_join();

create or replace function public.notify_membership_approved()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.status = 'requested' and new.status = 'member' then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.user_id,
      'join_approved',
      'Your request was approved',
      'You are now a member of "' || (select title from public.study_groups where id = new.study_group_id) || '".',
      jsonb_build_object('study_group_id', new.study_group_id)
    );
  end if;
  return new;
end;
$$;

create trigger on_study_group_member_approved
after update on public.study_group_members
for each row execute function public.notify_membership_approved();

create or replace function public.notify_new_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  post_author uuid;
  post_title text;
begin
  select author_id, title into post_author, post_title
  from public.posts where id = new.post_id;

  if post_author is not null and post_author <> new.author_id then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      post_author,
      'new_comment',
      'New comment on "' || post_title || '"',
      (select full_name from public.profiles where id = new.author_id) || ' commented on your post.',
      jsonb_build_object('post_id', new.post_id, 'comment_id', new.id)
    );
  end if;
  return new;
end;
$$;

create trigger on_new_comment
after insert on public.comments
for each row execute function public.notify_new_comment();

-- Part 2: Profile avatar storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Anyone can view avatars"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Part 3: Extra RLS policies
-- Group creator can update (approve/reject) membership requests
create policy "Group creators can manage membership"
on public.study_group_members for update
to authenticated
using (
  exists (
    select 1 from public.study_groups sg
    where sg.id = public.study_group_members.study_group_id
      and sg.creator_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.study_groups sg
    where sg.id = public.study_group_members.study_group_id
      and sg.creator_id = auth.uid()
  )
);

-- Realtime: broadcast new notifications and comments to the app
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.study_group_members;