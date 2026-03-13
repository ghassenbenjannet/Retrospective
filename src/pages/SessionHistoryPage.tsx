import { AppShell, SectionContainer } from '@/components/ui';
import { useAppStore } from '@/app/store';

export function SessionHistoryPage() {
  const sessions = useAppStore((s) => s.sessions);
  return <AppShell><main className="mx-auto max-w-4xl p-6"><SectionContainer title="Session history" subtitle="Review previous retros and action health"><div className="space-y-2">{sessions.map((session) => <div className="rounded-lg bg-slate-800 p-3" key={session.id}>{session.title} · {session.status}</div>)}</div></SectionContainer></main></AppShell>;
}
