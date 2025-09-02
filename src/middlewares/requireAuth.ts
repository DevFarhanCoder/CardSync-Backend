import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function devBypassEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.DEV_ALLOW_ANON === "true";
}

function setReqUser(req: Request, id: string, email?: string) {
  req.user = { id, _id: id, email };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (devBypassEnabled()) {
    const fakeId = process.env.DEV_USER_ID || "000000000000000000000001";
    setReqUser(req, fakeId);
    return next();
  }

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "changeme") as
      | { userId?: string; id?: string; sub?: string; email?: string }
      | string;

    if (typeof payload === "string") return res.status(401).json({ error: "Invalid token" });

    const id = payload.userId || payload.id || payload.sub;
    if (!id) return res.status(401).json({ error: "Invalid token" });

    setReqUser(req, String(id), payload.email);
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export default requireAuth;
