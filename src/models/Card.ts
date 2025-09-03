import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAnalytics {
  views: number;
  clicks: number;
  shares: number;
  saves: number;
}

export interface ICard extends Document {
  ownerId: Types.ObjectId;
  title?: string;
  slug?: string;
  theme?: string;
  data?: any;
  isPublic: boolean;

  // NEW: make these part of the interface
  keywords?: string[];
  tags?: string[];

  analytics?: IAnalytics;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
  },
  { _id: false }
);

const CardSchema = new Schema<ICard>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, trim: true, default: "Untitled" },
    slug: { type: String, trim: true, index: true, unique: false },
    theme: { type: String, trim: true, default: "luxe" },
    data: { type: Schema.Types.Mixed, default: {} },
    isPublic: { type: Boolean, default: false },

    // NEW: persist keywords/tags
    keywords: { type: [String], default: [] },
    tags: { type: [String], default: [] },

    analytics: { type: AnalyticsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// helpful indexes
CardSchema.index({ title: "text", tags: "text", keywords: "text" });

export default mongoose.model<ICard>("Card", CardSchema);
