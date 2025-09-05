// src/models/user.ts
import { Schema, model, Model, HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  email: string;
  password: string;       // hashed
  name?: string;
}

export interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

// Helpful hydrated doc type for downstream casts
export type UserDoc = HydratedDocument<IUser, IUserMethods>;

type UserModel = Model<IUser, {}, IUserMethods>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // select:false is fine
    name: { type: String },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidate: string) {
  const user = this as UserDoc;
  // if password was not selected, comparison can’t be done
  if (!user.password) return false;
  return bcrypt.compare(candidate, user.password);
};

export const User = model<IUser, UserModel>("User", UserSchema);
