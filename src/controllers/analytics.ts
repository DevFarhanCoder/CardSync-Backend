// src/controllers/analytics.ts
import type { Request, Response } from "express";
import { Card } from "../models/card.js";

/** GET /api/analytics/overview */
export const overview = async (req: Request & { userId?: string }, res: Response) => {
  const owner = req.userId as string;
  const total = await Card.countDocuments({ userId: owner });
  const byVis = await Card.aggregate([
    { $match: { userId: (req as any).userId } },
    { $group: { _id: "$visibility", count: { $sum: 1 } } },
  ]);

  const visibility = byVis.reduce((acc: any, r: any) => {
    acc[r._id || "unknown"] = r.count;
    return acc;
  }, {});

  res.json({ total, visibility });
};

/** GET /api/analytics/top-titles */
export const topTitles = async (req: Request & { userId?: string }, res: Response) => {
  const owner = req.userId as string;
  const docs = await Card.find({ userId: owner }).sort({ updatedAt: -1 }).limit(10).lean();
  const out = docs.map((d: any) => ({ id: String(d._id), title: d.title ?? "" }));
  res.json({ items: out });
};
