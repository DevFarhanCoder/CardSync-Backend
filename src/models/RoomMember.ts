import { Schema, model } from "mongoose";

const RoomMemberSchema = new Schema({
  roomId: { type: String, index: true, required: true },
  userId: { type: String, index: true, required: true },
  role: { type: String, enum: ["admin", "member"], default: "member" },
  joinedAt: { type: Number, default: () => Date.now() },
});

RoomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

export type RoomMemberDoc = {
  roomId: string; userId: string; role: "admin"|"member"; joinedAt: number;
};
export default model<RoomMemberDoc>("RoomMember", RoomMemberSchema);
