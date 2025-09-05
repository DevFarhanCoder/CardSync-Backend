import type { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { User, UserDoc } from "../models/user";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set");
}

function signToken(userId: string) {
  const opts: jwt.SignOptions = { expiresIn: JWT_EXPIRES_IN };
  return jwt.sign({ sub: userId }, JWT_SECRET as jwt.Secret, opts);
}

function toPublicUser(u: UserDoc) {
  return {
    _id: u._id,
    email: u.email,
    name: u.name ?? "",
    createdAt: (u as any).createdAt,
    updatedAt: (u as any).updatedAt,
  };
}

/** POST /api/auth/register */
export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body as { email: string; password: string; name?: string };
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: "Email already in use" });

  const user = await User.create({ email, password, name });
  const token = signToken(String(user._id));
  return res.status(201).json({ token, user: toPublicUser(user as UserDoc) });
};

/** POST /api/auth/login */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  const user = await User.findOne({ email }).select("+password");
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const ok = await (user as UserDoc).comparePassword(password);
  if (!ok) return res.status(400).json({ message: "Invalid credentials" });

  const token = signToken(String(user._id));
  return res.json({ token, user: toPublicUser(user as UserDoc) });
};

/** GET /api/auth/me */
export const me = async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user: toPublicUser(user as UserDoc) });
};
