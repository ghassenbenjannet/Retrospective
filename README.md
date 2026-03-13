# Retrospective Live

A polished, real-time sprint retrospective web app built with **React + Vite + TypeScript + Tailwind + Supabase**.

## Features

- Email/password auth with role-aware flows (`admin`, `collaborator`)
- Team-scoped workspace model
- Theme-driven template system (Candy Crash, Who Wants to Win Millions, The Voice)
- Live session room with step navigation, timer, participant row, cards and voting view
- Mini-game framework with quiz questions that can impact vote budget
- Action tracking across sessions
- Session history and template editor
- GitHub Pages static deployment compatible (frontend-only)

## Tech stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Realtime, RLS)
- Zustand
- Framer Motion
- React Router

## Project structure

```text
src/
  app/
  components/
  features/
  hooks/
  lib/
  pages/
  styles/
  types/
supabase/
  migrations/
  seeds/
```

## Environment variables

Copy `.env.example` to `.env` and fill values:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_BASE_PATH=/Retrospective/
```

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/20260313194000_init.sql` in SQL editor.
3. Create auth users (admin + collaborators) in Supabase Auth.
4. Replace placeholder UUIDs in `supabase/seeds/demo.sql` and run it.
5. Add environment variables to `.env`.

## GitHub Pages deployment

- Workflow is defined in `.github/workflows/deploy.yml`.
- Add repository secrets:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Push to `main` to deploy.
- `VITE_BASE_PATH` is set automatically to `/${repo}/` in workflow.

## Notes

- No custom backend is required.
- Real-time and persistence are expected to be wired to Supabase channels/tables.
- The included UI is MVP-ready and structured for iterative enhancement.
