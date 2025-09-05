// src/controllers/auth.ts
import type { Request, Response } from "express";
import * as jwt from "jsonwebtoken";            // ✅ namespace import fixes overloads
import { User, UserDoc } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  // Fail fast in non-test envs; helps on Render
  console.error("❌ JWT_SECRET is not set");
}

/** Create a signed JWT for a user id */
function signToken(userId: string) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ sub: userId }, JWT_SECRET as jwt.Secret, { expiresIn: JWT_EXPIRES_IN });
}

/** Remove sensitive fields before sending user back */
function toPublicUser(user: UserDoc) {
  return {
    _id: user._id,
    email: user.email,
    name: user.name ?? "",
    createdAt: (user as any).createdAt,
    updatedAt: (user as any).updatedAt,
  };
}

/** POST /api/auth/register */
export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body as {
    email: string;
    password: string;
    name?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "Email already in use" });
  }

  // password hashing is handled in your user schema pre-save hook (if you have it)
  const user = await User.create({ email, password, name });

  const token = signToken(String(user._id));
  return res.status(201).json({ token, user: toPublicUser(user as UserDoc) });
};

/** POST /api/auth/login */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // IMPORTANT: select +password so compare can work
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  // Use the model instance method (properly typed)
  const ok = await (user as UserDoc).comparePassword(password);
  if (!ok) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = signToken(String(user._id));
  return res.json({ token, user: toPublicUser(user as UserDoc) });
};

/** GET /api/auth/me (requires auth middleware to set req.userId) */
export const me = async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({ user: toPublicUser(user as UserDoc) });
};
