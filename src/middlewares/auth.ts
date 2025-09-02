// src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import requireAuth from "./requireAuth";

function devBypassEnabled() {
  // enable when NODE_ENV !== 'production' OR explicitly opted-in
  return process.env.NODE_ENV !== "production" || process.env.DEV_ALLOW_ANON === "true";
}

function auth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  // In development, always allow through and synthesize a user
  if (devBypassEnabled()) {
    const fakeId = process.env.DEV_USER_ID || "000000000000000000000001";
    req.user = { id: fakeId, _id: fakeId, email: undefined };
    return next();
  }

  // Production: require a real token
  if (!token || token === "undefined" || token === "null") {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "changeme") as
      | { userId?: string; id?: string; sub?: string; email?: string }
      | string;

    if (typeof payload === "string") {
      return res.status(401).json({ error: "Invalid token" });
    }

    const id = payload.userId || payload.id || payload.sub;
    if (!id) return res.status(401).json({ error: "Invalid token" });

    // Put both shapes on req.user to satisfy all routes
    req.user = { id: String(id), _id: String(id), email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export default auth;
export { auth };