-- Demo seed data for local development in Supabase SQL editor
insert into public.teams (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Demo Team')
on conflict do nothing;

-- Create auth users in Supabase dashboard first, then map their UUIDs here.
-- Example UUID placeholders:
insert into public.profiles (id, team_id, role, full_name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin', 'Demo Admin'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'collaborator', 'Lina Dev'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'collaborator', 'Marc QA')
on conflict do nothing;

insert into public.templates (id, team_id, title, theme, vote_budget, created_by)
values
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Candy Crash Retro', 'candy-crash', 5, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('10000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Millions Retro', 'millions', 5, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('10000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'The Voice Retro', 'the-voice', 5, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
on conflict do nothing;

insert into public.sessions (id, team_id, template_id, title, status, active_step, created_by)
values ('20000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', 'Sprint 42 Demo', 'live', 3, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
on conflict do nothing;

insert into public.action_items (id, team_id, source_session_id, owner_id, title, due_date, status)
values
  ('30000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '20000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Reduce flaky e2e tests by 50%', current_date + 10, 'in-progress'),
  ('30000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '20000000-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Document release checklist', current_date + 5, 'todo')
on conflict do nothing;
