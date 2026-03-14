import { Schema, model, Types, Document } from 'mongoose';

export interface IWorkspace extends Document {
  _id: Types.ObjectId;
  name: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Workspace = model<IWorkspace>('Workspace', workspaceSchema);
