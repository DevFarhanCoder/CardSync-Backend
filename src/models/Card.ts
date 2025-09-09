// src/models/Card.ts
import { Schema, model, Model, HydratedDocument, Types } from "mongoose";
import { slugify } from "../utils/slug.js";

export interface ICard {
  userId: Types.ObjectId;          // owner (current backend uses userId)
  title?: string;
  slug?: string;
  data?: Record<string, unknown>;
  visibility?: "private" | "unlisted" | "public";
  shareToken?: string | null;
  [key: string]: any;
}

export type CardDoc = HydratedDocument<ICard>;
type CardModel = Model<ICard>;

const CardSchema = new Schema<ICard, CardModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
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

/**
 * Enforce uniqueness of slug **per user** (and ignore docs where userId is missing).
 * This matches your current code-path that always sets userId via requireAuth.
 * Note: we keep this unique so a user can’t create duplicate slugs accidentally.
 */
CardSchema.index(
  { userId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } }
);

/** Auto-generate a unique slug for the (userId, title) if not supplied */
CardSchema.pre("validate", async function (next) {
  if (!this.slug) {
    const base = slugify(this.title || "card");
    let s = base;
    let i = 1;
    // ensure per-user slug uniqueness
    while (await (this.constructor as any).exists({ userId: this.userId, slug: s })) {
      i += 1;
      s = `${base}-${i}`;
    }
    this.slug = s;
  }
  next();
});

export const Card = model<ICard, CardModel>("Card", CardSchema);
