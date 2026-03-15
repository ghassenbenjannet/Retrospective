import { create } from 'zustand';
import { Session, Card, Action, MiniGame, Participant, CardGameState } from '@/types';

// { sectionId -> { userId -> name } }
type TypingMap = Record<string, Record<string, string>>;

interface SessionState {
  session: Session | null;
  cards: Card[];
  actions: Action[];
  activeGame: MiniGame | null;
  cardGame: CardGameState | null;
  remainingVotes: number;
  typingUsers: TypingMap;
  myVotedCardIds: Set<string>;
  newCardIds: Set<string>;
  sectionDoneUsers: Record<string, string[]>;
  setSession: (s: Session) => void;
  setSessionStatus: (status: string) => void;
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  updateCard: (card: Card) => void;
  removeCard: (cardId: string) => void;
  updateCardVotes: (cardId: string, voteCount: number) => void;
  setActions: (actions: Action[]) => void;
  addAction: (action: Action) => void;
  updateAction: (action: Action) => void;
  removeAction: (actionId: string) => void;
  setParticipants: (participants: Participant[]) => void;
  setStepChanged: (data: { currentSectionIndex: number; votingOpen?: boolean }) => void;
  setVotingOpen: (open: boolean) => void;
  setRemainingVotes: (n: number) => void;
  setActiveGame: (game: MiniGame | null) => void;
  setCardGame: (game: CardGameState | null) => void;
  setTimerEndsAt: (date: string | null) => void;
  setSpeechTimerEndsAt: (date: string | null) => void;
  setUserTyping: (sectionId: string, userId: string, name: string) => void;
  setUserStoppedTyping: (sectionId: string, userId: string) => void;
  setMyVotedCardIds: (ids: string[]) => void;
  setMyCardVote: (cardId: string, voted: boolean) => void;
  markCardNew: (cardId: string) => void;
  clearNewCard: (cardId: string) => void;
  setSectionDoneUsers: (sectionId: string, userIds: string[]) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  cards: [],
  actions: [],
  activeGame: null,
  cardGame: null,
  remainingVotes: 0,
  typingUsers: {},
  myVotedCardIds: new Set(),
  newCardIds: new Set(),
  sectionDoneUsers: {},

  setSession: (session) => set({ session }),
  setSessionStatus: (status) =>
    set(s => s.session ? { session: { ...s.session, status: status as any } } : {}),
  setCards: (cards) => set({ cards }),
  addCard: (card) => set(s => ({ cards: [...s.cards, card] })),
  updateCard: (card) => set(s => ({ cards: s.cards.map(c => c._id === card._id ? card : c) })),
  removeCard: (cardId) => set(s => ({ cards: s.cards.filter(c => c._id !== cardId) })),
  updateCardVotes: (cardId, voteCount) =>
    set(s => ({ cards: s.cards.map(c => c._id === cardId ? { ...c, voteCount } : c) })),
  setActions: (actions) => set({ actions }),
  addAction: (action) => set(s => ({ actions: [...s.actions, action] })),
  updateAction: (action) => set(s => ({ actions: s.actions.map(a => a._id === action._id ? action : a) })),
  removeAction: (actionId) => set(s => ({ actions: s.actions.filter(a => a._id !== actionId) })),
  setParticipants: (participants) =>
    set(s => s.session ? { session: { ...s.session, participants } } : {}),
  setStepChanged: ({ currentSectionIndex, votingOpen }) =>
    set(s => s.session ? { session: { ...s.session, currentSectionIndex, votingOpen: votingOpen ?? s.session.votingOpen } } : {}),
  setVotingOpen: (open) =>
    set(s => s.session ? { session: { ...s.session, votingOpen: open } } : {}),
  setRemainingVotes: (remainingVotes) => set({ remainingVotes }),
  setActiveGame: (activeGame) => set({ activeGame }),
  setCardGame: (cardGame) => set({ cardGame }),
  setTimerEndsAt: (timerEndsAt) =>
    set(s => s.session ? { session: { ...s.session, timerEndsAt } } : {}),
  setSpeechTimerEndsAt: (speechTimerEndsAt) =>
    set(s => s.session ? { session: { ...s.session, speechTimerEndsAt } } : {}),
  setUserTyping: (sectionId, userId, name) =>
    set(s => ({
      typingUsers: {
        ...s.typingUsers,
        [sectionId]: { ...(s.typingUsers[sectionId] ?? {}), [userId]: name },
      },
    })),
  setUserStoppedTyping: (sectionId, userId) =>
    set(s => {
      const section = { ...(s.typingUsers[sectionId] ?? {}) };
      delete section[userId];
      return { typingUsers: { ...s.typingUsers, [sectionId]: section } };
    }),
  setMyVotedCardIds: (ids) => set({ myVotedCardIds: new Set(ids) }),
  setMyCardVote: (cardId, voted) =>
    set(s => {
      const next = new Set(s.myVotedCardIds);
      if (voted) next.add(cardId); else next.delete(cardId);
      return { myVotedCardIds: next };
    }),
  markCardNew: (cardId) =>
    set(s => { const next = new Set(s.newCardIds); next.add(cardId); return { newCardIds: next }; }),
  clearNewCard: (cardId) =>
    set(s => { const next = new Set(s.newCardIds); next.delete(cardId); return { newCardIds: next }; }),
  setSectionDoneUsers: (sectionId, userIds) =>
    set(s => ({ sectionDoneUsers: { ...s.sectionDoneUsers, [sectionId]: userIds } })),
  reset: () => set({
    session: null, cards: [], actions: [], activeGame: null, cardGame: null,
    remainingVotes: 0, typingUsers: {}, myVotedCardIds: new Set(), newCardIds: new Set(),
    sectionDoneUsers: {},
  }),
}));
