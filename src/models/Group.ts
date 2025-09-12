import { Schema, model, Types, HydratedDocument, Model } from "mongoose";

export interface IGroup {
  name: string;
  ownerId: Types.ObjectId;
  joinCode: string;                 // short code like ABC123
  members: Types.ObjectId[];        // user ids (owner should also be in this list)
  admins: Types.ObjectId[];         // users with admin privileges (owner is always admin)
  description?: string | null;
  photoUrl?: string | null;
  lastMessageText?: string | null;  // preview text
  lastMessageAt?: Date | null;      // preview timestamp
}

export type GroupDoc = HydratedDocument<IGroup>;
type GroupModel = Model<IGroup>;

const GroupSchema = new Schema<IGroup, GroupModel>(
  {
    name: { type: String, required: true, trim: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    joinCode: { type: String, required: true, index: true, uppercase: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    admins: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    description: { type: String, default: null },
    photoUrl: { type: String, default: null },
    lastMessageText: { type: String, default: null },
    lastMessageAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

// Ensure owner is always included in admins and members (defensive)
GroupSchema.pre("save", function (next) {
  const self = this as any;
  const owner = String(self.ownerId);
  const members = new Set((self.members || []).map((x: any) => String(x)));
  const admins = new Set((self.admins || []).map((x: any) => String(x)));
  members.add(owner);
  admins.add(owner);
  self.members = Array.from(members) as any;
  self.admins = Array.from(admins) as any;
  next();
});

// Optional: soft uniqueness for name per owner
GroupSchema.index(
  { ownerId: 1, name: 1 },
  { unique: true, partialFilterExpression: { ownerId: { $type: "objectId" } } }
);

export const Group = model<IGroup, GroupModel>("Group", GroupSchema);
