import { Router } from "express";
import requireAuth from "../middlewares/auth.js";
import { me, updateMe } from "../controllers/users.js";

const router = Router();
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateMe);

export default router;