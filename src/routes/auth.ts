// src/routes/auth.ts
import { Router } from "express";
import { login, register, me } from "../controllers/auth.js";
import requireAuth from "../middlewares/auth.js";

const router = Router();

const cookieOpts = {
  httpOnly: true,
  secure: true,            // required on https
  sameSite: "none" as const, // cross-site safe; also fine for same-origin
  path: "/",               // send on every request
  // domain: ".instantllycards.com", // optional; omit for same-origin cookie
  maxAge: 30 * 24 * 60 * 60 * 1000,
};
res.cookie("token", jwt, cookieOpts);
res.json({ ok: true });

/** Public */
router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);


/** Private */
router.get("/me", requireAuth, me);


export default router;
