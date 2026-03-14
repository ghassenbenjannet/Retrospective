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

export interface Section {
  _id: string;
  title: string;
  type: SectionType;
  description: string;
  order: number;
  allowMultipleCards: boolean;
  maxCardsPerUser: number | null;
  hasTimer: boolean;
  timerSeconds: number | null;
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
