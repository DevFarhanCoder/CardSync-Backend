import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";

// ⬅️ adjust this import if your User model path/name differs
import { User } from "../models/user.js";

// --- Helpers & env ---
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

// `jsonwebtoken` allows `expiresIn` to be a string like "7d" or a number (seconds).
type JwtExpires = NonNullable<jwt.SignOptions["expiresIn"]>;

// Allow both "7d" style and seconds as number. Default to "7d".
const JWT_EXPIRES_IN: JwtExpires =
  (process.env.JWT_EXPIRES_IN as JwtExpires) ?? "7d";

// Cookies require milliseconds as a NUMBER
const JWT_COOKIE_MAX_AGE_MS: number = Number(
  process.env.JWT_COOKIE_MAX_AGE_MS ?? 7 * 24 * 60 * 60 * 1000 // 7 days
);

// --- Controllers ---
export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email, password required" });
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash });

  return res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { sub: (user._id as Types.ObjectId).toString() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // send as cookie (optional) + in body
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
  // assumes you set `req.userId` in an auth middleware from the Bearer token
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
