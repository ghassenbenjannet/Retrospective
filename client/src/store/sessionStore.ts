import { create } from 'zustand';
import { Session, Card, Action, MiniGame, Participant } from '@/types';

interface SessionState {
  session: Session | null;
  cards: Card[];
  actions: Action[];
  activeGame: MiniGame | null;
  remainingVotes: number;
  setSession: (s: Session) => void;
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  updateCard: (card: Card) => void;
  removeCard: (cardId: string) => void;
  updateCardVotes: (cardId: string, voteCount: number) => void;
  setActions: (actions: Action[]) => void;
  addAction: (action: Action) => void;
  setParticipants: (participants: Participant[]) => void;
  setStepChanged: (data: { currentSectionIndex: number; votingOpen?: boolean }) => void;
  setVotingOpen: (open: boolean) => void;
  setRemainingVotes: (n: number) => void;
  setActiveGame: (game: MiniGame | null) => void;
  setTimerEndsAt: (date: string | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  cards: [],
  actions: [],
  activeGame: null,
  remainingVotes: 0,

  setSession: (session) => set({ session, remainingVotes: 0 }),
  setCards: (cards) => set({ cards }),
  addCard: (card) => set(s => ({ cards: [...s.cards, card] })),
  updateCard: (card) => set(s => ({ cards: s.cards.map(c => c._id === card._id ? card : c) })),
  removeCard: (cardId) => set(s => ({ cards: s.cards.filter(c => c._id !== cardId) })),
  updateCardVotes: (cardId, voteCount) =>
    set(s => ({ cards: s.cards.map(c => c._id === cardId ? { ...c, voteCount } : c) })),
  setActions: (actions) => set({ actions }),
  addAction: (action) => set(s => ({ actions: [...s.actions, action] })),
  setParticipants: (participants) =>
    set(s => s.session ? { session: { ...s.session, participants } } : {}),
  setStepChanged: ({ currentSectionIndex, votingOpen }) =>
    set(s => s.session ? { session: { ...s.session, currentSectionIndex, votingOpen: votingOpen ?? s.session.votingOpen } } : {}),
  setVotingOpen: (open) =>
    set(s => s.session ? { session: { ...s.session, votingOpen: open } } : {}),
  setRemainingVotes: (remainingVotes) => set({ remainingVotes }),
  setActiveGame: (activeGame) => set({ activeGame }),
  setTimerEndsAt: (timerEndsAt) =>
    set(s => s.session ? { session: { ...s.session, timerEndsAt } } : {}),
  reset: () => set({ session: null, cards: [], actions: [], activeGame: null, remainingVotes: 0 }),
}));
