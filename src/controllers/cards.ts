import type { Request, Response } from "express";
import mongoose from "mongoose";
import Card, { ICard } from "../models/Card.js";

/** If auth middleware adds req.user */
type AuthedRequest = Request & { user?: { _id: string; email?: string } };

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ||
  process.env.PUBLIC_APP_ORIGIN ||
  "http://localhost:3000";

function slugify(s: string) {
  const base = (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base || "card"}-${rand}`;
}

function tokensFrom(title?: string, list: string[] = []) {
  const out = new Set<string>();
  const t = (title || "").toLowerCase().trim();
  if (t) {
    const parts = t.split(/\s+/).filter(Boolean);
    for (const p of parts) {
      for (let i = 1; i <= Math.min(p.length, 20); i++) out.add(p.slice(0, i));
      out.add(p);
    }
  }
  (list || [])
    .map((x) => (x || "").toLowerCase().trim())
    .filter(Boolean)
    .forEach((x) => out.add(x));
  return Array.from(out);
}

function sanitize(doc: ICard) {
  const json = doc.toObject({ getters: true, virtuals: false });
  delete json.__v;
  return {
    _id: String(json._id),
    title: json.title,
    slug: json.slug,
    theme: json.theme,
    isPublic: !!json.isPublic,
    ownerId: String(json.ownerId),
    data: json.data || {},
    keywords: json.keywords || [],
    tags: json.tags || [],
    analytics: json.analytics || { views: 0, clicks: 0, shares: 0, saves: 0 },
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
  };
}

/** POST /api/cards  (protected) */
export async function createCard(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      title = "Untitled",
      theme = "luxe",
      data = {},
      keywords = [],
      tags = [],
      isPublic = false,
    } = (req.body || {}) as Partial<ICard> & { data?: any };

    const slug = slugify(String(title));
    const doc = await Card.create({
      title,
      slug,
      ownerId: new mongoose.Types.ObjectId(String(userId)),
      theme,
      isPublic: !!isPublic,
      data, // ← includes extra.personal / extra.company from the new form
      keywords: tokensFrom(title, keywords as string[]),
      tags,
    });

    return res.status(201).json({ card: sanitize(doc) });
  } catch (err) {
    console.error("createCard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** PUT /api/cards/:id  (protected) */
export async function updateCard(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });

    const body = req.body || {};
    const update: any = {};
    if (typeof body.title === "string") {
      update.title = body.title;
      update.keywords = tokensFrom(body.title, body.keywords || []);
    }
    if (typeof body.theme === "string") update.theme = body.theme;
    if (typeof body.isPublic === "boolean") update.isPublic = body.isPublic;
    if (body.data && typeof body.data === "object") update.data = body.data;
    if (Array.isArray(body.tags)) update.tags = body.tags;

    const doc = await Card.findOneAndUpdate(
      { _id: id, ownerId: userId },
      { $set: update },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });

    return res.json({ card: sanitize(doc) });
  } catch (err) {
    console.error("updateCard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/cards/:id  (protected) */
export async function getCardById(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });

    const doc = await Card.findOne({ _id: id, ownerId: userId });
    if (!doc) return res.status(404).json({ message: "Not found" });

    return res.json({ card: sanitize(doc) });
  } catch (err) {
    console.error("getCardById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** POST /api/cards/:id/share  (protected) -> returns a public share URL */
export async function shareCardLink(req: AuthedRequest, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });

    const doc = await Card.findOneAndUpdate(
      { _id: id, ownerId: userId },
      { $set: { isPublic: true } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });

    // Match the frontend route you already use
    const shareUrl = `${FRONTEND_ORIGIN}/share/${id}`;

    return res.json({ shareUrl, card: sanitize(doc) });
  } catch (err) {
    console.error("shareCardLink error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/explore?q=...  (public) */
export async function searchPublic(req: Request, res: Response) {
  try {
    const q = String((req.query.q as string) || "").trim();
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "12"), 10) || 12));
    const skip = (page - 1) * limit;

    const query: any = { isPublic: true };
    if (q) {
      query.$text = { $search: q };
    }

    const [items, total] = await Promise.all([
      Card.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Card.countDocuments(query),
    ]);

    return res.json({
      page,
      limit,
      total,
      results: items.map((d) => sanitize(d as any)),
    });
  } catch (err) {
    console.error("searchPublic error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/public/profile/:owner/cards  (public) */
export async function getPublicCards(req: Request, res: Response) {
  try {
    const owner = req.params.owner;
    if (!mongoose.isValidObjectId(owner))
      return res.status(400).json({ message: "Invalid owner id" });

    const items = await Card.find({ ownerId: owner, isPublic: true })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ results: items.map((d) => sanitize(d as any)) });
  } catch (err) {
    console.error("getPublicCards error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
