import { PropsWithChildren } from 'react';
import { motion } from 'framer-motion';
import { ActionStatus, User } from '@/types/domain';

export function AppShell({ children }: PropsWithChildren) {
  return <div className="gradient-bg min-h-screen">{children}</div>;
}

export function SectionContainer({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-card">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function SessionHeader({ title, theme, step }: { title: string; theme: string; step: string }) {
  return (
    <header className="sticky top-0 z-20 mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/95 p-4 backdrop-blur">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-slate-400">{theme} · {step}</p>
      </div>
      <Timer seconds={300} />
    </header>
  );
}

export function ParticipantAvatarRow({ participants }: { participants: User[] }) {
  return (
    <div className="flex items-center gap-2">
      {participants.map((p) => (
        <div key={p.id} className="h-9 w-9 rounded-full bg-violet-500/30 text-center text-sm font-semibold leading-9 text-violet-100">
          {p.name.slice(0, 2).toUpperCase()}
        </div>
      ))}
    </div>
  );
}

export function Timer({ seconds }: { seconds: number }) {
  return <div className="rounded-xl bg-white/10 px-3 py-2 text-sm font-medium">⏱ {Math.floor(seconds / 60)}:{`${seconds % 60}`.padStart(2, '0')}</div>;
}

export function StickyCard({ text, votes }: { text: string; votes: number }) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/20 bg-amber-100 p-3 text-slate-900 shadow">
      <p className="text-sm">{text}</p>
      <VotePill count={votes} />
    </motion.article>
  );
}

export function VotePill({ count }: { count: number }) {
  return <span className="mt-2 inline-flex rounded-full bg-indigo-700 px-2 py-0.5 text-xs text-white">{count} votes</span>;
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  const color = status === 'done' ? 'bg-emerald-500/20 text-emerald-300' : status === 'in-progress' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300';
  return <span className={`rounded-full px-2 py-1 text-xs ${color}`}>{status}</span>;
}

export function ThemeBadge({ name }: { name: string }) {
  return <span className="rounded-full border border-violet-300/30 bg-violet-500/20 px-2 py-1 text-xs text-violet-100">{name}</span>;
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return <div className="rounded-xl border border-dashed border-white/30 p-6 text-center text-sm text-slate-300">{title}<p className="mt-1 text-slate-500">{hint}</p></div>;
}

export function ConfirmationModal({ open, title, onConfirm, onCancel }: { open: boolean; title: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-content-center bg-slate-950/70">
      <div className="w-96 rounded-2xl bg-slate-900 p-6">
        <p>{title}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-white/20 px-3 py-1">Cancel</button>
          <button onClick={onConfirm} className="rounded-lg bg-violet-600 px-3 py-1">Confirm</button>
        </div>
      </div>
    </div>
  );
}
