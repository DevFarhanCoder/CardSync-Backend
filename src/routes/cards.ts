import { Router } from "express";
import { createCard, updateCard, getCardById, searchPublic, getPublicCards } from "../controllers/cards.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

/** Owner CRUD */
router.post("/cards", requireAuth, createCard);
router.put("/cards/:id", requireAuth, updateCard);
router.get("/cards/:id", requireAuth, getCardById);

/** Public endpoints */
router.get("/explore", searchPublic);
router.get("/public/profile/:owner/cards", getPublicCards);

export default router;
