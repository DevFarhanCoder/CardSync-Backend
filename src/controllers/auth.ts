import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_change_me";
const JWT_EXPIRES_IN = "30d";
const normalizeEmail = (s: string) => String(s || "").trim().toLowerCase();

export async function signup(req: Request, res: Response) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const name = String(req.body?.name || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const exists = await User.findOne({ email }).lean();
    if (exists) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, passwordHash });

    const token = jwt.sign({ _id: String(user._id), email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.status(201).json({ token, user: { _id: String(user._id), email, name } });
  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await (User as any)
      .findOne({ email })
      .select("+passwordHash name email")
      .lean(false);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ _id: String(user._id), email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ token, user: { _id: String(user._id), email: user.email, name: user.name || "" } });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
