// src/models/User.ts
import { Schema, model, Model, HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import { slugify } from "../utils/slug.js";

export interface IUser {
  email: string;
  password: string;       // hashed
  name?: string;
  phone?: string;         // optional phone
  handle: string;
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

UserSchema.pre("validate", async function (next) {
  if (!this.handle) {
    const base = slugify(this.name || this.email.split("@")[0] || "user");
    let h = base, i = 0;
    // ensure uniqueness
    while (await (this.constructor as any).exists({ handle: h })) {
      i += 1; h = `${base}-${i}`;
    }
    this.handle = h;
  }
  next();
});

export const User = model<IUser, UserModel>("User", UserSchema);
