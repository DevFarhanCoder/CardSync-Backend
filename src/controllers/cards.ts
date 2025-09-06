import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Card } from '../models/Card.js';


/** GET /api/cards */
export const listMyCards = async (req: Request & { userId?: string }, res: Response) => {
  const owner = req.userId as string;
  const docs = await Card.find({ userId: owner }).sort({ updatedAt: -1 }).lean();
  const out = docs.map((d: any) => ({
    id: String(d._id),
    title: d.title ?? "",
    visibility: d.visibility ?? "private",
    updatedAt: d.updatedAt,
  }));
  res.json({ cards: out });
};

/** GET /api/cards/:id */
export const getCard = async (req: Request & { userId?: string }, res: Response) => {
  const { id } = req.params;
  const owner = req.userId as string;
  const doc = await Card.findOne({ _id: id, userId: owner }).lean();
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ card: doc });
};

/** (alias for routes expecting getCardById) */
export const getCardById = getCard;

/** POST /api/cards */
export const createCard = async (req: Request & { userId?: string }, res: Response) => {
  const owner = req.userId as string;
  const payload = req.body as any;
  const doc = await Card.create({
    userId: new Types.ObjectId(owner),
    title: payload?.title ?? "",
    slug: payload?.slug ?? undefined,
    data: payload?.data ?? {},
    visibility: payload?.visibility ?? "private",
  });
  res.status(201).json({ card: doc });
};

/** PATCH /api/cards/:id */
export const updateCard = async (req: Request & { userId?: string }, res: Response) => {
  const { id } = req.params;
  const owner = req.userId as string;
  const payload = req.body as any;
  const doc = await Card.findOneAndUpdate(
    { _id: id, userId: owner },
    { $set: payload },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json({ card: doc });
};

/** DELETE /api/cards/:id */
export const removeCard = async (req: Request & { userId?: string }, res: Response) => {
  const { id } = req.params;
  const owner = req.userId as string;
  const done = await Card.findOneAndDelete({ _id: id, userId: owner });
  if (!done) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
};

/** GET /api/public/search?q=... */
export const searchPublic = async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  const filter: any = { visibility: { $in: ["public", "unlisted"] } };
  if (q) filter.title = { $regex: q, $options: "i" };

  const docs = await Card.find(filter).sort({ updatedAt: -1 }).limit(50).lean();
  const out = docs.map((d: any) => ({
    id: String(d._id),
    title: d.title ?? "",
    visibility: d.visibility ?? "public",
  }));
  res.json({ results: out });
};

/** POST /api/cards/:id/share  (optional helper if your route expects shareCardLink) */
export const shareCardLink = async (req: Request & { userId?: string }, res: Response) => {
  const { id } = req.params;
  const owner = (req as any).userId as string;

  const token = Math.random().toString(36).slice(2, 10);
  const doc = await Card.findOneAndUpdate(
    { _id: id, userId: owner },
    { $set: { shareToken: token, visibility: "unlisted" } },
    { new: true }
  ).lean();

  if (!doc) return res.status(404).json({ message: "Not found" });

  const base =
    (process.env.PUBLIC_WEB_BASE ||
     (process.env.FRONTEND_URL || "").split(",")[0] ||
     "https://instantlycards.com").replace(/\/+$/,"");

  const shareUrl = `${base}/share/${id}?t=${token}`;
  res.json({ shareToken: token, shareUrl });   // <-- shareUrl included
};


