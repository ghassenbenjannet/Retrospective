import { Schema, model, Types, Document } from 'mongoose';

export type ActionStatus = 'todo' | 'in_progress' | 'done' | 'dropped';

export interface IAction extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  workspaceId: Types.ObjectId;
  sessionId: Types.ObjectId;
  sourceCardId: Types.ObjectId | null;
  ownerId: Types.ObjectId;
  ownerName: string;
  status: ActionStatus;
  dueDate: Date | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const actionSchema = new Schema<IAction>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    sourceCardId: { type: Schema.Types.ObjectId, ref: 'Card', default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, required: true },
    status: { type: String, enum: ['todo', 'in_progress', 'done', 'dropped'], default: 'todo' },
    dueDate: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Action = model<IAction>('Action', actionSchema);
