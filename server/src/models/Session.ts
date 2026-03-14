import { Schema, model, Types, Document } from 'mongoose';
import { ISection } from './Template';

export type SessionStatus = 'draft' | 'planned' | 'lobby' | 'active' | 'finished' | 'archived';
export type ParticipantStatus = 'invited' | 'connected' | 'absent';

export interface IParticipant {
  userId: Types.ObjectId;
  name: string;
  status: ParticipantStatus;
  remainingVotes: number;
  socketId: string | null;
  joinedAt: Date | null;
}

export interface ISession extends Document {
  _id: Types.ObjectId;
  name: string;
  workspaceId: Types.ObjectId;
  templateId: Types.ObjectId;
  templateSnapshot: {
    name: string;
    sections: ISection[];
    initialVotes: number;
    allowMultipleVotesPerCard: boolean;
    theme: { primaryColor: string; coverImage: string | null };
  };
  status: SessionStatus;
  currentSectionIndex: number;
  participants: IParticipant[];
  votingOpen: boolean;
  timerEndsAt: Date | null;
  maxActions: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const participantSchema = new Schema<IParticipant>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['invited', 'connected', 'absent'], default: 'invited' },
  remainingVotes: { type: Number, default: 5 },
  socketId: { type: String, default: null },
  joinedAt: { type: Date, default: null },
});

const sessionSchema = new Schema<ISession>(
  {
    name: { type: String, required: true, trim: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    templateSnapshot: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['draft', 'planned', 'lobby', 'active', 'finished', 'archived'],
      default: 'draft',
    },
    currentSectionIndex: { type: Number, default: 0 },
    participants: { type: [participantSchema], default: [] },
    votingOpen: { type: Boolean, default: false },
    timerEndsAt: { type: Date, default: null },
    maxActions: { type: Number, default: 3 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Session = model<ISession>('Session', sessionSchema);
