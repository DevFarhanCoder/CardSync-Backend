import mongoose, { Schema, Document, Model } from "mongoose";

export interface UserDoc extends Document {
  email: string;
  password: string;          // selected only when explicitly requested
  name?: string;
  phone?: string;
  about?: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, select: false }, // hidden by default
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    about: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

// If you already have a model registered (hot reload), reuse it
export const User: Model<UserDoc> =
  mongoose.models.User || mongoose.model<UserDoc>("User", UserSchema);
