// src/routes/auth.ts
import { Router } from "express";
import { register, login, me, logout } from "../controllers/auth.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", me);
authRouter.post("/logout", logout);

export default authRouter;
export { authRouter };
