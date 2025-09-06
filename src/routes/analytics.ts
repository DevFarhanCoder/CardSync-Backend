import { Router } from "express";
import requireAuth from "../middlewares/auth.js";
import { overview, topTitles } from "../controllers/analytics.js";

const router = Router();
router.get("/overview", requireAuth, overview);
router.get("/top-titles", requireAuth, topTitles);
export default router;
