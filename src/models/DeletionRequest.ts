import mongoose, { Schema, Document } from "mongoose";

export interface DeletionRequestDoc extends Document {
  fullName: string;
  email: string;
  reason?: string;
  source?: "web" | "app";
  status: "pending" | "verified" | "completed" | "rejected";
}

const DeletionRequestSchema = new Schema<DeletionRequestDoc>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    reason: String,
    source: { type: String, default: "web" },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

export const DeletionRequest = mongoose.model<DeletionRequestDoc>(
  "DeletionRequest",
  DeletionRequestSchema
);
