import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/** Enable bypass whenever NODE_ENV !== 'production' OR DEV_ALLOW_ANON=true */
function devBypassEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.DEV_ALLOW_ANON === "true";
}

function setReqUser(req: Request, id: string, email?: string) {
  // Satisfy both shapes used across the codebase
  req.user = { id, _id: id, email };
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  // ✅ Strong dev bypass: allow all requests in dev even if a bad/expired token is sent
  if (devBypassEnabled()) {
    const fakeId = process.env.DEV_USER_ID || "000000000000000000000001";
    setReqUser(req, fakeId);
    return next();
  }

  // ---- Production: strict JWT only ----
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

    setReqUser(req, String(id), payload.email);
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export default requireAuth;   // default export
export { requireAuth };      // named export (so existing { requireAuth } imports keep working)
