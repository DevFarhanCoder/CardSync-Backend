import { Schema, model, Types, Document } from "mongoose";

export interface IChatRoom extends Document {
  name: string;
  code: string;                 // 5–6 digit OTP
  admin: Types.ObjectId;        // creator user id
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true },
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
  },
  { timestamps: true }
);

export default model<IChatRoom>("ChatRoom", ChatRoomSchema);
