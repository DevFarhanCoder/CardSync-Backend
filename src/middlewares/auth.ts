// src/middlewares/auth.ts
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const getSecret = () => process.env.JWT_SECRET || "";

export const requireAuth: RequestHandler = (req, res, next) => {
  try {
    const JWT_SECRET = getSecret();
    if (!JWT_SECRET) {
      // Don’t crash the server; return 500 so the problem is visible
      return res.status(500).json({ message: "Server misconfigured: JWT_SECRET is not set" });
    }

    let token: string | undefined;
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) token = auth.slice(7).trim();
    if (!token && typeof req.headers["x-auth-token"] === "string") token = String(req.headers["x-auth-token"]);
    if (!token && (req as any).cookies?.token) token = (req as any).cookies.token;

    if (!token) return res.status(401).json({ message: "Unauthorized: no token" });

    const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload._id || payload.sub || payload.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized: token missing user id" });

    (req as any).user = { _id: String(userId), email: payload.email, role: payload.role };
    next();
  } catch (err: any) {
    return res.status(401).json({ message: "Unauthorized", detail: err?.message || "invalid token" });
  }
};

export default requireAuth;
