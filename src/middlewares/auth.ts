// src/middlewares/requireAuth.ts
import type { RequestHandler } from "express";
import { verifyJwt } from "../utils/jwt.js";

const getSecret = () => process.env.JWT_SECRET || "";

const pickUserId = (p: any) => p?._id || p?.sub || p?.id || p?.userId || p?.uid;

const buildUser = (payload: any) => {
  const uid = String(pickUserId(payload) || "");
  return {
    id: uid,              // for routes using req.user.id
    _id: uid,             // for controllers using req.user._id
    email: payload?.email,
    role: payload?.role,
  };
};

const requireAuth: RequestHandler = (req, res, next) => {
  try {
    const JWT_SECRET = getSecret();
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfigured: JWT_SECRET is not set" });
    }

    let token: string | undefined;

    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) token = auth.slice(7).trim();
    if (!token && typeof req.headers["x-auth-token"] === "string") token = String(req.headers["x-auth-token"]);
    if (!token && (req as any).cookies?.token) token = (req as any).cookies.token;

    if (!token) return res.status(401).json({ message: "Unauthorized: no token" });

    // ✅ use our wrapper (works in ESM/CJS)
    const payload = verifyJwt<any>(token, JWT_SECRET);
    const user = buildUser(payload);

    if (!user.id) {
      return res.status(401).json({ message: "Unauthorized: token missing user id" });
    }

    (req as any).user = user;
    (req as any).userId = user.id;
    next();
  } catch (err: any) {
    return res.status(401).json({ message: "Unauthorized", detail: err?.message || "invalid token" });
  }
};

export default requireAuth;
export { requireAuth };
