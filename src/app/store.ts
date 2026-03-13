import { create } from 'zustand';
import { ActionItem, Card, Session, Template, User } from '@/types/domain';
import { themePresets } from '@/lib/themes';

interface AppState {
  me?: User;
  templates: Template[];
  sessions: Session[];
  cards: Card[];
  actions: ActionItem[];
  participants: User[];
  setMe: (user?: User) => void;
  addCard: (card: Card) => void;
  addTemplate: (template: Template) => void;
  updateSession: (session: Session) => void;
  addAction: (item: ActionItem) => void;
}

const seededTemplates: Template[] = themePresets.map((theme, idx) => ({
  id: `tpl-${idx + 1}`,
  title: `${theme.name} Retro`,
  themeId: theme.id,
  voteBudget: 5,
  sections: theme.sections.map((section, sectionIdx) => ({ ...section, id: `${theme.id}-${sectionIdx}` }))
}));

export const useAppStore = create<AppState>((set) => ({
  templates: seededTemplates,
  sessions: [
    { id: 'session-demo', title: 'Sprint 42 Retro', templateId: seededTemplates[0].id, themeId: 'candy-crash', activeStep: 1, status: 'live', overviewEnabled: false }
  ],
  cards: [],
  actions: [],
  participants: [],
  setMe: (me) => set({ me }),
  addCard: (card) => set((s) => ({ cards: [card, ...s.cards] })),
  addTemplate: (template) => set((s) => ({ templates: [template, ...s.templates] })),
  updateSession: (session) => set((s) => ({ sessions: s.sessions.map((it) => (it.id === session.id ? session : it)) })),
  addAction: (item) => set((s) => ({ actions: [item, ...s.actions] }))
}));
