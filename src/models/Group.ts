import mongoose, { Schema, Document, Types } from "mongoose";

export interface GroupDoc extends Document {
  name: string;
  members: Types.ObjectId[];
  createdBy: Types.ObjectId;
}

const GroupSchema = new Schema<GroupDoc>(
  {
    name: { type: String, required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Group = mongoose.models.Group || mongoose.model<GroupDoc>("Group", GroupSchema);