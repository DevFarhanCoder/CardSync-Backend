// src/models/ChatRoom.ts
import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IChatRoom extends Document {
  name: string;
  code: string;
  admin: Types.ObjectId;
  members: Types.ObjectId[];
  description?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    description: { type: String },
    photoURL: { type: String },
  },
  { timestamps: true }
);

// Re-use existing model if it’s already compiled (important for dev/hot reload)
const ChatRoom =
  (mongoose.models.ChatRoom as mongoose.Model<IChatRoom>) ||
  mongoose.model<IChatRoom>("ChatRoom", ChatRoomSchema);

export default ChatRoom;
export type { IChatRoom };
