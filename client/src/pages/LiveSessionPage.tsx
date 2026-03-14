import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useSessionStore } from '@/store/sessionStore';
import { useAuthStore } from '@/store/authStore';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CardItem } from '@/components/live/CardItem';
import { AddCardForm } from '@/components/live/AddCardForm';
import { CardFlipGame } from '@/components/live/CardFlipGame';
import { TimerBar } from '@/components/live/TimerBar';
import { ActionPanel } from '@/components/live/ActionPanel';
import { ActionSelectionPanel } from '@/components/live/ActionSelectionPanel';
import { MoodSection } from '@/components/live/MoodSection';
import {
  ChevronLeft, ChevronRight, Vote, Mail, PenLine,
  CheckSquare, MessageSquare, Smile, Gamepad2, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { Section } from '@/types';

const AVATAR_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#6366f1', '#14b8a6',
];

const SECTION_ICONS: Record<string, React.ReactNode> = {
  mood: <Smile size={14} />,
  positive: <CheckSquare size={14} />,
  negative: <MessageSquare size={14} />,
  brainstorming: <PenLine size={14} />,
  minigame: <Gamepad2 size={14} />,
  vote: <Vote size={14} />,
  action_selection: <Layers size={14} />,
  action_review: <Layers size={14} />,
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function TypingIndicator({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const label = names.length === 1
    ? `${names[0]} écrit...`
    : `${names.slice(0, 2).join(', ')} écrivent...`;
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 italic mb-2">
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
      {label}
    </div>
  );
}

export function LiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { session, cards, remainingVotes, typingUsers, myVotedCardIds, newCardIds } = useSessionStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [cursors, setCursors] = useState<Record<string, { name: string; x: number; y: number; color: string }>>({});
  const [sendingEmail, setSendingEmail] = useState(false);

  useSession(id!);

  useEffect(() => {
    api.get(`/sessions/${id}`).then(r => {
      const store = useSessionStore.getState();
      if (!store.session) store.setSession(r.data);
      const me = r.data.participants?.find((p: any) => p.userId === user?.id);
      if (me) store.setRemainingVotes(me.remainingVotes);
    });
    api.get(`/sessions/${id}/cards`).then(r => useSessionStore.getState().setCards(r.data));
    api.get(`/sessions/${id}/actions`).then(r => useSessionStore.getState().setActions(r.data));
    api.get(`/sessions/${id}/my-votes`).then(r => useSessionStore.getState().setMyVotedCardIds(r.data));
  }, [id]);

  useEffect(() => () => useSessionStore.getState().reset(), []);

  // Cursor tracking
  useEffect(() => {
    const socket = getSocket();
    const participantColors: Record<string, string> = {};
    let colorIdx = 0;
    socket.on('cursor:moved', ({ userId, name, x, y }: { userId: string; name: string; x: number; y: number }) => {
      if (!participantColors[userId]) {
        participantColors[userId] = AVATAR_COLORS[colorIdx % AVATAR_COLORS.length];
        colorIdx++;
      }
      setCursors(prev => ({ ...prev, [userId]: { name, x, y, color: participantColors[userId] } }));
    });
    return () => { socket.off('cursor:moved'); };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const socket = getSocket();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    socket.emit('cursor:move', { sessionId: id, x, y, name: user?.name ?? '' });
  }, [id, user]);

  // Auto-scroll to active section in onepage mode
  useEffect(() => {
    if (!session) return;
    const displayMode = session.templateSnapshot.displayMode ?? 'sections';
    if (displayMode !== 'onepage') return;
    const activeSection = session.templateSnapshot.sections[session.currentSectionIndex];
    if (!activeSection) return;
    const el = sectionRefs.current[activeSection._id];
    if (el && mainRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [session?.currentSectionIndex]);

  if (!session) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );

  const { templateSnapshot } = session;
  const displayMode = templateSnapshot.displayMode ?? 'sections';
  const currentSection = templateSnapshot.sections[session.currentSectionIndex];
  const isAdmin = user?.role === 'admin';
  const socket = getSocket();
  const coverImage = templateSnapshot.theme.coverImage;

  const handleNextStep = () => socket.emit('session:next_step', { sessionId: id });
  const handlePrevStep = () => socket.emit('session:prev_step', { sessionId: id });
  const handleToggleVoting = () => socket.emit('session:toggle_voting', { sessionId: id, open: !session.votingOpen });
  const handleVote = (cardId: string, delta: number) => socket.emit('card:vote', { sessionId: id, cardId, delta });
  const handleGoToStep = (i: number) => socket.emit('session:go_to_step', { sessionId: id, index: i });

  const connectedParticipants = session.participants.filter(p => p.status === 'connected');

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const r = await api.post(`/sessions/${id}/send-email`);
      toast.success(`Emails envoyés à ${r.data.count} participant(s)`);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Erreur d\'envoi des emails');
    } finally {
      setSendingEmail(false);
    }
  };

  // All cards from brainstorming/positive/negative (for vote section)
  const contentSectionTypes = ['positive', 'negative', 'brainstorming'];
  const contentSectionIds = templateSnapshot.sections
    .filter(s => contentSectionTypes.includes(s.type))
    .map(s => s._id);
  const allContentCards = cards.filter(c => contentSectionIds.includes(c.sectionId));

  const getSectionTypingNames = (sectionId: string) =>
    Object.values(typingUsers[sectionId] ?? {}).filter(Boolean);

  const renderSectionContent = (section: Section) => {
    const sectionCards = cards.filter(c => c.sectionId === section._id);
    const typingNames = getSectionTypingNames(section._id);

    if (section.type === 'action_selection') {
      return <ActionSelectionPanel sessionId={id!} isAdmin={isAdmin} />;
    }
    if (section.type === 'action_review') {
      return <ActionPanel sessionId={id!} isAdmin={isAdmin} />;
    }
    if (section.type === 'mood') {
      return (
        <MoodSection
          sessionId={id!}
          sectionId={section._id}
          options={section.options ?? []}
          existingCards={sectionCards}
          isActive={session.status === 'active'}
        />
      );
    }
    if (section.type === 'minigame') {
      return (
        <CardFlipGame
          sessionId={id!}
          sectionId={section._id}
          options={section.options ?? []}
          isAdmin={isAdmin}
          currentUserId={user?.id ?? ''}
        />
      );
    }
    if (section.type === 'vote') {
      const votableCards = [...allContentCards].sort((a, b) => b.voteCount - a.voteCount);
      return (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Vous avez <strong>{remainingVotes}</strong> vote(s) restant(s). Votez pour les actions les plus importantes.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {votableCards.map(card => (
              <CardItem
                key={card._id}
                card={card}
                canVote={session.votingOpen && remainingVotes > 0}
                hasVoted={myVotedCardIds.has(card._id)}
                isNew={newCardIds.has(card._id)}
                isAdmin={isAdmin}
                userId={user?.id ?? ''}
                onVote={delta => handleVote(card._id, delta)}
                sessionId={id!}
              />
            ))}
            {votableCards.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                Aucune carte disponible pour voter.
              </div>
            )}
          </div>
        </div>
      );
    }
    // Default: positive / negative / brainstorming
    return (
      <>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-3">
          {[...sectionCards].sort((a, b) => b.voteCount - a.voteCount).map(card => (
            <CardItem
              key={card._id}
              card={card}
              canVote={session.votingOpen && remainingVotes > 0}
              hasVoted={myVotedCardIds.has(card._id)}
              isAdmin={isAdmin}
              userId={user?.id ?? ''}
              onVote={delta => handleVote(card._id, delta)}
              sessionId={id!}
            />
          ))}
          {sectionCards.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-400">
              Aucune carte. Soyez le premier à contribuer !
            </div>
          )}
        </div>
        <TypingIndicator names={typingNames} />
        {session.status === 'active' && (
          <AddCardForm sessionId={id!} sectionId={section._id} />
        )}
      </>
    );
  };

  const renderSectionHeader = (section: Section) => (
    section.imageUrl ? (
      <div className="mb-5 rounded-2xl overflow-hidden h-36 relative">
        <img src={section.imageUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <h2 className="text-xl font-bold drop-shadow">{section.title}</h2>
          {section.description && <p className="text-white/80 text-sm mt-0.5">{section.description}</p>}
        </div>
      </div>
    ) : (
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
        {section.description && <p className="text-gray-500 text-sm mt-1">{section.description}</p>}
      </div>
    )
  );

  /* ===================== RENDER ===================== */
  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-gray-50 relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Remote cursors */}
      {Object.entries(cursors).map(([uid, cursor]) => (
        <div
          key={uid}
          className="fixed pointer-events-none z-50 transition-all duration-75"
          style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
        >
          <svg width="14" height="18" viewBox="0 0 14 18">
            <path d="M0 0L0 14L3.5 10.5L6 17L8 16L5.5 9.5L10 9.5L0 0Z"
              fill={cursor.color} stroke="white" strokeWidth="1.2" />
          </svg>
          <span
            className="absolute left-4 top-0 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium shadow"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </span>
        </div>
      ))}

      {/* ===== TOP HEADER ===== */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        {coverImage && (
          <div className="h-20 w-full overflow-hidden relative">
            <img src={coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/35" />
            <h1 className="absolute inset-0 flex items-center px-6 text-white text-lg font-bold drop-shadow">
              {session.name}
            </h1>
          </div>
        )}
        <div className="px-4 py-2.5 flex items-center gap-3">
          {/* Session name */}
          {!coverImage && (
            <h1 className="font-bold text-gray-900 text-base truncate flex-1 min-w-0">{session.name}</h1>
          )}

          {/* Current section badge */}
          <Badge label={currentSection?.title ?? ''} color="indigo" />
          {session.votingOpen && <Badge label="Vote ouvert" color="green" />}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Votes remaining */}
          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1 flex-shrink-0">
            <Vote size={13} />{remainingVotes}
          </span>

          {/* Participant circles */}
          <div className="flex -space-x-2 flex-shrink-0">
            {connectedParticipants.slice(0, 7).map((p, i) => (
              <div
                key={p.userId}
                title={p.name}
                className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {getInitials(p.name)}
              </div>
            ))}
            {connectedParticipants.length > 7 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold">
                +{connectedParticipants.length - 7}
              </div>
            )}
          </div>
          {connectedParticipants.length > 0 && (
            <span className="text-xs text-gray-400 flex-shrink-0">{connectedParticipants.length} en ligne</span>
          )}

          {/* Admin controls */}
          {isAdmin && (
            <>
              <Button size="sm" variant="secondary" onClick={handleToggleVoting}>
                {session.votingOpen ? 'Clôturer vote' : 'Ouvrir vote'}
              </Button>
              {session.status === 'finished' && (
                <Button size="sm" variant="secondary" onClick={handleSendEmail} loading={sendingEmail}>
                  <Mail size={13} className="mr-1" />Récap mail
                </Button>
              )}
              {displayMode === 'sections' && (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={handlePrevStep}
                    disabled={session.currentSectionIndex === 0}>
                    <ChevronLeft size={15} />
                  </Button>
                  <span className="text-xs text-gray-500 w-10 text-center">
                    {session.currentSectionIndex + 1}/{templateSnapshot.sections.length}
                  </span>
                  <Button size="sm" variant="ghost" onClick={handleNextStep}
                    disabled={session.currentSectionIndex >= templateSnapshot.sections.length - 1}>
                    <ChevronRight size={15} />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {session.timerEndsAt && <TimerBar endsAt={session.timerEndsAt} />}

      {/* ===== BODY ===== */}
      {displayMode === 'onepage' ? (
        /* ONE PAGE MODE: sidebar + scrollable sections */
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - section nav (all users see it) */}
          <aside className="w-52 flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase px-4 mb-2 tracking-wide">Sections</p>
            {templateSnapshot.sections.map((s, i) => {
              const sectionTypingNames = getSectionTypingNames(s._id);
              const isActive = i === session.currentSectionIndex;
              return (
                <button
                  key={s._id}
                  onClick={() => isAdmin ? handleGoToStep(i) : sectionRefs.current[s._id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors relative',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <span className={clsx('flex-shrink-0', isActive ? 'text-indigo-600' : 'text-gray-400')}>
                    {SECTION_ICONS[s.type] ?? <Layers size={14} />}
                  </span>
                  <span className="truncate">{s.title}</span>
                  {sectionTypingNames.length > 0 && (
                    <span className="ml-auto flex-shrink-0 flex gap-0.5">
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Scrollable content */}
          <div ref={mainRef} className="flex-1 overflow-y-auto p-6 space-y-8">
            {templateSnapshot.sections.map((section, idx) => (
              <div
                key={section._id}
                ref={el => { sectionRefs.current[section._id] = el; }}
                className={clsx(
                  'bg-white rounded-2xl border p-6 shadow-sm transition-all scroll-mt-4',
                  idx === session.currentSectionIndex
                    ? 'border-indigo-400 ring-2 ring-indigo-50 shadow-indigo-100'
                    : 'border-gray-200'
                )}
              >
                {renderSectionHeader(section)}
                {renderSectionContent(section)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* SECTIONS MODE: one section at a time, synced for everyone */
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {currentSection ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                {renderSectionHeader(currentSection)}
                {renderSectionContent(currentSection)}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
