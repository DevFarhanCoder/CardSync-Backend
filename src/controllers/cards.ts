// src/controllers/cards.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import Card from "../models/Card.js";

// If you typed your auth middleware, this matches: req.user._id is set when authed
type AuthedRequest = Request & { user?: { _id: string; email?: string } };

function isValidId(id?: string) {
  return !!id && mongoose.isValidObjectId(id);
}

/** -------------------- CREATE (auth) -------------------- */
// POST /api/cards
export async function createCard(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const { title, description, data, theme, tags } = req.body || {};
    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "Title is required and must be a string" });
    }

    const card = await Card.create({
      title,
      description,
      data,
      owner: req.user._id,
      theme,
      tags,
    });

    return res.status(201).json(card);
  } catch (err) {
    console.error("createCard error:", err);
    if ((err as any)?.name === "ValidationError") {
      return res.status(400).json({ message: "Validation failed", details: (err as any).errors });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

/** -------------------- LIST (auth) -------------------- */
// GET /api/cards?mine=true|false&publicOnly=true|false&page=&limit=
export async function listCards(req: AuthedRequest, res: Response) {
  try {
    const page = Math.max(parseInt(String(req.query.page || 1), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || 20), 10), 1), 100);
    const mine = String(req.query.mine || "false") === "true";
    const publicOnly = String(req.query.publicOnly || "false") === "true";

    const filter: Record<string, any> = {};
    if (mine) {
      if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
      filter.owner = req.user._id;
    }
    if (publicOnly) filter.isPublic = true;
    if (!mine && !publicOnly) {
      if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
      filter.owner = req.user._id;
    }

    const [items, total] = await Promise.all([
      Card.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit),
      Card.countDocuments(filter),
    ]);

    return res.json({ page, limit, total, items });
  } catch (err) {
    console.error("listCards error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** -------------------- GET ONE (auth unless public) -------------------- */
// GET /api/cards/:id
export async function getOneCard(req: AuthedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid card id" });

    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const isOwner = req.user && String(card.owner) === String(req.user._id);
    if (!card.isPublic && !isOwner) return res.status(403).json({ message: "Forbidden" });

    return res.json(card);
  } catch (err) {
    console.error("getOneCard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** -------------------- UPDATE (auth owner) -------------------- */
// PATCH /api/cards/:id
export async function updateCard(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid card id" });

    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: "Card not found" });
    if (String(card.owner) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

    const updatable = ["title", "description", "data", "theme", "tags"] as const;
    for (const key of updatable) {
      if (key in req.body) {
        card[key] = req.body[key];
      }
    }
    await card.save();
    return res.json(card);
  } catch (err) {
    console.error("updateCard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** -------------------- DELETE (auth owner) -------------------- */
// DELETE /api/cards/:id
export async function deleteCard(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid card id" });

    const card = await Card.findOneAndDelete({ _id: id, owner: req.user._id });
    if (!card) return res.status(404).json({ message: "Card not found" });

    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteCard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** -------------------- PUBLISH / UNPUBLISH (auth owner) -------------------- */
// POST /api/cards/publish/:id?   or body { id }
export async function publishPublic(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
    const id = (req.params as any)?.id || (req.body as any)?.id;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid card id" });

    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: "Card not found" });
    if (String(card.owner) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

    card.isPublic = true;
    if (!card.publishedAt) card.publishedAt = new Date();
    await card.save();

    return res.json({ message: "Published", card });
  } catch (err) {
    console.error("publishPublic error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/cards/unpublish/:id?   or body { id }
export async function unpublish(req: AuthedRequest, res: Response) {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });
    const id = (req.params as any)?.id || (req.body as any)?.id;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid card id" });

    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: "Card not found" });
    if (String(card.owner) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

    card.isPublic = false;
    await card.save();

    return res.json({ message: "Unpublished", card });
  } catch (err) {
    console.error("unpublish error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** -------------------- VIEW COUNTER (public for public cards) -------------------- */
// POST /api/cards/:id/view
export async function incrementView(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid card id" });

    const card = await Card.findOneAndUpdate(
      { _id: id, isPublic: true },
      { $inc: { "stats.views": 1 } },
      { new: true }
    );
    if (!card) return res.status(404).json({ message: "Card not found or not public" });
    return res.json({ views: card.stats?.views ?? 0 });
  } catch (err) {
    console.error("incrementView error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** -------------------- PUBLIC SEARCH (no auth) -------------------- */
// GET /api/cards/search?q=&page=&limit=
export async function searchPublic(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(parseInt(String(req.query.page || 1), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || 24), 10), 1), 50);

    if (!q) return res.json({ page, limit, total: 0, items: [] });

    const terms = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 10);
    const regexes = terms.map((t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

    const or: any[] = [];
    for (const r of regexes) {
      or.push(
        { title: r }, { theme: r }, { tags: r }, { slug: r },
        { "data.name": r }, { "data.email": r }, { "data.phone": r },
        { "data.address": r }, { "data.website": r }, { "data.tagline": r },
        { "data.role": r }, { "data.keywords": r }
      );
    }

    const filter = { isPublic: true, $or: or };
    const [docs, total] = await Promise.all([
      Card.find(filter, {
        title: 1, theme: 1, isPublic: 1,
        "data.type": 1, "data.name": 1, "data.email": 1, "data.phone": 1,
        "data.address": 1, "data.logoUrl": 1, "data.website": 1,
        "data.tagline": 1, "data.role": 1, "data.eventDate": 1,
        "data.eventVenue": 1, "data.socials": 1, "data.keywords": 1,
      })
        .sort({ publishedAt: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Card.countDocuments(filter),
    ]);

    const items = docs.map((d: any) => ({
      _id: String(d._id),
      title: d.title || d?.data?.name || "Card",
      type: d?.data?.type || "business",
      theme: d.theme || "luxe",
      name: d?.data?.name,
      email: d?.data?.email,
      phone: d?.data?.phone,
      address: d?.data?.address,
      logoUrl: d?.data?.logoUrl,
      website: d?.data?.website,
      tagline: d?.data?.tagline,
      role: d?.data?.role,
      eventDate: d?.data?.eventDate,
      eventVenue: d?.data?.eventVenue,
      socials: d?.data?.socials || {},
      keywords: d?.data?.keywords || [],
    }));

    return res.json({ page, limit, total, items });
  } catch (err) {
    console.error("searchPublic error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
