-- Study Group Finder — add college_name to profiles

alter table public.profiles
  add column if not exists college_name text;

-- Safe to re-run. Existing profiles keep a NULL college_name until edited.