// src/controllers/auth.ts
import type { RequestHandler } from "express";
import * as jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User, UserDoc } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

if (!JWT_SECRET) {
  // Don’t throw—return a 500 during requests instead.
  console.error("❌ JWT_SECRET is not set");
}

function toPublicUser(u: UserDoc) {
  return { id: String(u._id), email: u.email, name: u.name || "" };
}

function signToken(userId: string) {
  // include both sub and id for middleware compatibility
  const payload = { sub: userId, id: userId };
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, { expiresIn: JWT_EXPIRES_IN });
}

/** POST /api/auth/register */
export const register: RequestHandler = async (req, res) => {
  try {
    const { name = "", email = "", password = "" } = (req.body || {}) as {
      name?: string; email?: string; password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const lcEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: lcEmail }).lean();
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: lcEmail,
      password: hash,
      name: name.trim() || undefined,
    });

    if (!JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfigured" });
    }

    const token = signToken(String(user._id));
    return res.json({ token, user: toPublicUser(user as UserDoc) });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Internal error" });
  }
};

/** POST /api/auth/login */
export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = (req.body || {}) as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const lcEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: lcEmail }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await (user as UserDoc).comparePassword(password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    if (!JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfigured" });
    }

    const token = signToken(String(user._id));
    return res.json({ token, user: toPublicUser(user as UserDoc) });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Internal error" });
  }
};

/** GET /api/auth/me */
export const me: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id || (req as any).user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user: toPublicUser(user as UserDoc) });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ message: "Internal error" });
  }
};
