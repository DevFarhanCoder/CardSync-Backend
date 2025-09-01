import { Router } from "express";
import analyticsRoutes from "./analytics";
import authRoutes from "./auth";
import cardsRoutes from "./cards";
import exploreRoutes from "./explore";
import healthRoutes from "./health";
import profileRoutes from "./profile";
import publicRoutes from "./public";

import chatRoutes from "./chat";   // ✅ default import

const router = Router();

router.use("/analytics", analyticsRoutes);
router.use("/auth", authRoutes);
router.use("/cards", cardsRoutes);
router.use("/explore", exploreRoutes);
router.use("/health", healthRoutes);
router.use("/profile", profileRoutes);
router.use("/public", publicRoutes);

router.use("/chat", chatRoutes);   // ✅ no longer undefined

export default router;
