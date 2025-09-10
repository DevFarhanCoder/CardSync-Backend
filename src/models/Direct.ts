import { Schema, model, Types } from "mongoose";

export interface IDirect {
  participants: Types.ObjectId[]; // exactly 2
  lastMessageText?: string | null;
  lastMessageAt?: Date | null;
}

const DirectSchema = new Schema<IDirect>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", index: true, required: true }],
    lastMessageText: { type: String, default: null },
    lastMessageAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

DirectSchema.index({ participants: 1 }, { unique: false });

export const Direct = model<IDirect>("Direct", DirectSchema);
