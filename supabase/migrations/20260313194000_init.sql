-- Core schema for Retrospective Live
create extension if not exists "uuid-ossp";

create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  role text not null check (role in ('admin', 'collaborator')),
  full_name text not null,
  created_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  theme text not null,
  vote_budget int not null default 5,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.template_sections (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references public.templates(id) on delete cascade,
  position int not null,
  section_type text not null,
  title text not null,
  subtitle text,
  unique (template_id, position)
);

create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade,
  template_id uuid not null references public.templates(id),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'live', 'completed')),
  active_step int not null default 1,
  overview_enabled boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.session_participants (
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table public.cards (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  section_id uuid references public.template_sections(id),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  x_pos numeric default 0,
  y_pos numeric default 0,
  group_key text,
  created_at timestamptz not null default now()
);

create table public.votes (
  id uuid primary key default uuid_generate_v4(),
  card_id uuid not null references public.cards(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  value int not null default 1,
  created_at timestamptz not null default now()
);

create table public.mini_game_questions (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references public.templates(id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  correct_index int not null
);

create table public.mini_game_answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references public.mini_game_questions(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  selected_index int not null,
  score_delta int not null
);

create table public.action_items (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade,
  source_card_id uuid references public.cards(id),
  source_session_id uuid references public.sessions(id),
  owner_id uuid references public.profiles(id),
  title text not null,
  due_date date,
  status text not null default 'todo' check (status in ('todo', 'in-progress', 'done')),
  created_at timestamptz not null default now()
);

alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.template_sections enable row level security;
alter table public.sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.cards enable row level security;
alter table public.votes enable row level security;
alter table public.mini_game_questions enable row level security;
alter table public.mini_game_answers enable row level security;
alter table public.action_items enable row level security;

create policy "members can read their team" on public.teams for select using (
  id in (select team_id from public.profiles where id = auth.uid())
);

create policy "team profiles visible by team members" on public.profiles for select using (
  team_id in (select team_id from public.profiles where id = auth.uid())
);

create policy "admins manage profiles" on public.profiles for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.team_id = team_id and p.role = 'admin')
);

create policy "team scoped select templates" on public.templates for select using (
  team_id in (select team_id from public.profiles where id = auth.uid())
);
create policy "admins manage templates" on public.templates for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.team_id = team_id and p.role = 'admin')
);

create policy "template sections readable by team" on public.template_sections for select using (
  template_id in (select id from public.templates where team_id in (select team_id from public.profiles where id = auth.uid()))
);
create policy "admins manage sections" on public.template_sections for all using (
  template_id in (select t.id from public.templates t join public.profiles p on p.team_id = t.team_id where p.id = auth.uid() and p.role = 'admin')
);

create policy "team scoped sessions" on public.sessions for select using (
  team_id in (select team_id from public.profiles where id = auth.uid())
);
create policy "admins manage sessions" on public.sessions for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.team_id = team_id and p.role = 'admin')
);

create policy "session participants same team" on public.session_participants for all using (
  session_id in (select id from public.sessions where team_id in (select team_id from public.profiles where id = auth.uid()))
);

create policy "cards visible for session members" on public.cards for select using (
  session_id in (select id from public.sessions where team_id in (select team_id from public.profiles where id = auth.uid()))
);
create policy "team members can add cards" on public.cards for insert with check (
  session_id in (select id from public.sessions where team_id in (select team_id from public.profiles where id = auth.uid()))
  and author_id = auth.uid()
);
create policy "authors edit own cards" on public.cards for update using (author_id = auth.uid());
create policy "authors delete own cards" on public.cards for delete using (author_id = auth.uid());

create policy "team scoped votes" on public.votes for all using (
  card_id in (select c.id from public.cards c join public.sessions s on s.id = c.session_id where s.team_id in (select team_id from public.profiles where id = auth.uid()))
);

create policy "team scoped mini game questions" on public.mini_game_questions for select using (
  template_id in (select id from public.templates where team_id in (select team_id from public.profiles where id = auth.uid()))
);
create policy "admins manage mini game questions" on public.mini_game_questions for all using (
  template_id in (select t.id from public.templates t join public.profiles p on p.team_id = t.team_id where p.id = auth.uid() and p.role = 'admin')
);

create policy "team scoped mini game answers" on public.mini_game_answers for all using (
  session_id in (select id from public.sessions where team_id in (select team_id from public.profiles where id = auth.uid()))
);

create policy "team scoped action items" on public.action_items for select using (
  team_id in (select team_id from public.profiles where id = auth.uid())
);
create policy "admins manage action items" on public.action_items for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.team_id = team_id and p.role = 'admin')
);
