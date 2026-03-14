import { Schema, model, Types, Document } from 'mongoose';

export interface IVote extends Document {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  cardId: Types.ObjectId;
  userId: Types.ObjectId;
  count: number;
}

const voteSchema = new Schema<IVote>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    cardId: { type: Schema.Types.ObjectId, ref: 'Card', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    count: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

voteSchema.index({ sessionId: 1, cardId: 1, userId: 1 }, { unique: true });

export const Vote = model<IVote>('Vote', voteSchema);
