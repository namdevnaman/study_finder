-- Study Group Finder — demo data (optional, for testing/peering)
-- Creates a handful of active study groups / posts / resources and chat
-- messages so the product is easy to demo. All content is seed-only.
-- Runs safely: idempotent via fixed UUIDs + ON CONFLICT.
-- Run AFTER 0009 (chat) has been applied, or drop the chat-related inserts.

-- ============================================================
-- 1) DEMO CLASSMATES (profiles only, no auth.users, so they are
--    "ghost" profiles used to make the feed look alive).
-- ============================================================

-- Ghost profiles have no matching auth.users row, which the
-- profiles_id_fkey constraint normally forbids. Replica role skips
-- FK enforcement (system triggers), so the seed can insert them.
set session_replication_role = replica;

insert into public.profiles (id, full_name, email, branch, year, semester, college_name, subjects_of_interest) values
  ('aaaa0000-0000-0000-0000-000000000001', 'Alex Patel',    'alex.patel@sati.ac.in',    'Computer Science and Engineering', 3, 5, 'SATI Vidisha', ARRAY['Operating Systems','Compiler Design']),
  ('aaaa0000-0000-0000-0000-000000000002', 'Priya Singh',   'priya.singh@sati.ac.in',   'Computer Science and Engineering', 3, 5, 'SATI Vidisha', ARRAY['Database Management Systems','Computer Networks']),
  ('aaaa0000-0000-0000-0000-000000000003', 'Rohan Verma',   'rohan.verma@sati.ac.in',   'Computer Science and Engineering', 3, 5, 'SATI Vidisha', ARRAY['Artificial Intelligence']),
  ('aaaa0000-0000-0000-0000-000000000004', 'Sara Khan',     'sara.khan@sati.ac.in',     'Computer Science and Engineering', 2, 4, 'SATI Vidisha', ARRAY['Data Structures and Algorithms']),
  ('aaaa0000-0000-0000-0000-000000000005', 'Kabir Malhotra','kabir.malhotra@sati.ac.in','Electronics and Communication Engineering', 3, 5, 'SATI Vidisha', ARRAY['Computer Networks'])
on conflict (id) do update set full_name = excluded.full_name, branch = excluded.branch, year = excluded.year, semester = excluded.semester, college_name = excluded.college_name, subjects_of_interest = excluded.subjects_of_interest;

-- ============================================================
-- 2) SAMPLE STUDY GROUPS (all made by namannamdev1@gmail.com)
--    Two of each privacy kind.
-- ============================================================
insert into public.study_groups (id, creator_id, subject_id, topic_id, title, description, session_date, start_time, end_time, max_participants, meet_link, privacy) values
  ('bbbb0000-0000-0000-0000-000000000001',
   (select id from public.profiles where email = 'namannamdev1@gmail.com'),
   (select id from public.subjects where name = 'Database Management Systems'),
   (select id from public.topics where name = 'Normalization'),
   'DBMS Normalization Bootcamp: 2NF to BCNF',
   'Walk through the classic normalization problems, one whiteboard question at a time. Bring your course notes.',
   now()::date + 2, '17:00', '18:30', 8, 'https://meet.google.com/abc-defg-hij', 'public'),

  ('bbbb0000-0000-0000-0000-000000000002',
   (select id from public.profiles where email = 'namannamdev1@gmail.com'),
   (select id from public.subjects where name = 'Operating Systems'),
   (select id from public.topics where name = 'Process Scheduling'),
   'Operating Systems Revision Sprint',
   'Fast-paced revision of scheduling algorithms, deadlocks and memory management before midsems.',
   now()::date + 1, '11:00', '12:30', 10, 'https://meet.google.com/xyz-uvw-abc', 'public'),

  ('bbbb0000-0000-0000-0000-000000000003',
   (select id from public.profiles where email = 'namannamdev1@gmail.com'),
   (select id from public.subjects where name = 'Computer Networks'),
   (select id from public.topics where name = 'TCP/IP'),
   'TCP/IP Deep Dive Session',
   'Small group, hands-on: wireshark traces, 3-way handshake, congestion control. Approval required so we keep it focused.',
   now()::date + 3, '16:00', '17:30', 6, 'https://meet.google.com/onetwothree', 'approval_required'),

  ('bbbb0000-0000-0000-0000-000000000004',
   (select id from public.profiles where email = 'namannamdev1@gmail.com'),
   (select id from public.subjects where name = 'Data Structures and Algorithms'),
   (select id from public.topics where name = 'Graphs'),
   'DSA Problem-Solving Circle: Graphs',
   'Weekly problem-solving meetup. We warm up with easy LeetCode-style graph problems and ramp up together.',
   now()::date + 4, '18:00', '19:30', 8, 'https://meet.google.com/graphs-now', 'approval_required'),

  ('bbbb0000-0000-0000-0000-000000000005',
   (select id from public.profiles where email = 'namannamdev1@gmail.com'),
   (select id from public.subjects where name = 'Compiler Design'),
   (select id from public.topics where name = 'Parsing'),
   'Compiler Design Study Cell',
   'Private study cell for the compiler batch: LL(1), LR(1), and a peek at a tiny toy compiler.',
   now()::date + 5, '09:00', '10:30', 5, null, 'private'),

  ('bbbb0000-0000-0000-0000-000000000006',
   (select id from public.profiles where email = 'namannamdev1@gmail.com'),
   (select id from public.subjects where name = 'Artificial Intelligence'),
   (select id from public.topics where name = 'Neural Networks'),
   'AI Study Circle — NN Basics',
   'Private circle for people serious about the AI elective. We cover perceptrons, backprop, and tune a tiny model.',
   now()::date + 6, '20:00', '21:30', 6, null, 'private')
