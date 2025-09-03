import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICard extends Document {
  owner: Types.ObjectId;
  title?: string;
  theme?: string;
  data?: any;
  isPublic: boolean;
}

const CardSchema = new Schema<ICard>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: String,
    theme: String,
    data: Schema.Types.Mixed,
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ICard>("Card", CardSchema);
