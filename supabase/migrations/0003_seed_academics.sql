-- Study Group Finder — seed reference data (single college campus)
-- Departments → Subjects → Topics

-- DEPARTMENTS
insert into public.departments (id, name, short_name) values
  ('00000000-0000-0000-0000-000000000001', 'Computer Science and Engineering', 'CSE'),
  ('00000000-0000-0000-0000-000000000002', 'Electronics and Communication Engineering', 'ECE'),
  ('00000000-0000-0000-0000-000000000003', 'Mechanical Engineering', 'ME'),
  ('00000000-0000-0000-0000-000000000004', 'Civil Engineering', 'CE'),
  ('00000000-0000-0000-0000-000000000005', 'Electrical Engineering', 'EE')
on conflict (name) do nothing;

-- SUBJECTS (CSE)
insert into public.subjects (id, department_id, name, code) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Database Management Systems', 'CSE-305'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Operating Systems', 'CSE-306'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Computer Networks', 'CSE-307'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Software Engineering', 'CSE-308'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Data Structures and Algorithms', 'CSE-201'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Discrete Mathematics', 'CSE-202')
on conflict (department_id, name) do nothing;

-- SUBJECTS (ECE)
insert into public.subjects (id, department_id, name, code) values
  ('10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', 'Digital Electronics', 'ECE-305'),
  ('10000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000002', 'Signals and Systems', 'ECE-306'),
  ('10000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000002', 'Microprocessors', 'ECE-307')
on conflict (department_id, name) do nothing;

-- SUBJECTS (ME)
insert into public.subjects (id, department_id, name, code) values
  ('10000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000003', 'Fluid Mechanics', 'ME-305'),
  ('10000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000003', 'Heat Transfer', 'ME-306'),
  ('10000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000003', 'Machine Design', 'ME-307')
on conflict (department_id, name) do nothing;

-- SUBJECTS (CE)
insert into public.subjects (id, department_id, name, code) values
  ('10000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000004', 'Structural Analysis', 'CE-305'),
  ('10000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000004', 'Geotechnical Engineering', 'CE-306'),
  ('10000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000004', 'Transportation Engineering', 'CE-307')
on conflict (department_id, name) do nothing;

-- SUBJECTS (EE)
insert into public.subjects (id, department_id, name, code) values
  ('10000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000005', 'Power Systems', 'EE-305'),
  ('10000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000005', 'Control Systems', 'EE-306'),
  ('10000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000005', 'Electrical Machines', 'EE-307')
on conflict (department_id, name) do nothing;

-- TOPICS (DBMS)
insert into public.topics (id, subject_id, name) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Normalization'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'SQL Queries'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'ER Diagrams'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Transactions and Concurrency'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Indexing')
on conflict (subject_id, name) do nothing;

-- TOPICS (OS)
insert into public.topics (id, subject_id, name) values
  ('20000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000002', 'Process Scheduling'),
  ('20000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000002', 'Memory Management'),
  ('20000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000002', 'Deadlocks'),
  ('20000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000002', 'File Systems')
on conflict (subject_id, name) do nothing;

-- TOPICS (Networks)
insert into public.topics (id, subject_id, name) values
  ('20000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000003', 'TCP/IP'),
  ('20000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000003', 'Routing Protocols'),
  ('20000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000003', 'OSI Model'),
  ('20000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000003', 'Network Security')
on conflict (subject_id, name) do nothing;

-- TOPICS (DSA)
insert into public.topics (id, subject_id, name) values
  ('20000000-0000-0000-0000-000000000301', '10000000-0000-0000-0000-000000000005', 'Sorting Algorithms'),
  ('20000000-0000-0000-0000-000000000302', '10000000-0000-0000-0000-000000000005', 'Graphs'),
  ('20000000-0000-0000-0000-000000000303', '10000000-0000-0000-0000-000000000005', 'Dynamic Programming'),
  ('20000000-0000-0000-0000-000000000304', '10000000-0000-0000-0000-000000000005', 'Trees and Heaps')
on conflict (subject_id, name) do nothing;

-- TOPICS (Software Engineering)
insert into public.topics (id, subject_id, name) values
  ('20000000-0000-0000-0000-000000000401', '10000000-0000-0000-0000-000000000004', 'SDLC Models'),
  ('20000000-0000-0000-0000-000000000402', '10000000-0000-0000-0000-000000000004', 'Requirements Engineering'),
  ('20000000-0000-0000-0000-000000000403', '10000000-0000-0000-0000-000000000004', 'Design Patterns'),
  ('20000000-0000-0000-0000-000000000404', '10000000-0000-0000-0000-000000000004', 'Testing')
on conflict (subject_id, name) do nothing;