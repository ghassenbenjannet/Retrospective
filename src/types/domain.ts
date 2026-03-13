export type Role = 'admin' | 'collaborator';
export type SectionType =
  | 'mood'
  | 'brainstorm'
  | 'positive'
  | 'negative'
  | 'mini-game'
  | 'voting'
  | 'action-selection'
  | 'action-review';

export type ActionStatus = 'todo' | 'in-progress' | 'done';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  teamId: string;
}

export interface TemplateSection {
  id: string;
  type: SectionType;
  title: string;
  subtitle: string;
}

export interface Template {
  id: string;
  title: string;
  themeId: string;
  sections: TemplateSection[];
  voteBudget: number;
}

export interface Session {
  id: string;
  title: string;
  templateId: string;
  themeId: string;
  activeStep: number;
  status: 'draft' | 'live' | 'completed';
  overviewEnabled: boolean;
}

export interface Card {
  id: string;
  sessionId: string;
  stepId: string;
  authorId: string;
  content: string;
  color: string;
  votes: number;
}

export interface MiniGameQuestion {
  id: string;
  themeId: string;
  prompt: string;
  choices: string[];
  correctChoice: number;
}

export interface ActionItem {
  id: string;
  teamId: string;
  text: string;
  ownerId: string;
  dueDate: string;
  status: ActionStatus;
  sourceSessionId: string;
}
