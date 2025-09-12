import type { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { env } from "../utils/env.js";
import { setAuthCookie, clearAuthCookie } from "../utils/cookies.js";

function signToken(userId: string) {
  const opts: jwt.SignOptions = { expiresIn: env.JWT_EXPIRES_IN };
  return jwt.sign({ sub: userId }, env.JWT_SECRET, opts);
}

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email & password required" });

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, name });

  const token = signToken(String(user._id));
  setAuthCookie(res, token);
  return res.json({ id: String(user._id), email: user.email, name: user.name || "" });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email & password required" });

  const user = await User.findOne({ email }).select("+passwordHash").exec();
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(String(user._id));
  setAuthCookie(res, token);
  return res.json({ id: String(user._id), email: user.email, name: user.name || "" });
};

export const logout = async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
};