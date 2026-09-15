-- Signup aborted with "Database error saving new user" / 23502: the
-- on_auth_user_created trigger inserted only (id, email) into profiles,
-- but profiles.full_name is NOT NULL with no default, so every new
-- signup rolled back. Use the display name the client already sends in
-- raw_user_meta_data (data.full_name / data.college_name), falling back
-- to the email local part. Also give the column a sane table default so
-- no future insert path can ever violate it again.

alter table public.profiles alter column full_name set default 'New member';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_college text;
begin
  v_name := nullif(new.raw_user_meta_data ->> 'full_name', '');
  if v_name is null then
    v_name := split_part(new.email, '@', 1);
  end if;

  v_college := nullif(new.raw_user_meta_data ->> 'college_name', '');

  begin
    insert into public.profiles (id, email, full_name, college_name)
    values (new.id, new.email, v_name, v_college)
    on conflict (id) do nothing;
  exception
    when unique_violation then
      update public.profiles
         set full_name = coalesce(profiles.full_name, v_name)
       where profiles.id = new.id;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();