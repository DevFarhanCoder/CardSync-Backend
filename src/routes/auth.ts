import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js"; // named export

const router = Router();

/** Issue cookie options suitable for HTTPS/Render */
function cookieOpts() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
  };
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Looks up user by email and validates passwordHash if present.
 * If you don’t store password hashes, this still compiles and you can
 * adapt the check as needed.
 */
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email is required" });

    const u = await User.findOne({ email });
    if (!u) return res.status(401).json({ message: "Invalid email or password" });

    // If you store password hashes in u.passwordHash:
    if (u.passwordHash) {
      const ok = await bcrypt.compare(password || "", u.passwordHash);
      if (!ok) return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = { id: String(u._id), email: u.email, name: u.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "7d" });

    res.cookie("token", token, cookieOpts());
    res.json({ ok: true, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/** POST /api/auth/logout */
router.post("/auth/logout", (req, res) => {
  res.clearCookie("token", cookieOpts());
  res.json({ ok: true });
});

export default router;
