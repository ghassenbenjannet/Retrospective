import { Link } from 'react-router-dom';
import { AppShell, SectionContainer, ThemeBadge } from '@/components/ui';
import { useAppStore } from '@/app/store';

export function DashboardPage() {
  const templates = useAppStore((s) => s.templates);
  const sessions = useAppStore((s) => s.sessions);
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <SectionContainer title="Templates" subtitle="Thematic retrospectives">
            <div className="space-y-2">
              {templates.map((t) => <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-800 p-3"><span>{t.title}</span><ThemeBadge name={t.themeId} /></div>)}
            </div>
            <Link to="/templates" className="mt-3 inline-block text-sm text-violet-300">Open library →</Link>
          </SectionContainer>
          <SectionContainer title="Live Sessions" subtitle="Current room status">
            <div className="space-y-2">
              {sessions.map((s) => <div key={s.id} className="rounded-lg bg-slate-800 p-3">{s.title} · step {s.activeStep}</div>)}
            </div>
            <div className="mt-3 flex gap-2 text-sm text-violet-300"><Link to="/session/create">Create session</Link><Link to="/session/live/session-demo">Join demo</Link></div>
          </SectionContainer>
        </div>
      </main>
    </AppShell>
  );
}
