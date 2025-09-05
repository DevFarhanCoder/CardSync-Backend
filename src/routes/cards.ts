import { Router } from "express";
import { createCard, updateCard, getCardById, shareCardLink } from "../controllers/cards.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

/**
 * Mounted at /api/cards in index.ts, so these resolve to:
 * POST   /api/cards
 * PUT    /api/cards/:id
 * GET    /api/cards/:id
 * POST   /api/cards/:id/share
 */
router.use(requireAuth);       // <— add this, controllers can rely on req.user

router.post("/", createCard);
router.put("/:id", updateCard);
router.get("/:id", getCardById);
router.post("/:id/share", shareCardLink);

export default router;
