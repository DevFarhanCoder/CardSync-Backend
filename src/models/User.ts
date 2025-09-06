// src/models/User.ts
import { Schema, model, Model, HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  email: string;
  password: string;       // hashed
  name?: string;
  phone?: string;         // optional phone
  createdAt: Date;        // added via timestamps
  updatedAt: Date;        // added via timestamps
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDoc = HydratedDocument<IUser, IUserMethods>;
type UserModel = Model<IUser, {}, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // select:false is fine
    name: { type: String },
    phone: { type: String },  // optional
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidate: string) {
  const user = this as UserDoc;
  if (!user.password) return false;
  return bcrypt.compare(candidate, user.password);
};

export const User = model<IUser, UserModel>("User", UserSchema);
