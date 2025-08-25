import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Card from "../models/Card.js";

/** Ensures the authenticated user owns the card in :id */
export async function ensureCardOwner(
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
) {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid id" });
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const doc = await Card.findById(id).select("owner").lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (String(doc.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  } catch (e) {
    next(e);
  }
}
