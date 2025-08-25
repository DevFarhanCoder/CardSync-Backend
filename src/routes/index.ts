import { Router } from "express";
import cardsRouter from "./cards.js";
import authRouter from "./auth.js";
import analyticsRouter from "./analytics.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/analytics", analyticsRouter);

// Cards + explore + public profile
router.use("/", cardsRouter);

export default router;
