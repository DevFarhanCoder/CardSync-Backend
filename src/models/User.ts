import mongoose, { Schema, Document } from "mongoose";

export interface UserDoc extends Document {
  fullName: string;           // ✅ ensure this exists
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    fullName: { type: String, required: true, trim: true }, // ✅
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<UserDoc>("User", UserSchema);
