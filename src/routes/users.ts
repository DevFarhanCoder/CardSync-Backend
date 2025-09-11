import { Router, type Request, type Response } from "express";
import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import requireAuth from "../middlewares/auth.js";
import { User, type UserDoc } from "../models/User.js";

const router = Router();

const PROD = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || ".instantllycards.com"; // or leave undefined
const COOKIE_MAX = Number(process.env.JWT_COOKIE_MAX_AGE_MS || 7 * 24 * 3600 * 1000);
const JWT_SECRET = (process.env.JWT_SECRET || "") as Secret;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: PROD,      // true on HTTPS
    sameSite: "lax",   // use "none" only if you're truly cross-site
    domain: COOKIE_DOMAIN, // omit for same-origin if you want
    path: "/",
    maxAge: COOKIE_MAX,
  });
}

/** POST /api/users/login */
router.post("/users/login", async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  // select password explicitly
  const user = await User.findOne({ email }).select("+password").exec();
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, (user as UserDoc).password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ sub: String(user._id) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  setAuthCookie(res, token);
  return res.json({ ok: true });
});

/** POST /api/users/logout */
router.post("/users/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: PROD,
    sameSite: "lax",
    domain: COOKIE_DOMAIN,
    path: "/",
  });
  return res.json({ ok: true });
});

/** GET /api/users/me */
router.get("/users/me", requireAuth, async (req: Request, res: Response) => {
  const user = await User.findById((req as any).userId).lean();
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  // `lean()` returns plain object; use optional chaining
  return res.json({
    id: String(user._id),
    email: (user as any).email,
    name: (user as any).name ?? "",
    phone: (user as any).phone ?? "",
    about: (user as any).about ?? "",
    avatarUrl: (user as any).avatarUrl ?? "",
  });
});

/** PATCH /api/users/me */
router.patch("/users/me", requireAuth, async (req: Request, res: Response) => {
  const { name, phone, about, avatarUrl } = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (phone !== undefined) update.phone = phone;
  if (about !== undefined) update.about = about;
  if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;

  const user = await User.findByIdAndUpdate((req as any).userId, update, { new: true }).lean();
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  return res.json({
    id: String(user._id),
    email: (user as any).email,
    name: (user as any).name ?? "",
    phone: (user as any).phone ?? "",
    about: (user as any).about ?? "",
    avatarUrl: (user as any).avatarUrl ?? "",
  });
});

export default router;
