import { Router } from "express";
import requireAuth from "../middlewares/auth";
import { getProfile, updateProfile } from "../controllers/profile";

const router = Router();

router.get("/me", requireAuth, getProfile);
router.patch("/", requireAuth, updateProfile);

export default router;
