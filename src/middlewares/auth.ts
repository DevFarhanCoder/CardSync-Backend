import type { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { env } from "../utils/env.js";

export interface AuthedRequest extends Request {
  userId?: string;
}

export default function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.userId = decoded?.sub as string;
    if (!req.userId) return res.status(401).json({ error: "Bad token" });

    next();
  } catch (_e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}