import { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { User, type UserDoc } from "../models/User.js";

const PROD = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || ".instantllycards.com"; // or leave undefined for pure same-origin
const COOKIE_MAX = Number(process.env.JWT_COOKIE_MAX_AGE_MS || 7 * 24 * 3600 * 1000);
const JWT_SECRET = (process.env.JWT_SECRET || "") as Secret;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: PROD,
    sameSite: "lax",       // use "none" ONLY if truly cross-site
    domain: COOKIE_DOMAIN, // omit if you don’t need apex+www coverage
    path: "/",
    maxAge: COOKIE_MAX,
  });
}

function toPublicUser(u: Pick<UserDoc, "_id" | "email"> & Partial<UserDoc>) {
  return {
    id: String(u._id),
    email: u.email,
    name: u.name ?? "",
    phone: u.phone ?? "",
    about: u.about ?? "",
    avatarUrl: u.avatarUrl ?? "",
  };
}

/** POST /api/auth/register */
export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });

  const exists = await User.findOne({ email }).lean();
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: hash,        // <-- field name is `password` (not passwordHash)
    name: name ?? "",      // <-- use `name` (not fullName)
  });

  const token = jwt.sign({ sub: String(user._id) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  setAuthCookie(res, token);
  return res.status(201).json(toPublicUser(user as unknown as UserDoc));
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });

  const user = await User.findOne({ email }).select("+password").exec();
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, (user as UserDoc).password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ sub: String(user._id) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  setAuthCookie(res, token);
  return res.json(toPublicUser(user as unknown as UserDoc));
}

/** POST /api/auth/logout */
export async function logout(_req: Request, res: Response) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: PROD,
    sameSite: "lax",
    domain: COOKIE_DOMAIN,
    path: "/",
  });
  return res.json({ ok: true });
}

/** GET /api/auth/me */
export async function me(req: Request, res: Response) {
  const u = await User.findById((req as any).userId).lean();
  if (!u) return res.status(404).json({ message: "User not found" });
  return res.json(toPublicUser(u as unknown as UserDoc));
}
