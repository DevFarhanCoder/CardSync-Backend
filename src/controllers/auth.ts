import { Request, Response } from "express";
import { User } from "../models/User";
import { hashPassword, comparePassword } from "../utils/hash";
import { signJwt } from "../utils/jwt";

function signToken(userId: string) {
  const secret = process.env.JWT_SECRET!;
  return signJwt({ sub: userId }, secret, { expiresIn: "30d" });
}

export async function register(req: Request, res: Response) {
  try {
    const { fullName, email, password } = (req.body || {}) as {
      fullName?: string; email?: string; password?: string;
    };
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "fullName, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const passwordHash = await hashPassword(password);
    const user = await User.create({ fullName, name: fullName, email, passwordHash });

    const token = signToken(user.id);
    return res.status(201).json({
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email },
    });
  } catch (e) {
    console.error("register error:", e);
    return res.status(500).json({ error: "Internal error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = (req.body || {}) as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    // ✅ compare to the hash column
    const ok = await comparePassword(password, (user as any).passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = signToken(user.id);
    return res.json({
      token,
      user: { id: user.id, fullName: (user as any).fullName ?? (user as any).name, email: user.email },
    });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ error: "Internal error" });
  }
}

/** Optional: GET /api/auth/me */
export async function me(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(userId).select("_id fullName name email");
    if (!user) return res.status(404).json({ error: "Not found" });

    return res.json({
      id: user.id,
      fullName: (user as any).fullName ?? (user as any).name ?? "",
      email: user.email,
    });
  } catch (e) {
    console.error("me error:", e);
    return res.status(500).json({ error: "Internal error" });
  }
}
