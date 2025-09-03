import { Router } from "express";
import requireAuth from "../middlewares/auth.js";
import {
  createCard,
  updateCard,
  getCardById,
  shareCardLink,
} from "../controllers/cards.js";

const router = Router();

// Controller-based routes (single source of truth)
router.post("/cards", requireAuth, createCard);
router.put("/cards/:id", requireAuth, updateCard);
router.get("/cards/:id", requireAuth, getCardById);
router.post("/cards/:id/share", requireAuth, shareCardLink);

export default router;
