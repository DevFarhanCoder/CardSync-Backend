import { Router } from "express";
import { getPublicCards } from "../controllers/cards.js";

const router = Router();

// /api/public/profile/:owner/cards
router.get("/profile/:owner/cards", getPublicCards);

export default router;
