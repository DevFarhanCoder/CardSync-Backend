// src/controllers/auth.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

/* ----------------------------- Validation ----------------------------- */

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/* --------------------------- Token Utilities -------------------------- */

function signToken(userId: string, email: string) {
  // Ensure a concrete Secret so TS picks the correct jwt.sign overload
  const secret: Secret =
    (env.jwtSecret as unknown as Secret) || (process.env.JWT_SECRET as Secret);

  if (!secret || (typeof secret === "string" && secret.length === 0)) {
    throw new Error("Missing JWT secret");
  }

  // jsonwebtoken expects string | number here
  const expiresIn = (env.jwtExpiresIn ?? "7d") as string | number;

  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn,
  };

  // Use standard "sub" (subject) claim
  const payload = { sub: userId, email };
  return jwt.sign(payload, secret, options);
}

/* -------------------------------- Routes ------------------------------ */

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    const token = signToken(user.id, user.email);
    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: err.errors[0]?.message || "Invalid input" });
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user.id, user.email);
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: err.errors[0]?.message || "Invalid input" });
    }
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    // Auth middleware should attach req.user = { id, email }
    const authUser = (req as any).user as
      | { id: string; email: string }
      | undefined;
    if (!authUser) return res.status(401).json({ error: "Unauthenticated" });

    const user = await User.findById(authUser.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    next(err);
  }
}
