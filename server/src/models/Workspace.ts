import { Schema, model, Types, Document } from 'mongoose';

export interface EmailSettings {
  defaultSenderUserId: Types.ObjectId | null;
  sectionTypesToInclude: string[]; // e.g. ['brainstorming', 'positive', 'negative']
}

export interface IWorkspace extends Document {
  _id: Types.ObjectId;
  name: string;
  createdBy: Types.ObjectId;
  emailSettings: EmailSettings;
  createdAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emailSettings: {
      defaultSenderUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      sectionTypesToInclude: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

export const Workspace = model<IWorkspace>('Workspace', workspaceSchema);
