import { Schema, model } from "mongoose";

const MessageSchema = new Schema({
  id: { type: String, required: true, index: true, unique: true }, // client uuid
  roomId: { type: String, index: true, required: true },
  authorId: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Number, default: () => Date.now(), index: true },
});

export type MessageDoc = {
  id: string; roomId: string; authorId: string; text: string; createdAt: number;
};
export default model<MessageDoc>("Message", MessageSchema);
