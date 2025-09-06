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
import sharesRoutes from "./shares.js";
import contactsRoutes from "./contacts.js";
import chatCompatRoutes from "./chatCompat.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));
router.use("/health", healthRoutes);

router.use("/", analyticsRoutes);
router.use("/auth", authRoutes);

/* ⬇️ This was `"/"` — change to `"/cards"` so endpoints become /api/cards */
router.use("/cards", cardsRoutes);

router.use("/explore", exploreRoutes);
router.use("/profile", profileRoutes);
router.use("/", publicRoutes);
router.use("/", chatRoutes);
router.use("/", groupRoutes);
router.use("/", sharesRoutes);
router.use("/", contactsRoutes);
router.use("/", chatCompatRoutes); 

export default router;
