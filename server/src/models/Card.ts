import { Schema, model, Types, Document } from 'mongoose';

export interface ICard extends Document {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  sectionId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  authorId: Types.ObjectId;
  authorName: string;
  content: string;
  voteCount: number;
  groupId: Types.ObjectId | null;
  createdAt: Date;
}

const cardSchema = new Schema<ICard>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    sectionId: { type: Schema.Types.ObjectId, required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true, trim: true },
    voteCount: { type: Number, default: 0 },
    groupId: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

export const Card = model<ICard>('Card', cardSchema);
