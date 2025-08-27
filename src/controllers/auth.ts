// src/controllers/auth.ts
import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import User from "../models/User.js";

// --- JWT config (typed for jsonwebtoken v9)
const JWT_SECRET: Secret = (process.env.JWT_SECRET || "dev_change_me") as Secret;
const JWT_EXPIRES_IN: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN || "30d") as SignOptions["expiresIn"];

const normalizeEmail = (s: string) => String(s || "").trim().toLowerCase();

/**
 * POST /api/auth/signup
 * body: { email, password, name? }
 */
export async function signup(req: Request, res: Response) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const name = String(req.body?.name || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, passwordHash });

    const token = jwt.sign(
      { _id: String(user._id), email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      token,
      user: { _id: String(user._id), email, name },
    });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * POST /api/auth/login
 * body: { email, password }
 */
export async function login(req: Request, res: Response, _next: NextFunction) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email })
      .select("+passwordHash")
      .select("name email")
      .exec();

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { _id: String(user._id), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: {
        _id: String(user._id),
        email: user.email,
        name: user.name || "",
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
