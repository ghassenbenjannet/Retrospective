import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useSessionStore } from '@/store/sessionStore';
import { useAuthStore } from '@/store/authStore';
import { useSession } from '@/hooks/useSession';
import { Card } from '../types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CardItem } from '@/components/live/CardItem';
import { AddCardForm } from '@/components/live/AddCardForm';
import { MiniGamePanel } from '@/components/live/MiniGamePanel';
import { TimerBar } from '@/components/live/TimerBar';
import { ActionPanel } from '@/components/live/ActionPanel';
import { ChevronLeft, ChevronRight, Vote, Users } from 'lucide-react';

export function LiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { session, cards, actions, activeGame, remainingVotes } = useSessionStore();
  const [sessionCards, setSessionCards] = useState<Card[]>([]);

  useSession(id!);

  // Load session + cards + actions via REST immediately (no wait for socket)
  useEffect(() => {
    api.get(`/sessions/${id}`).then(r => {
      const store = useSessionStore.getState();
      if (!store.session) store.setSession(r.data);
      const me = r.data.participants?.find((p: any) => p.userId === user?.id);
      if (me) store.setRemainingVotes(me.remainingVotes);
    });
    api.get(`/sessions/${id}/cards`).then(r => {
      useSessionStore.getState().setCards(r.data);
    });
    api.get(`/sessions/${id}/actions`).then(r => {
      useSessionStore.getState().setActions(r.data);
    });
  }, [id]);

  useEffect(() => {
    return () => useSessionStore.getState().reset();
  }, []);

  if (!session) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );

  const currentSection = session.templateSnapshot.sections[session.currentSectionIndex];
  const sectionCards = cards.filter(c => c.sectionId === currentSection?._id);
  const isAdmin = user?.role === 'admin';
  const socket = getSocket();

  const handleNextStep = () => socket.emit('session:next_step', { sessionId: id });
  const handlePrevStep = () => socket.emit('session:prev_step', { sessionId: id });
  const handleToggleVoting = () => socket.emit('session:toggle_voting', { sessionId: id, open: !session.votingOpen });
  const handleVote = (cardId: string, delta: number) => socket.emit('card:vote', { sessionId: id, cardId, delta });

  const connectedCount = session.participants.filter(p => p.status === 'connected').length;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-bold text-gray-900 text-lg">{session.name}</h1>
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
            <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg">
              <Vote size={14} className="inline mr-1" />{remainingVotes} votes restants
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
                {session.currentSectionIndex + 1} / {session.templateSnapshot.sections.length}
              </span>
              <Button size="sm" variant="ghost" onClick={handleNextStep}
                disabled={session.currentSectionIndex >= session.templateSnapshot.sections.length - 1}>
                <ChevronRight size={16} />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Timer */}
      {session.timerEndsAt && <TimerBar endsAt={session.timerEndsAt} />}

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">
        {/* Mini game */}
        {activeGame && <MiniGamePanel game={activeGame} sessionId={id!} />}

        {/* Section content */}
        {currentSection && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">{currentSection.title}</h2>
              {currentSection.description && <p className="text-gray-500 text-sm mt-1">{currentSection.description}</p>}
            </div>

            {currentSection.type === 'action_selection' || currentSection.type === 'action_review' ? (
              <ActionPanel sessionId={id!} isAdmin={isAdmin} />
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
