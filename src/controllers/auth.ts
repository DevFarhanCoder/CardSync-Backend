// src/controllers/auth.ts
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

// NOTE: keep the `.js` extension in ESM imports even in TS.
// When TS compiles, it outputs JS files ending in .js.
import { User } from "../models/User.js";

// ---------- Env & helpers ----------
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

/**
 * jsonwebtoken accepts "expiresIn" as string (e.g. "7d", "1h") or number (seconds).
 * Use its declared union type to satisfy TS.
 */
type JwtExpires = NonNullable<jwt.SignOptions["expiresIn"]>;

// default "7d" if not provided
const JWT_EXPIRES_IN: JwtExpires =
  (process.env.JWT_EXPIRES_IN as JwtExpires) ?? "7d";

// Cookie maxAge MUST be a NUMBER (milliseconds)
const JWT_COOKIE_MAX_AGE_MS = Number(
  process.env.JWT_COOKIE_MAX_AGE_MS ?? 7 * 24 * 60 * 60 * 1000 // 7 days
);

// ---------- Controllers ----------
export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email, password required" });
  }

  const exists = await User.findOne({ email }).lean();
  if (exists) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash });

  return res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: "email and password required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { sub: (user._id as Types.ObjectId).toString() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Optionally set a cookie as well as returning the token in JSON
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: JWT_COOKIE_MAX_AGE_MS, // <-- NUMBER, not string
  });

  return res.status(200).json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
};

export const me = async (req: Request, res: Response) => {
  // Assuming an auth middleware that sets req.userId from Bearer token
  const userId = (req as any).userId as string | undefined;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const user = await User.findById(userId).lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  return res.status(200).json({
    user: { id: user._id, name: user.name, email: user.email },
  });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("token");
  return res.status(200).json({ message: "Logged out" });
};
