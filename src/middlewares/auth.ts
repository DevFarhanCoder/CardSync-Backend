import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_change_me";

export type Authed = Request & { user?: { _id: string; email?: string } };

export function requireAuth(req: Authed, res: Response, next: NextFunction) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, JWT_SECRET) as { _id: string; email?: string };
    if (!payload?._id) return res.status(401).json({ message: "Unauthorized" });

    req.user = { _id: String(payload._id), email: payload.email };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
