// src/controllers/auth.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function signToken(user: { _id: string; email: string }) {
  return jwt.sign({ _id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

/** POST /api/auth/login  Body: { email, password } */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ _id: user._id.toString(), email: user.email });
    return res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        headline: user.headline,
        company: user.company,
        location: user.location,
        defaultCardId: user.defaultCardId,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** POST /api/auth/register  Body: { name, email, password }  (dev seeding) */
export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, password required" });
    }

    const normalized = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalized });
    if (existing) return res.status(409).json({ message: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: normalized, passwordHash });

    const token = signToken({ _id: user._id.toString(), email: user.email });
    return res.status(201).json({
      token,
      user: { _id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
