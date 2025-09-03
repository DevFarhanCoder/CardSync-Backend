// src/middlewares/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

interface TokenPayload {
  sub?: string;
  id?: string;
  userId?: string;
  _id?: string;
  email?: string;
  // ...any other claims you put in the token
}

export default function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // normalize to a definite string id; if not present, reject
    const uid =
      payload.sub || payload.id || payload.userId || payload._id || "";

    if (!uid) return res.status(401).json({ message: "Unauthorized" });

    req.user = { _id: String(uid), email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
