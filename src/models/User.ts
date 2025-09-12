import mongoose, { Schema, Document } from "mongoose";

export interface UserDoc extends Document {
  email: string;
  passwordHash: string;
  name?: string;
  phone?: string;
  about?: string;
  avatarUrl?: string;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String },
    phone: { type: String },
    about: { type: String },
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<UserDoc>("User", UserSchema);