-- Fix message sending and profile provisioning.

-- 1) messages.sender_id is NOT NULL with no default, and the client inserts
--    only conversation_id + body. Populate sender_id from the JWT when not
--    supplied so message inserts from the app succeed under RLS.

create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  NEW.sender_id := coalesce(NEW.sender_id, auth.uid());
  if NEW.sender_id is null then
    raise exception 'not_authenticated';
  end if;
  return NEW;
end;
$$;

drop trigger if exists messages_set_sender on public.messages;
create trigger messages_set_sender
before insert on public.messages
for each row execute function public.handle_new_message();

-- 2) A profile row is required for display, chat search, and avatar uploads,
--    but signups never created one. Create it automatically on signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3) Backfill profiles for accounts that signed up before the trigger existed.
insert into public.profiles (id, email)
select id, email
from auth.users
where not exists (select 1 from public.profiles p where p.id = auth.users.id);