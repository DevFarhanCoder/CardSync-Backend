import { Router } from "express";
import requireAuth from "../middlewares/auth.js";
import { getProfile, updateProfile } from "../controllers/profile.js";

const router = Router();

router.get("/me", requireAuth, getProfile);
router.patch("/", requireAuth, updateProfile);

export default router;
