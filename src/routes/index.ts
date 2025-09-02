import { Router } from "express";

// IMPORTANT for ESM at runtime: include ".js" in TS import specifiers
// so the compiled JS keeps the extension and Node can resolve them.

import analyticsRoutes from "./analytics.js";
import authRoutes from "./auth.js";
import cardsRoutes from "./cards.js";
import exploreRoutes from "./explore.js";
import healthRoutes from "./health.js";
import profileRoutes from "./profile.js";
import publicRoutes from "./public.js";
import chatRoutes from "./chat.js";

const router = Router();

router.use("/analytics", analyticsRoutes);
router.use("/auth", authRoutes);
router.use("/cards", cardsRoutes);
router.use("/explore", exploreRoutes);
router.use("/health", healthRoutes);
router.use("/profile", profileRoutes);
router.use("/public", publicRoutes);
router.use("/chat", chatRoutes);

export default router;