on conflict (id) do nothing;

-- ============================================================
-- 3) SAMPLE MEMBERSHIPS (creator joins their own groups)
-- ============================================================
insert into public.study_group_members (id, study_group_id, user_id, status) values
  ('cccc0000-0000-0000-0000-000000000101', 'bbbb0000-0000-0000-0000-000000000001', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'member'),
  ('cccc0000-0000-0000-0000-000000000102', 'bbbb0000-0000-0000-0000-000000000002', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'member'),
  ('cccc0000-0000-0000-0000-000000000103', 'bbbb0000-0000-0000-0000-000000000003', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'member'),
  ('cccc0000-0000-0000-0000-000000000104', 'bbbb0000-0000-0000-0000-000000000004', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'member'),
  -- classmates in the public DBMS bootcamp
  ('cccc0000-0000-0000-0000-000000000105', 'bbbb0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000001', 'member'),
  ('cccc0000-0000-0000-0000-000000000106', 'bbbb0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000002', 'member'),
  -- one pending request so the approval flow has something to show
  ('cccc0000-0000-0000-0000-000000000107', 'bbbb0000-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000003', 'requested')
on conflict (id) do nothing;

-- ============================================================
-- 4) SAMPLE CHAT (group chat for the DBMS bootcamp + 1:1 with Alex)
-- ============================================================
insert into public.conversations (id, kind, title, study_group_id, direct_key, created_at) values
  ('dddd0000-0000-0000-0000-000000000001', 'group',  'DBMS Normalization Bootcamp: 2NF to BCNF', 'bbbb0000-0000-0000-0000-000000000001', null, now() - interval '30 hours'),
  ('dddd0000-0000-0000-0000-000000000002', 'direct', null,
   null,
   public.direct_conversation_key((select id from public.profiles where email = 'namannamdev1@gmail.com'), 'aaaa0000-0000-0000-0000-000000000001'),
   now() - interval '20 hours')
on conflict (id) do nothing;

insert into public.conversation_members (id, conversation_id, user_id, last_read_at, created_at) values
  ('dddd0000-0000-0000-0000-000000000201', 'dddd0000-0000-0000-0000-000000000001', (select id from public.profiles where email = 'namannamdev1@gmail.com'), now() - interval '25 hours', now() - interval '30 hours'),
  ('dddd0000-0000-0000-0000-000000000202', 'dddd0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000001', now(), now() - interval '30 hours'),
  ('dddd0000-0000-0000-0000-000000000203', 'dddd0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000002', now(), now() - interval '30 hours'),
  ('dddd0000-0000-0000-0000-000000000204', 'dddd0000-0000-0000-0000-000000000002', (select id from public.profiles where email = 'namannamdev1@gmail.com'), now() - interval '19 hours', now() - interval '20 hours'),
  ('dddd0000-0000-0000-0000-000000000205', 'dddd0000-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000001', now(), now() - interval '20 hours')
on conflict (id) do nothing;

