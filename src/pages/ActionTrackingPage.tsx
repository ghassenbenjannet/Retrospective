import { AppShell, ActionStatusBadge, SectionContainer } from '@/components/ui';
import { useAppStore } from '@/app/store';

export function ActionTrackingPage() {
  const actions = useAppStore((s) => s.actions);
  return <AppShell><main className="mx-auto max-w-5xl p-6"><SectionContainer title="Action tracker" subtitle="Persisted improvements across retrospectives">{actions.length ? <div className="space-y-2">{actions.map((a) => <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-800 p-3"><div><p>{a.text}</p><p className="text-xs text-slate-400">Due {a.dueDate}</p></div><ActionStatusBadge status={a.status} /></div>)}</div> : <p className="text-sm text-slate-400">No action item yet.</p>}</SectionContainer></main></AppShell>;
}
