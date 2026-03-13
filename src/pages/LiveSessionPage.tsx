import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell, EmptyState, ParticipantAvatarRow, SectionContainer, SessionHeader, StickyCard } from '@/components/ui';
import { useAppStore } from '@/app/store';
import { getTheme } from '@/lib/themes';

export function LiveSessionPage() {
  const { sessionId } = useParams();
  const session = useAppStore((s) => s.sessions.find((item) => item.id === sessionId) ?? s.sessions[0]);
  const addCard = useAppStore((s) => s.addCard);
  const cards = useAppStore((s) => s.cards.filter((c) => c.sessionId === session.id));
  const [draft, setDraft] = useState('');
  const theme = getTheme(session.themeId);
  const sortedCards = useMemo(() => [...cards].sort((a, b) => b.votes - a.votes), [cards]);

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl p-6">
        <SessionHeader title={session.title} theme={theme.name} step={`Step ${session.activeStep}`} />
        <div className="mb-4 flex items-center justify-between"><ParticipantAvatarRow participants={[{ id: 'u1', email: '', name: 'AL', role: 'collaborator', teamId: 't1' }, { id: 'u2', email: '', name: 'MN', role: 'collaborator', teamId: 't1' }]} /><span className="text-xs text-slate-400">Realtime room connected</span></div>
        <div className="grid gap-4 md:grid-cols-2">
          <SectionContainer title={theme.sections[1]?.title ?? 'Board'} subtitle="Drop notes quickly">
            <div className="flex gap-2"><input value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 rounded-lg bg-slate-800 px-3 py-2" placeholder="Add idea" /><button onClick={() => { if (!draft) return; addCard({ id: crypto.randomUUID(), sessionId: session.id, stepId: 's1', authorId: 'u1', content: draft, color: 'yellow', votes: 0 }); setDraft(''); }} className="rounded-lg bg-violet-600 px-3">Add</button></div>
            <div className="mt-4 grid gap-3">{cards.length ? cards.map((card) => <StickyCard key={card.id} text={card.content} votes={card.votes} />) : <EmptyState title="No cards yet" hint="Invite people to add ideas in real time" />}</div>
          </SectionContainer>
          <SectionContainer title="Voting result" subtitle="Live sorted cards">
            <div className="space-y-2">{sortedCards.map((card) => <div className="rounded-lg bg-slate-800 p-3 text-sm" key={card.id}>{card.content} · {card.votes} votes</div>)}</div>
          </SectionContainer>
        </div>
      </main>
    </AppShell>
  );
}
