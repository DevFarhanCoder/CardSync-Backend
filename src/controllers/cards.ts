import type { Request, Response, RequestHandler } from "express";
import { Types } from "mongoose";
import { Card } from "../models/Card.js";
import { User } from "../models/User.js";
import { slugify } from "../utils/slug.js";

/** GET /api/cards */
export const listMyCards = async (req: Request & { userId?: string }, res: Response) => {
  const owner = req.userId as string;
  const docs = await Card.find({ userId: owner }).sort({ updatedAt: -1 }).lean();
  const out = docs.map((d: any) => ({
    id: String(d._id),
    title: d.title ?? "",
    visibility: d.visibility ?? "private",
    updatedAt: d.updatedAt,
    createdAt: d.createdAt,
    slug: d.slug ?? "",
    local: false,
  }));
  res.json({ items: out });
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
  if (!owner) return res.status(401).json({ message: "Unauthorized" });

  const payload = req.body as any;

  // Normalize title/slug
  const title = (payload?.title ?? "Card Title").toString().trim();
  const providedSlug = (payload?.slug ?? "").toString().trim();
  const base = providedSlug ? slugify(providedSlug) : slugify(title) || "card";

  // Ensure per-user uniqueness; bump -2, -3, ... if needed
  let slug = base;
  let n = 1;
  while (await Card.exists({ userId: owner, slug })) {
    n += 1;
    slug = `${base}-${n}`;
  }

  const doc = await Card.create({
    userId: new Types.ObjectId(owner),
    title,
    slug,
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

  const update: any = { ...payload };

  if (typeof payload?.title === "string" && payload.title.trim()) {
    const base = slugify(payload.title.trim()) || "card";
    let slug = base;
    let i = 1;
    while (await Card.exists({ userId: owner, slug, _id: { $ne: id } })) {
      i += 1;
      slug = `${base}-${i}`;
    }
    update.slug = slug;
  }

  const doc = await Card.findOneAndUpdate({ _id: id, userId: owner }, { $set: update }, { new: true });
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
  const items = docs.map(d => ({
    id: String(d._id),
    title: d.title ?? "",
    slug: d.slug ?? "",
  }));
  res.json({ items });
};

/** POST /api/cards/:id/share */
export const shareCardLink: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = (req as any).userId as string;

    const card = await Card.findOne({ _id: id, userId: owner });
    if (!card) return res.status(404).json({ message: "Not found" });

    // load user for handle/username if you expose public profiles
    const user = await User.findById(owner).lean();
    const base =
      (process.env.PUBLIC_BASE_URL || process.env.FRONTEND_URL || "").split(",")[0]?.trim() ||
      (process.env.CORS_ORIGIN || "").split(",")[0]?.trim() ||
      "";

    const slug = (card as any).slug || "card";
    const handle = (user as any)?.handle || "user";
    const shareUrl = `${base.replace(/\/+$/, "")}/${handle}/${slug}`;

    res.json({ shareUrl, shareToken: null });
  } catch (err) {
    console.error("shareCardLink error:", err);
    res.status(500).json({ message: "Internal error" });
  }
};
