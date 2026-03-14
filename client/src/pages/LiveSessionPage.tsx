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
import { ChevronLeft, ChevronRight, Vote, Mail, LayoutList, Layout } from 'lucide-react';
import toast from 'react-hot-toast';

// Color palette for participant avatars
const AVATAR_COLORS = [
  'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
  'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function LiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { session, cards, remainingVotes } = useSessionStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursors, setCursors] = useState<Record<string, { name: string; x: number; y: number }>>({});
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
  }, [id]);

  useEffect(() => () => useSessionStore.getState().reset(), []);

  // Cursor tracking
  useEffect(() => {
    const socket = getSocket();
    socket.on('cursor:moved', ({ userId, name, x, y }: { userId: string; name: string; x: number; y: number }) => {
      setCursors(prev => ({ ...prev, [userId]: { name, x, y } }));
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

  // Get all "content" cards (from positive/negative/brainstorming sections) for the vote section
  const contentSectionTypes = ['positive', 'negative', 'brainstorming'];
  const contentSectionIds = templateSnapshot.sections
    .filter(s => contentSectionTypes.includes(s.type))
    .map(s => s._id);
  const allContentCards = cards.filter(c => contentSectionIds.includes(c.sectionId));

  const renderSectionContent = (section: typeof currentSection, idx: number) => {
    const sectionCards = cards.filter(c => c.sectionId === section._id);

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
      // Show all cards from content sections
      const votableCards = allContentCards.sort((a, b) => b.voteCount - a.voteCount);
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
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mb-4">
          {sectionCards.sort((a, b) => b.voteCount - a.voteCount).map(card => (
            <CardItem
              key={card._id}
              card={card}
              canVote={session.votingOpen && remainingVotes > 0}
              isAdmin={isAdmin}
              userId={user?.id ?? ''}
              onVote={delta => handleVote(card._id, delta)}
              sessionId={id!}
            />
          ))}
          {sectionCards.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              Aucune carte. Soyez le premier à contribuer !
            </div>
          )}
        </div>
        {session.status === 'active' && (
          <AddCardForm sessionId={id!} sectionId={section._id} />
        )}
      </>
    );
  };

  const renderSectionHeader = (section: typeof currentSection) => (
    <>
      {section.imageUrl ? (
        <div className="mb-5 rounded-2xl overflow-hidden h-40 relative">
          <img src={section.imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4 text-white">
            <h2 className="text-2xl font-bold drop-shadow">{section.title}</h2>
            {section.description && (
              <p className="text-white/80 text-sm mt-0.5">{section.description}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
          {section.description && <p className="text-gray-500 text-sm mt-1">{section.description}</p>}
        </div>
      )}
    </>
  );

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
          className="fixed pointer-events-none z-50 transition-all duration-100"
          style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
        >
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
            <path d="M0 0L0 16L4 12L7 19L9 18L6 11L11 11L0 0Z" fill="#6366f1" stroke="white" strokeWidth="1" />
          </svg>
          <span className="ml-3 -mt-1 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
            {cursor.name}
          </span>
        </div>
      ))}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        {coverImage && (
          <div className="h-24 w-full overflow-hidden relative">
            <img src={coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30" />
            <h1 className="absolute inset-0 flex items-center px-6 text-white text-xl font-bold drop-shadow">
              {session.name}
            </h1>
          </div>
        )}
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {!coverImage && <h1 className="font-bold text-gray-900 text-lg truncate">{session.name}</h1>}
            <Badge label={currentSection?.title ?? ''} color="indigo" />
            {session.votingOpen && <Badge label="Vote ouvert" color="green" />}
          </div>

          {/* Participant circles (Miro-style) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex -space-x-2">
              {connectedParticipants.slice(0, 6).map((p, i) => (
                <div
                  key={p.userId}
                  title={p.name}
                  className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                >
                  {getInitials(p.name)}
                </div>
              ))}
              {connectedParticipants.length > 6 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-xs font-bold">
                  +{connectedParticipants.length - 6}
                </div>
              )}
            </div>
            {connectedParticipants.length > 0 && (
              <span className="text-sm text-gray-500">{connectedParticipants.length} en ligne</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Remaining votes indicator */}
            <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Vote size={14} />{remainingVotes} votes
            </span>

            {isAdmin && (
              <>
                <Button size="sm" variant="secondary" onClick={handleToggleVoting}>
                  {session.votingOpen ? 'Clôturer vote' : 'Ouvrir vote'}
                </Button>

                {/* Display mode toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  title={displayMode === 'sections' ? 'Mode page unique' : 'Mode section par section'}
                  onClick={() => {
                    // Visual toggle only - displayMode comes from template snapshot
                  }}
                >
                  {displayMode === 'sections' ? <Layout size={16} /> : <LayoutList size={16} />}
                </Button>

                {/* Email button (for finished sessions) */}
                {session.status === 'finished' && (
                  <Button size="sm" variant="secondary" onClick={handleSendEmail} loading={sendingEmail}>
                    <Mail size={14} className="mr-1" />Envoyer récap
                  </Button>
                )}

                {displayMode === 'sections' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={handlePrevStep} disabled={session.currentSectionIndex === 0}>
                      <ChevronLeft size={16} />
                    </Button>
                    <span className="text-sm text-gray-500">
                      {session.currentSectionIndex + 1} / {templateSnapshot.sections.length}
                    </span>
                    <Button size="sm" variant="ghost" onClick={handleNextStep}
                      disabled={session.currentSectionIndex >= templateSnapshot.sections.length - 1}>
                      <ChevronRight size={16} />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {session.timerEndsAt && <TimerBar endsAt={session.timerEndsAt} />}

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">
        {displayMode === 'onepage' ? (
          /* One Page Mode: all sections visible at once */
          <div className="max-w-4xl mx-auto space-y-10">
            {isAdmin && (
              <div className="flex gap-2 flex-wrap mb-2">
                {templateSnapshot.sections.map((s, i) => (
                  <button
                    key={s._id}
                    onClick={() => socket.emit('session:go_to_step', { sessionId: id, index: i })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      i === session.currentSectionIndex
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}
            {templateSnapshot.sections.map((section, idx) => (
              <div
                key={section._id}
                id={`section-${section._id}`}
                className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                  idx === session.currentSectionIndex ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'
                }`}
              >
                {renderSectionHeader(section)}
                {renderSectionContent(section, idx)}
              </div>
            ))}
          </div>
        ) : (
          /* Section by section mode */
          <div className="max-w-4xl mx-auto">
            {currentSection ? (
              <>
                {renderSectionHeader(currentSection)}
                {renderSectionContent(currentSection, session.currentSectionIndex)}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
