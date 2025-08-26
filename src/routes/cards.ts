import { Router } from "express";
import { createCard, updateCard, getCardById, searchPublic, getPublicCards } from "../controllers/cards.js";
import { requireAuth } from "../middlewares/auth.js";
import Card from "../models/Card.js";   

const router = Router();

/** Owner CRUD */
router.post("/cards", requireAuth, createCard);
router.put("/cards/:id", requireAuth, updateCard);
router.get("/cards/:id", requireAuth, getCardById);

/** Public endpoints */
router.get("/explore", searchPublic);
router.get("/public/profile/:owner/cards", getPublicCards);

// src/routes/cards.ts
router.delete("/cards/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user?._id;
    const { id } = req.params;

    const card = await Card.findOneAndDelete({ _id: id, ownerId: userId });
    if (!card) return res.status(404).json({ error: "Card not found or not owned by you" });

    return res.json({ success: true, message: "Card deleted" });
  } catch (e) {
    console.error("Delete card error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
