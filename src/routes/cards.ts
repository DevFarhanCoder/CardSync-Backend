import { Router } from "express";
import {
  createCard,
  updateCard,
  getCardById,
  searchPublic,
  getPublicCards,
  shareCardLink,
} from "../controllers/cards.js";
import { requireAuth } from "../middlewares/auth.js";
import Card from "../models/Card.js";

const router = Router();

/** Owner CRUD */
router.post("/cards", requireAuth as any, createCard as any);
router.put("/cards/:id", requireAuth as any, updateCard as any);
router.get("/cards/:id", requireAuth as any, getCardById as any);
router.post("/cards/:id/share", requireAuth as any, shareCardLink as any);

/** Public endpoints */
router.get("/explore", searchPublic as any);
router.get("/public/profile/:owner/cards", getPublicCards as any);

/** Delete (kept inline for simplicity) */
router.delete("/cards/:id", requireAuth as any, async (req, res) => {
  try {
    const userId = (req as any).user?._id;
    const { id } = req.params;
    const doc = await Card.findOneAndDelete({ _id: id, ownerId: userId });
    if (!doc) return res.status(404).json({ error: "Card not found or not owned by you" });
    return res.json({ success: true, message: "Card deleted" });
  } catch (e) {
    console.error("Delete card error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
