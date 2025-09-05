import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name?: string;
  phone?: string;               // <— add this
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "" },
    phone: { type: String, index: true, sparse: true },   // <— add this
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default model<IUser>("User", UserSchema);