insert into public.messages (id, conversation_id, sender_id, body, created_at) values
  ('dddd0000-0000-0000-0000-000000000301', 'dddd0000-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000001', 'Hey! Are you free tonight to go over the 3NF example from class?', now() - interval '19 hours'),
  ('dddd0000-0000-0000-0000-000000000302', 'dddd0000-0000-0000-0000-000000000002', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'Sure, 8pm works. I will bring the worksheet.', now() - interval '18 hours'),
  ('dddd0000-0000-0000-0000-000000000303', 'dddd0000-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000001', 'Perfect, thanks!', now() - interval '17 hours'),
  ('dddd0000-0000-0000-0000-000000000304', 'dddd0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000002', 'Hi everyone, does anyone have the normalization cheat-sheet from last weeks class?', now() - interval '9 hours'),
  ('dddd0000-0000-0000-0000-000000000305', 'dddd0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000001', 'I have it, dropping it in resources tonight.', now() - interval '8 hours'),
  ('dddd0000-0000-0000-0000-000000000306', 'dddd0000-0000-0000-0000-000000000001', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'Great, see everyone at the bootcamp tomorrow.', now() - interval '7 hours')
on conflict (id) do nothing;

-- ============================================================
-- 5) SAMPLE POSTS + COMMENTS + LIKES
-- ============================================================
insert into public.posts (id, author_id, type, subject_id, topic_id, title, body, created_at) values
  ('eeee0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000002', 'question',
   (select id from public.subjects where name = 'Database Management Systems'),
   (select id from public.topics where name = 'Normalization'),
   'Is the relation in 3NF if it has a transitive dependency on a non-prime?',
   'We did an example in class where STUDENT(rollno, dept, hod) has dept -> hod. Is that allowed in 3NF? I keep confusing myself.',
   now() - interval '16 hours'),
  ('eeee0000-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000001', 'discussion',
   (select id from public.subjects where name = 'Operating Systems'),
   (select id from public.topics where name = 'Process Scheduling'),
   'Which scheduling algorithm feels most exam-friendly?',
   'Round robin, SJF, or priority? Personally I find RR easiest to compute marks for, but SJF questions are common. What is everyone practicing?',
   now() - interval '14 hours'),
  ('eeee0000-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000003', 'study_partner_request',
   (select id from public.subjects where name = 'Artificial Intelligence'),
   (select id from public.topics where name = 'Neural Networks'),
   'Need a study partner for the AI elective',
   'Looking for someone to grind the neural networks unit with, mostly the backprop math. We can split the exercises.',
   now() - interval '12 hours'),
  ('eeee0000-0000-0000-0000-000000000004', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'discussion',
   (select id from public.subjects where name = 'Computer Networks'),
   (select id from public.topics where name = 'Routing Protocols'),
   'How does OSPF handle a flapping neighbor link?',
   'Curious how the protocol reacts when a router link flaps. Does it trigger a full SPF recomputation every time?',
   now() - interval '10 hours'),
  ('eeee0000-0000-0000-0000-000000000005', 'aaaa0000-0000-0000-0000-000000000004', 'resource',
   (select id from public.subjects where name = 'Data Structures and Algorithms'),
   (select id from public.topics where name = 'Graphs'),
   'Drove notes: Topological sort edge cases',
   'Short write-up on why topological sort needs edges removed, not merely visited flags. Includes the classic course-schedule problem.',
   now() - interval '8 hours')
on conflict (id) do nothing;

insert into public.comments (id, post_id, author_id, body, created_at) values
  ('eeee0000-0000-0000-0000-000000000601', 'eeee0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000001', 'No, transitive dependency on a non-prime attribute violates 3NF. You would need to split it.', now() - interval '15 hours'),
  ('eeee0000-0000-0000-0000-000000000602', 'eeee0000-0000-0000-0000-000000000001', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'Right. Split into STUDENT and DEPT so hod is in its own table.', now() - interval '15 hours'),
  ('eeee0000-0000-0000-0000-000000000603', 'eeee0000-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000003', 'SJF is easier to compute but only when arrival times are all 0.', now() - interval '13 hours')
on conflict (id) do nothing;

insert into public.post_likes (id, post_id, user_id, created_at) values
  ('eeee0000-0000-0000-0000-000000000701', 'eeee0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000003', now() - interval '14 hours'),
  ('eeee0000-0000-0000-0000-000000000702', 'eeee0000-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000004', now() - interval '12 hours')
on conflict (id) do nothing;

