import { Request, Response } from "express";
import mongoose from "mongoose";
import Card from "../models/Card.js";

/** POST /api/analytics/card/:id/increment { event: 'view'|'click'|'share'|'save' } */
export async function incrementCardMetric(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { event } = req.body as { event: "view" | "click" | "share" | "save" };

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });
    if (!["view", "click", "share", "save"].includes(event)) {
      return res.status(400).json({ message: "Invalid event" });
    }

    const field = `analytics.${event}s`; // views/clicks/shares/saves
    const doc = await Card.findByIdAndUpdate(
      id,
      { $inc: { [field]: 1 } },
      { new: true, lean: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });

    return res.json({ analytics: (doc as any).analytics });
  } catch (err) {
    console.error("incrementCardMetric error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/analytics/card/:id  (protected by ensureCardOwner) */
export async function getCardAnalytics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });

    const doc = await Card.findById(id).select("analytics").lean();
    if (!doc) return res.status(404).json({ message: "Not found" });

    return res.json({ analytics: (doc as any).analytics });
  } catch (err) {
    console.error("getCardAnalytics error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export const overview = async (_req: Request, res: Response) => {
  return res.json({
    cards: 0,
    views: 0,
    clicks: 0,
    shares: 0,
    saves: 0,
  });
};

// Also provide a default that contains the handler,
// so both default and named imports work.
export default { overview };