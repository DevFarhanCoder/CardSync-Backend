import { Schema, model, Types, Document } from "mongoose";

/** ----- Types ----- */
export interface ICard extends Document {
  title: string;
  description?: string;
  // Any card-specific data your UI needs (sections, links, etc.)
  data?: Record<string, any>;

  owner: Types.ObjectId;               // required
  slug: string;                        // unique per owner for pretty URLs

  isPublic: boolean;
  publishedAt?: Date;

  stats: {
    views: number;
    likes: number;
  };

  theme?: string;                      // optional theming
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
}

/** ----- Schema ----- */
const CardSchema = new Schema<ICard>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 1000 },
    data: { type: Schema.Types.Mixed },

    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    slug: { type: String, required: true },

    isPublic: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },

    stats: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
    },

    theme: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

/** ----- Indexes ----- */
// Unique slug per owner for stable URLs like /u/:userId/:slug
CardSchema.index({ owner: 1, slug: 1 }, { unique: true });
// Useful for public discovery
CardSchema.index({ isPublic: 1, publishedAt: 1 });

/** ----- Helpers ----- */
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 180);
}

/** Ensure slug is set/updated when title changes (but keep stable once public) */
CardSchema.pre("validate", function (next) {
  if (this.isModified("title")) {
    const base = slugify(this.title || "card");
    // If slug is locked by public publish, keep existing slug
    if (!this.isPublic) {
      // Add short random suffix to avoid collisions during creation
      const suffix = Math.random().toString(36).slice(2, 6);
      this.slug = `${base}-${suffix}`;
    }
  }
  // If new document and no slug given, generate one
  if (this.isNew && !this.slug) {
    const base = slugify(this.title || "card");
    const suffix = Math.random().toString(36).slice(2, 6);
    this.slug = `${base}-${suffix}`;
  }
  next();
});

const Card = model<ICard>("Card", CardSchema);
export default Card;
