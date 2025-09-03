// src/routes/cards.ts
import { Router } from "express";
import requireAuth from "../middlewares/auth.js";
import { createCard, updateCard, getCardById, shareCardLink } from "../controllers/cards.js";

const router = Router();

router.post("/cards", requireAuth, createCard);
router.put("/cards/:id", requireAuth, updateCard);
router.get("/cards/:id", requireAuth, getCardById);
router.post("/cards/:id/share", requireAuth, shareCardLink);

export default router;
