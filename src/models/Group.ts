import { Schema, model, Types, HydratedDocument, Model } from "mongoose";

export interface IGroup {
  name: string;
  ownerId: Types.ObjectId;
  joinCode: string;                 // short code like YA7P
  members: Types.ObjectId[];        // user ids
  lastMessageText?: string | null;  // preview text
  lastMessageAt?: Date | null;      // preview timestamp
}

export type GroupDoc = HydratedDocument<IGroup>;
type GroupModel = Model<IGroup>;

const GroupSchema = new Schema<IGroup, GroupModel>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    joinCode: { type: String, required: true, unique: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    lastMessageText: { type: String, default: null },
    lastMessageAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

// Optional: soft uniqueness for name per owner
GroupSchema.index(
  { ownerId: 1, name: 1 },
  { unique: true, partialFilterExpression: { ownerId: { $type: "objectId" } } }
);

export const Group = model<IGroup, GroupModel>("Group", GroupSchema);
