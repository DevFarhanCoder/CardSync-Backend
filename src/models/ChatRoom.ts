import mongoose, { Schema, Document } from "mongoose";

export interface ChatRoomDoc extends Document {
  name: string;
  code: string;
  admin: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  description?: string;       // ✅ add this
  photoURL?: string;          // optional, for group logo
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema = new Schema<ChatRoomDoc>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    description: { type: String },        // ✅ add this
    photoURL: { type: String },           // optional
  },
  { timestamps: true }
);

const ChatRoom = mongoose.model<ChatRoomDoc>("ChatRoom", ChatRoomSchema);
export default ChatRoom;
