import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useSessionStore } from '@/store/sessionStore';
import { Action, Card, CardGameState, MiniGame, Participant, Session } from '@/types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export function useSession(sessionId: string) {
  const store = useSessionStore();
  const { user } = useAuthStore.getState();

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit('session:join', { sessionId });

    // Re-join on reconnect (network blip, server restart, etc.)
    const rejoin = () => socket.emit('session:join', { sessionId });
    socket.on('connect', rejoin);

    socket.on('session:state', (session: Session) => store.setSession(session));
    socket.on('session:status_changed', ({ status }: { status: string }) => store.setSessionStatus(status));
    socket.on('session:participants', (participants: Participant[]) => store.setParticipants(participants));
    socket.on('session:step_changed', store.setStepChanged);
    socket.on('session:voting_changed', ({ votingOpen }: { votingOpen: boolean }) => store.setVotingOpen(votingOpen));
    socket.on('session:votes_updated', ({ remainingVotes }: { remainingVotes: number }) => store.setRemainingVotes(remainingVotes));
    socket.on('session:timer_started', ({ timerEndsAt }: { timerEndsAt: string }) => store.setTimerEndsAt(timerEndsAt));
    socket.on('speech_timer:started', ({ speechTimerEndsAt }: { speechTimerEndsAt: string }) => store.setSpeechTimerEndsAt(speechTimerEndsAt));
    socket.on('speech_timer:stopped', () => store.setSpeechTimerEndsAt(null));

    socket.on('card:created', (card: Card) => {
      store.addCard(card);
      // Mark as "new" if it's from someone else (for animation)
      if (card.authorId !== user?.id) {
        store.markCardNew(card._id);
        setTimeout(() => store.clearNewCard(card._id), 3000);
      }
    });
    socket.on('card:updated', (card: Card) => store.updateCard(card));
    socket.on('card:deleted', ({ cardId }: { cardId: string }) => store.removeCard(cardId));
    socket.on('card:voted', ({ cardId, voteCount }: { cardId: string; voteCount: number }) =>
      store.updateCardVotes(cardId, voteCount));
    socket.on('card:my_vote', ({ cardId, voted }: { cardId: string; voted: boolean }) =>
      store.setMyCardVote(cardId, voted));

    socket.on('minigame:started', (game: MiniGame) => store.setActiveGame(game));
    socket.on('minigame:revealed', (game: MiniGame) => store.setActiveGame(game));

    socket.on('action:created', (action: Action) => store.addAction(action));
    socket.on('action:updated', (action: Action) => store.updateAction(action));
    socket.on('action:deleted', ({ _id }: { _id: string }) => store.removeAction(_id));

    socket.on('cardgame:state', (state: CardGameState | null) => store.setCardGame(state));

    socket.on('user:typing', ({ userId, sectionId, name }: { userId: string; sectionId: string; name: string }) =>
      store.setUserTyping(sectionId, userId, name));
    socket.on('user:stopped_typing', ({ userId, sectionId }: { userId: string; sectionId: string }) =>
      store.setUserStoppedTyping(sectionId, userId));

    socket.on('error', ({ message }: { message: string }) => {
      console.error('[socket error]', message);
      toast.error(message);
    });

    return () => {
      socket.off('session:state');
      socket.off('session:status_changed');
      socket.off('session:participants');
      socket.off('session:step_changed');
      socket.off('session:voting_changed');
      socket.off('session:votes_updated');
      socket.off('session:timer_started');
    socket.off('speech_timer:started');
    socket.off('speech_timer:stopped');
      socket.off('card:created');
      socket.off('card:updated');
      socket.off('card:deleted');
      socket.off('card:voted');
      socket.off('card:my_vote');
      socket.off('minigame:started');
      socket.off('minigame:revealed');
      socket.off('action:created');
      socket.off('action:updated');
      socket.off('action:deleted');
      socket.off('cardgame:state');
      socket.off('user:typing');
      socket.off('user:stopped_typing');
      socket.off('error');
      socket.off('connect', rejoin);
    };
  }, [sessionId]);
}
