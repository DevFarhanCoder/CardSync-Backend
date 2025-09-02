import { Schema, model, Types } from "mongoose";

const RoomSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, index: true, unique: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Number, default: () => Date.now() },
});

export type RoomDoc = {
  _id: Types.ObjectId;
  name: string;
  code: string;
  createdBy: string;
  createdAt: number;
};
export default model<RoomDoc>("Room", RoomSchema);
