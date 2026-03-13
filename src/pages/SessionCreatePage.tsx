import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell, SectionContainer } from '@/components/ui';

export function SessionCreatePage() {
  const [title, setTitle] = useState('Sprint 43 Retrospective');
  return <AppShell><main className="mx-auto max-w-2xl p-6"><SectionContainer title="Create live session" subtitle="Pick template and launch"><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg bg-slate-800 px-3 py-2" /><div className="mt-4 flex gap-2"><button className="rounded-lg bg-violet-600 px-4 py-2">Launch session</button><Link to="/session/live/session-demo" className="rounded-lg border border-white/20 px-4 py-2">Open demo room</Link></div></SectionContainer></main></AppShell>;
}
