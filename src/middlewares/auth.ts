import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function setReqUser(req: Request, id: string, email?: string) {
  (req as any).user = { id, _id: id, email };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;


  if ((process.env.NODE_ENV !== "production" || process.env.DEV_ALLOW_ANON === "true") && !token) {
    setReqUser(req, "000000000000000000000000", "dev@example.com");
    return next();
  }

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    // MUST match the secret used when signing in your login route
    const secret = process.env.JWT_SECRET || "dev-secret";

    const payload = jwt.verify(token, secret) as any;
    const uid = String(payload.sub ?? payload.id ?? payload.userId ?? payload._id ?? "");
    if (!uid) return res.status(401).json({ error: "Invalid token" });
    (req as any).user = { id: uid, email: payload.email };
    setReqUser(req, uid, payload.email);
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// Export as both default and named to be import-style agnostic
export default requireAuth;
