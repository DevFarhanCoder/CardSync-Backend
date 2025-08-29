// src/middlewares/ensureOwner.ts
import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import Card from "../models/Card.js"; // adjust path only if your models folder differs

/**
 * Ensures the authenticated user owns the card being accessed.
 * Looks up `:id` param first, then body/query fallbacks.
 * Requires a previous auth middleware that sets `req.user`.
 */
export default async function ensureOwner(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const cardId =
      (req.params && req.params.id) ||
      (req.body && (req.body.cardId || req.body.id)) ||
      (req.query && (req.query.cardId as string) || (req.query.id as string));

    if (!cardId) {
      return res.status(400).json({ error: "Card id is required" });
    }

    // Only fetch what we need
    const card = await Card.findById(cardId).select("_id ownerId");
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // user id from auth middleware
    const userId =
      (req as any).user?.id ||
      (req as any).user?._id?.toString() ||
      (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Compare ObjectId safely
    const isOwner =
      (card as any).ownerId instanceof Types.ObjectId
        ? (card as any).ownerId.equals(userId)
        : String((card as any).ownerId) === String(userId);

    if (!isOwner) {
      return res.status(403).json({ error: "Forbidden: not your card" });
    }

    // make the card available downstream if needed
    (req as any).card = card;
    return next();
  } catch (err) {
    console.error("ensureOwner error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
