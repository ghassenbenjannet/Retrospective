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

export interface ISection {
  _id: Types.ObjectId;
  title: string;
  type: SectionType;
  description: string;
  order: number;
  allowMultipleCards: boolean;
  maxCardsPerUser: number | null;
  hasTimer: boolean;
  timerSeconds: number | null;
  allowAnonymous: boolean;
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
  theme: {
    primaryColor: string;
    coverImage: string | null;
  };
  createdAt: Date;
}

const sectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['mood', 'positive', 'negative', 'brainstorming', 'minigame', 'vote', 'action_selection', 'action_review'],
    required: true,
  },
  description: { type: String, default: '' },
  order: { type: Number, required: true },
  allowMultipleCards: { type: Boolean, default: true },
  maxCardsPerUser: { type: Number, default: null },
  hasTimer: { type: Boolean, default: false },
  timerSeconds: { type: Number, default: null },
  allowAnonymous: { type: Boolean, default: false },
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
    theme: {
      primaryColor: { type: String, default: '#6366f1' },
      coverImage: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export const Template = model<ITemplate>('Template', templateSchema);
