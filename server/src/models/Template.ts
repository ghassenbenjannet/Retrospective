import { Schema, model, Types, Document } from 'mongoose';

export type SectionType =
  | 'mood'
  | 'positive'
  | 'negative'
  | 'brainstorming'
  | 'minigame'
  | 'vote'
  | 'action_selection'
  | 'action_review';

export interface ISectionOption {
  title: string;
  imageUrl: string;
  answer?: string;
}

export interface ISection {
  _id: Types.ObjectId;
  title: string;
  type: SectionType;
  description: string;
  order: number;
  imageUrl: string | null;
  allowMultipleCards: boolean;
  maxCardsPerUser: number | null;
  hasTimer: boolean;
  timerSeconds: number | null;
  allowAnonymous: boolean;
  options: ISectionOption[];
}

export type TemplateStatus = 'draft' | 'active' | 'archived';

export interface ITemplate extends Document {
  _id: Types.ObjectId;
  name: string;
  workspaceId: Types.ObjectId;
  createdBy: Types.ObjectId;
  status: TemplateStatus;
  sections: ISection[];
  initialVotes: number;
  allowMultipleVotesPerCard: boolean;
  displayMode: 'sections' | 'onepage';
  theme: {
    primaryColor: string;
    coverImage: string | null;
  };
  createdAt: Date;
}

const sectionOptionSchema = new Schema<ISectionOption>({
  title: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  answer: { type: String, default: '' },
}, { _id: false });

const sectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['mood', 'positive', 'negative', 'brainstorming', 'minigame', 'vote', 'action_selection', 'action_review'],
    required: true,
  },
  description: { type: String, default: '' },
  order: { type: Number, required: true },
  imageUrl: { type: String, default: null },
  allowMultipleCards: { type: Boolean, default: true },
  maxCardsPerUser: { type: Number, default: null },
  hasTimer: { type: Boolean, default: false },
  timerSeconds: { type: Number, default: null },
  allowAnonymous: { type: Boolean, default: false },
  options: { type: [sectionOptionSchema], default: [] },
});

const templateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
    sections: { type: [sectionSchema], default: [] },
    initialVotes: { type: Number, default: 5 },
    allowMultipleVotesPerCard: { type: Boolean, default: true },
    displayMode: { type: String, enum: ['sections', 'onepage'], default: 'sections' },
    theme: {
      primaryColor: { type: String, default: '#6366f1' },
      coverImage: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export const Template = model<ITemplate>('Template', templateSchema);
