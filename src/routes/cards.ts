import { Router } from "express";
import { createCard, updateCard, getCardById, shareCardLink } from "../controllers/cards.js";
// Auth is already applied in index.ts at mount time; don't re-apply here unless you prefer both.
const router = Router();

/**
 * Mounted at /api/cards in index.ts, so these resolve to:
 * POST   /api/cards
 * PUT    /api/cards/:id
 * GET    /api/cards/:id
 * POST   /api/cards/:id/share
 */
router.post("/", createCard);
router.put("/:id", updateCard);
router.get("/:id", getCardById);
router.post("/:id/share", shareCardLink);

export default router;
