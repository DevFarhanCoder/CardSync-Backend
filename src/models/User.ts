import mongoose, { Schema, Document } from "mongoose";

export interface UserDoc extends Document {
  // Keep both because some controllers use `name` and others use `fullName`
  fullName?: string;
  name?: string;             // <- for backwards compatibility
  email: string;
  passwordHash: string;
  phone?: string;            // <- some routes read `user.phone`
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    fullName:    { type: String, trim: true },
    name:        { type: String, trim: true },     // keep both; we set both on create
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash:{ type: String, required: true },
    phone:       { type: String, trim: true },
  },
  { timestamps: true }
);

// Virtual displayName if you ever need one
UserSchema.virtual("displayName").get(function (this: any) {
  return this.fullName || this.name || "";
});

export const User = mongoose.model<UserDoc>("User", UserSchema);
