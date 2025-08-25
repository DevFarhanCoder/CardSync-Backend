import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICard extends Document {
  title: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  isPublic: boolean;
  theme: string;
  data: Record<string, any>;
  keywords: string[];
  tags: string[];
  analytics: {
    views: number;
    clicks: number;
    shares: number;
    saves: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<ICard>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isPublic: { type: Boolean, default: true },
    theme: { type: String, default: "luxe" },
    data: { type: Schema.Types.Mixed, default: {} },
    keywords: [{ type: String, index: true }],
    tags: [{ type: String, index: true }],
    analytics: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Text search for Explore
CardSchema.index({ title: "text", keywords: "text", tags: "text" });

const Card: Model<ICard> = mongoose.models.Card || mongoose.model<ICard>("Card", CardSchema);
export default Card;
