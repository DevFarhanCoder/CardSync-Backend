import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name?: string;
  passwordHash?: string; // bcrypt hash (select:false)
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, default: "" },
    passwordHash: { type: String, select: false },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
