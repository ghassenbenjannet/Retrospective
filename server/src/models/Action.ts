import { Schema, model, Types, Document } from 'mongoose';

export type ActionStatus = 'todo' | 'in_progress' | 'done' | 'dropped';
export type ActionPriority = 'prio' | 'top1' | 'top2' | 'top3';

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
  priority: ActionPriority | null;
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
    priority: { type: String, enum: ['prio', 'top1', 'top2', 'top3'], default: null },
    dueDate: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Action = model<IAction>('Action', actionSchema);
