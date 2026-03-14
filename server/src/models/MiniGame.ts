import { Schema, model, Types, Document } from 'mongoose';

export type MiniGameEffect = 'plus_one' | 'minus_one' | 'none';

export interface IAnswer {
  userId: Types.ObjectId;
  answer: string;
  answeredAt: Date;
  isCorrect: boolean;
  effect: MiniGameEffect;
}

export interface IMiniGame extends Document {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: string;
  timeLimitSeconds: number;
  status: 'pending' | 'active' | 'revealed';
  answers: IAnswer[];
  createdBy: Types.ObjectId;
  startedAt: Date | null;
  revealedAt: Date | null;
}

const answerSchema = new Schema<IAnswer>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  answer: { type: String, required: true },
  answeredAt: { type: Date, required: true },
  isCorrect: { type: Boolean, required: true },
  effect: { type: String, enum: ['plus_one', 'minus_one', 'none'], required: true },
});

const miniGameSchema = new Schema<IMiniGame>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: String, required: true },
    timeLimitSeconds: { type: Number, default: 30 },
    status: { type: String, enum: ['pending', 'active', 'revealed'], default: 'pending' },
    answers: { type: [answerSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: null },
    revealedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const MiniGame = model<IMiniGame>('MiniGame', miniGameSchema);
