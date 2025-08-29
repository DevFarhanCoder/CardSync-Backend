import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Card document
 * We intentionally keep `data` as a mixed bag so the frontend
 * can evolve without requiring schema migrations.
 */
export interface ICard extends Document {
  title: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  isPublic: boolean;
  theme: string;
  data: Record<string, any>; // includes name, email, phone, socials, extra.personal, extra.company, etc.
  keywords: string[];
  tags: string[];
  analytics: {
    views: number;
    clicks: number;
    shares: number;
    saves: number;
  };
}

const Mixed = Schema.Types.Mixed;

const CardSchema = new Schema<ICard>(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    isPublic: { type: Boolean, default: false },
    theme: { type: String, default: "luxe" },

    // keep flexible; we only validate at the edges
    data: { type: Mixed, default: {} },

    keywords: { type: [String], default: [] },
    tags: { type: [String], default: [] },

    analytics: {
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// For search/explore
CardSchema.index({ title: "text", keywords: "text", tags: "text" });

const Card: Model<ICard> =
  mongoose.models.Card || mongoose.model<ICard>("Card", CardSchema);

export default Card;
