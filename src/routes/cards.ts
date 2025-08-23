// src/routes/cards.ts
import { Router } from "express";
import {
  createCard,
  listCards,
  getOneCard,
  updateCard,
  deleteCard,
  publishPublic,
  unpublish,
  incrementView,
  searchPublic,
} from "../controllers/cards.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// PUBLIC
router.get("/search", searchPublic);

// AUTHED
router.use(requireAuth);
router.get("/", listCards);
router.get("/:id", getOneCard);
router.post("/", createCard);
router.patch("/:id", updateCard);
router.delete("/:id", deleteCard);
router.post("/publish/:id?", publishPublic);
router.post("/unpublish/:id?", unpublish);
router.post("/:id/view", incrementView);

export default router;
