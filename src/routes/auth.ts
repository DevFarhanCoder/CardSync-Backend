// src/routes/auth.ts
import { Router } from "express";
import { login, register, me } from "../controllers/auth.js";
import requireAuth from "../middlewares/auth.js";

const router = Router();

/** Public */
router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);


/** Private */
router.get("/me", requireAuth, me);


export default router;
