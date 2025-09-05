// src/models/ShareRecord.ts
import { Schema, model, Types, Document } from "mongoose";

export interface IShareRecord extends Document {
  senderId: Types.ObjectId;
  recipientIds: Types.ObjectId[];   // for in-app share
  roomId?: Types.ObjectId | null;   // for group share
  cardId: Types.ObjectId;
  mode: "group" | "qr" | "link" | "inapp";
  createdAt: Date;
}

const ShareRecordSchema = new Schema<IShareRecord>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientIds: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    roomId: { type: Schema.Types.ObjectId, ref: "ChatRoom", default: null, index: true },
    cardId: { type: Schema.Types.ObjectId, ref: "Card", required: true, index: true },
    mode: { type: String, enum: ["group", "qr", "link", "inapp"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ShareRecordSchema.index({ senderId: 1, createdAt: -1 });

export default model<IShareRecord>("ShareRecord", ShareRecordSchema);