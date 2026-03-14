import { useEffect } from 'react';
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
import { MiniGamePanel } from '@/components/live/MiniGamePanel';
import { TimerBar } from '@/components/live/TimerBar';
import { ActionPanel } from '@/components/live/ActionPanel';
import { MoodSection } from '@/components/live/MoodSection';
import { ChevronLeft, ChevronRight, Vote, Users } from 'lucide-react';

export function LiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { session, cards, activeGame, remainingVotes } = useSessionStore();

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

  if (!session) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );

  const { templateSnapshot } = session;
  const currentSection = templateSnapshot.sections[session.currentSectionIndex];
  const sectionCards = cards.filter(c => c.sectionId === currentSection?._id);
  const isAdmin = user?.role === 'admin';
  const socket = getSocket();
  const coverImage = templateSnapshot.theme.coverImage;

  const handleNextStep = () => socket.emit('session:next_step', { sessionId: id });
  const handlePrevStep = () => socket.emit('session:prev_step', { sessionId: id });
  const handleToggleVoting = () => socket.emit('session:toggle_voting', { sessionId: id, open: !session.votingOpen });
  const handleVote = (cardId: string, delta: number) => socket.emit('card:vote', { sessionId: id, cardId, delta });

  const connectedCount = session.participants.filter(p => p.status === 'connected').length;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with optional cover image */}
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
        <div className="px-6 py-3 flex items-center justify-between">
          <div>
            {!coverImage && <h1 className="font-bold text-gray-900 text-lg">{session.name}</h1>}
            <div className="flex items-center gap-3 mt-1">
              <Badge label={currentSection?.title ?? ''} color="indigo" />
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Users size={14} />{connectedCount} connectés
              </span>
              {session.votingOpen && <Badge label="Vote ouvert" color="green" />}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isAdmin && (
              <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Vote size={14} />{remainingVotes} votes
              </span>
            )}
            {isAdmin && (
              <>
                <Button size="sm" variant="secondary" onClick={handleToggleVoting}>
                  {session.votingOpen ? 'Clôturer vote' : 'Ouvrir vote'}
                </Button>
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
          </div>
        </div>
      </header>

      {session.timerEndsAt && <TimerBar endsAt={session.timerEndsAt} />}

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">
        {activeGame && <MiniGamePanel game={activeGame} sessionId={id!} />}

        {currentSection && (
          <div className="max-w-4xl mx-auto">
            {/* Section header image */}
            {currentSection.imageUrl && (
              <div className="mb-5 rounded-2xl overflow-hidden h-40 relative">
                <img src={currentSection.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <h2 className="text-2xl font-bold drop-shadow">{currentSection.title}</h2>
                  {currentSection.description && (
                    <p className="text-white/80 text-sm mt-0.5">{currentSection.description}</p>
                  )}
                </div>
              </div>
            )}

            {!currentSection.imageUrl && (
              <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900">{currentSection.title}</h2>
                {currentSection.description && <p className="text-gray-500 text-sm mt-1">{currentSection.description}</p>}
              </div>
            )}

            {/* Section content */}
            {currentSection.type === 'action_selection' || currentSection.type === 'action_review' ? (
              <ActionPanel sessionId={id!} isAdmin={isAdmin} />
            ) : currentSection.type === 'mood' ? (
              <MoodSection
                sessionId={id!}
                sectionId={currentSection._id}
                options={currentSection.options ?? []}
                existingCards={sectionCards}
                isActive={session.status === 'active'}
              />
            ) : (
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
                  <AddCardForm sessionId={id!} sectionId={currentSection._id} />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
