// src/routes/auth.ts
import { Router } from "express";
import { register, login, me, logout } from "../controllers/auth.js";

const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", register);

// POST /api/auth/login
authRouter.post("/login", login);

// GET /api/auth/me
authRouter.get("/me", me);

// POST /api/auth/logout
authRouter.post("/logout", logout);

export default authRouter;
export { authRouter };
