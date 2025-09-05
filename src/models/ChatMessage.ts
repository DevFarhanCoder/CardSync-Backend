import { Schema, model, Document, Types } from "mongoose";

export interface IChatMessage extends Document {
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
  text?: string;
  kind: "text" | "card";
  payload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, default: "" },
    kind: { type: String, enum: ["text", "card"], default: "text", index: true },
    payload: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export default model<IChatMessage>("ChatMessage", ChatMessageSchema);
