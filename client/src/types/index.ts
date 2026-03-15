export type UserRole = 'admin' | 'collaborator' | 'observer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
}

export type SectionType =
  | 'mood' | 'positive' | 'negative' | 'brainstorming'
  | 'minigame' | 'vote' | 'action_selection' | 'action_review';

export interface SectionOption {
  title: string;
  imageUrl: string;
  answer?: string;
}

export interface Section {
  _id: string;
  title: string;
  type: SectionType;
  description: string;
  order: number;
  imageUrl: string | null;
  allowMultipleCards: boolean;
  maxCardsPerUser: number | null;
  hasTimer: boolean;
  timerSeconds: number | null;
  options: SectionOption[];
  // Minigame config
  gameWinVotes?: number;
  gameLoseEffect?: 'vote' | 'gage';
  gameLoseVotes?: number;
  gameLoseGage?: string;
}

export type TemplateStatus = 'draft' | 'active' | 'archived';

export interface Template {
  _id: string;
  name: string;
  workspaceId: string;
  createdBy: string;
  status: TemplateStatus;
  sections: Section[];
  initialVotes: number;
  allowMultipleVotesPerCard: boolean;
  displayMode: 'sections' | 'onepage';
  theme: { primaryColor: string; coverImage: string | null };
  createdAt: string;
}

export type SessionStatus = 'draft' | 'planned' | 'lobby' | 'active' | 'finished' | 'archived';
export type ParticipantStatus = 'invited' | 'connected' | 'absent';

export interface Participant {
  userId: string;
  name: string;
  status: ParticipantStatus;
  remainingVotes: number;
  socketId: string | null;
  joinedAt: string | null;
}

export interface Session {
  _id: string;
  name: string;
  workspaceId: string;
  templateId: string;
  templateSnapshot: {
    name: string;
    sections: Section[];
    initialVotes: number;
    allowMultipleVotesPerCard: boolean;
    displayMode: 'sections' | 'onepage';
    theme: { primaryColor: string; coverImage: string | null };
  };
  status: SessionStatus;
  currentSectionIndex: number;
  participants: Participant[];
  votingOpen: boolean;
  timerEndsAt: string | null;
  maxActions: number;
  createdBy: string;
  createdAt: string;
}

export interface Card {
  _id: string;
  sessionId: string;
  sectionId: string;
  authorId: string;
  authorName: string;
  content: string;
  voteCount: number;
  groupId: string | null;
  createdAt: string;
}

export type ActionStatus = 'todo' | 'in_progress' | 'done' | 'dropped';
export type ActionPriority = 'prio' | 'top1' | 'top2' | 'top3';

export interface Action {
  _id: string;
  title: string;
  description: string;
  workspaceId: string;
  sessionId: string;
  sourceCardId: string | null;
  ownerId: string;
  ownerName: string;
  status: ActionStatus;
  priority: ActionPriority | null;
  dueDate: string | null;
  createdAt: string;
}

export interface MiniGame {
  _id: string;
  sessionId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  timeLimitSeconds: number;
  status: 'pending' | 'active' | 'revealed';
  answers: Array<{ userId: string; answer: string; isCorrect: boolean; effect: string }>;
}

export interface CardGameCard {
  idx: number;
  question: string;
  answer: string;
  isFlipped: boolean;
  isAnswerRevealed: boolean;
}

export interface CardGameState {
  sectionId: string;
  cards: CardGameCard[];
  currentPlayerIdx: number;
  playerOrder: Array<{ userId: string; name: string; isAdmin: boolean }>;
  status: 'idle' | 'active' | 'finished';
  currentFlippedCardIdx: number | null;
  awaitingJudge: boolean;
  lastResult: { userId: string; name: string; won: boolean; gageText?: string } | null;
}