-- ============================================================
-- 6) SAMPLE RESOURCES
-- ============================================================
insert into public.resources (id, author_id, subject_id, topic_id, title, url, description, kind, created_at) values
  ('ffff0000-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000001',
   (select id from public.subjects where name = 'Database Management Systems'),
   (select id from public.topics where name = 'Normalization'),
   'Normalization cheat-sheet (2NF/3NF/BCNF)',
   'https://docs.google.com/document/d/example-normalization',
   'A one-page sheet with all the definitions and a worked example. Updated this week.',
   'docs', now() - interval '2 days'),
  ('ffff0000-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000002',
   (select id from public.subjects where name = 'Operating Systems'),
   (select id from public.topics where name = 'Process Scheduling'),
   'Scheduling algorithms — solved numericals set 2',
   'https://drive.google.com/file/d/example-scheduling',
   '20 solved RR / SJF / priority problems with Gantt charts.',
   'drive', now() - interval '1 day'),
  ('ffff0000-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000003',
   (select id from public.subjects where name = 'Computer Networks'),
   (select id from public.topics where name = 'TCP/IP'),
   'TCP/IP Illustrated — Ch. 4 exercises',
   'https://github.com/example/tcp-ip-exercises',
   'Community solution notes for the classic book. Great for the wireshark session.',
   'github', now() - interval '3 days'),
  ('ffff0000-0000-0000-0000-000000000004', 'aaaa0000-0000-0000-0000-000000000004',
   (select id from public.subjects where name = 'Data Structures and Algorithms'),
   (select id from public.topics where name = 'Graphs'),
   'Graph algorithms — video walkthrough',
   'https://www.youtube.com/watch?v=example-graphs',
   'A 40-minute walkthrough of BFS, DFS, topological sort with visualisations.',
   'youtube', now() - interval '20 hours'),
  ('ffff0000-0000-0000-0000-000000000005', 'aaaa0000-0000-0000-0000-000000000005',
   (select id from public.subjects where name = 'Compiler Design'),
   (select id from public.topics where name = 'Parsing'),
   'LL(1) vs LR(1) — short PDF primer',
   'https://example.com/parsers.pdf',
   'A concise primer with the parsing table recipe for both approaches.',
   'pdf', now() - interval '5 hours'),
  ('ffff0000-0000-0000-0000-000000000006', (select id from public.profiles where email = 'namannamdev1@gmail.com'),
   (select id from public.subjects where name = 'Artificial Intelligence'),
   (select id from public.topics where name = 'Neural Networks'),
   'Backprop from scratch — notebook',
   'https://github.com/example/backprop-notch',
   'A minimal Python notebook that implements backprop for a 2-layer net.',
   'github', now() - interval '3 hours')
on conflict (id) do nothing;

-- ============================================================
-- 7) A FEW NOTIFICATIONS SO THE INBOX ISN'T EMPTY FOR THE CREATOR
-- ============================================================
insert into public.notifications (id, user_id, type, title, body, data, read, created_at) values
  ('aaaa0000-0000-0000-0000-000000000601', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'join_request', 'New join request', 'Rohan Verma wants to join "TCP/IP Deep Dive Session".', '{"study_group_id":"bbbb0000-0000-0000-0000-000000000003","user_id":"aaaa0000-0000-0000-0000-000000000003"}', false, now() - interval '6 hours'),
  ('aaaa0000-0000-0000-0000-000000000602', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'member_joined', 'Someone joined your group', 'Alex Patel joined "DBMS Normalization Bootcamp: 2NF to BCNF".', '{"study_group_id":"bbbb0000-0000-0000-0000-000000000001","user_id":"aaaa0000-0000-0000-0000-000000000001"}', false, now() - interval '1 day'),
  ('aaaa0000-0000-0000-0000-000000000603', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'new_comment', 'New comment on "Is the relation in 3NF..."', 'Alex Patel commented on your post.', '{"post_id":"eeee0000-0000-0000-0000-000000000001","comment_id":"eeee0000-0000-0000-0000-000000000601"}', true, now() - interval '15 hours'),
  ('aaaa0000-0000-0000-0000-000000000604', (select id from public.profiles where email = 'namannamdev1@gmail.com'), 'session_reminder', 'Session reminder', 'Your study group "Operating Systems Revision Sprint" starts in 2 days.', '{"study_group_id":"bbbb0000-0000-0000-0000-000000000002"}', false, now() - interval '2 hours')
on conflict (id) do nothing;

-- Restore normal FK enforcement / trigger behavior.
reset session_replication_role;
