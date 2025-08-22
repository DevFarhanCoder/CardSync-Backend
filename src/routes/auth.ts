import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions, type Secret, type StringValue } from "jsonwebtoken";
import { User } from "../models/User"; // <-- note the ../ path (we're inside routes/)

const router = Router();

function signToken(id: string) {
  const secret = (process.env.JWT_SECRET ?? "devsecret") as Secret;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as StringValue; // <-- key change
  const opts: SignOptions = { expiresIn };
  return jwt.sign({ id }, secret, opts);
}

// POST /v1/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body as {
      name?: string; email?: string; password?: string;
    };

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    const token = signToken(String(user._id));
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(400).json({ error: "Email already registered" });
    }
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /v1/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = signToken(String(user._id));
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
