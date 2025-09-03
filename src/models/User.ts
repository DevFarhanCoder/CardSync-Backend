import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    // keep password selectable; if in your original schema it had select:false,
    // you'll need .select('+password') when querying
    password: { type: String, required: true, minlength: 4 },
    name: { type: String },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  const user = this as IUser;
  if (!user.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  const user = this as IUser;
  const stored = typeof user.password === "string" ? user.password : "";
  if (!stored) return false;
  const looksHashed = stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$");
  if (looksHashed) return bcrypt.compare(candidate, stored);
  // Legacy plaintext fallback
  return candidate === stored;
};

export default mongoose.model<IUser>("User", UserSchema);
