import { Router } from "express";
import analyticsRoutes from "./analytics.js";
import authRoutes from "./auth.js";
import cardsRoutes from "./cards.js";
import exploreRoutes from "./explore.js";
import healthRoutes from "./health.js";
import profileRoutes from "./profile.js";
import publicRoutes from "./public.js";
import chatRoutes from "./chat.js";
import groupRoutes from "./groups.js";

const router = Router();
router.get("/health", (_req, res) => res.json({ ok: true }));
router.use("/health", healthRoutes);
router.use("/", analyticsRoutes);
router.use("/auth", authRoutes);
router.use("/", cardsRoutes);
router.use("/explore", exploreRoutes);
router.use("/profile", profileRoutes);
router.use("/public", publicRoutes);
router.use("/chat", chatRoutes);
router.use("/", groupRoutes); 

export default router;