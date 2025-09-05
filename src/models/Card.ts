// src/models/card.ts
import { Schema, model, Model, HydratedDocument, Types } from "mongoose";

export interface ICard {
  userId: Types.ObjectId;          // owner
  title?: string;
  slug?: string;
  data?: Record<string, unknown>;  // arbitrary structured data for your card sections
  visibility?: "private" | "unlisted" | "public";
  shareToken?: string | null;      // if you support tokenized share links
  // Allow extra fields without breaking builds where TS sees more props:
  [key: string]: any;
}

export type CardDoc = HydratedDocument<ICard>;
type CardModel = Model<ICard>;

const CardSchema = new Schema<ICard, CardModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true },
    slug: { type: String, trim: true, index: true },
    data: { type: Schema.Types.Mixed, default: {} },
    visibility: {
      type: String,
      enum: ["private", "unlisted", "public"],
      default: "private",
      index: true,
    },
    shareToken: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

// Add helpful compound index if you query by owner+slug
CardSchema.index({ userId: 1, slug: 1 }, { unique: false });

export const Card = model<ICard, CardModel>("Card", CardSchema);
