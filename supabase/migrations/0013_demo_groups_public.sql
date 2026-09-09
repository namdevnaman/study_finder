-- Make all seeded demo study groups public so every test account
-- can browse them without joining (demo data only; user-created
-- groups are never touched).
update public.study_groups
   set privacy = 'public'
 where id in (
   'bbbb0000-0000-0000-0000-000000000001',
   'bbbb0000-0000-0000-0000-000000000002',
   'bbbb0000-0000-0000-0000-000000000003',
   'bbbb0000-0000-0000-0000-000000000004',
   'bbbb0000-0000-0000-0000-000000000005',
   'bbbb0000-0000-0000-0000-000000000006'
 );