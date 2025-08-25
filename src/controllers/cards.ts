import { Request, Response } from "express";
import mongoose from "mongoose";
import Card, { ICard } from "../models/Card.js";
import User from "../models/User.js";


// If auth middleware adds req.user
type AuthedRequest = Request & { user?: { _id: string; email?: string } };

// ---------- helpers ----------
const normalizeList = (input: any): string[] => {
  const arr = Array.isArray(input) ? input : String(input || "").split(",");
  return arr.map((s) => String(s || "").trim().toLowerCase()).filter(Boolean).slice(0, 50);
};

// Build a public-safe card payload
const sanitize = (doc: ICard) => {
  const d: any = (doc as any).data || {};
  const previewUrl =
    d.previewUrl || d.image || d.photo || d.photoUrl || d.logo || d.cover || d.avatar || null;

  return {
    _id: String((doc as any)._id),
    owner: String((doc as any).owner),
    title: (doc as any).title,
    slug: (doc as any).slug,
    theme: (doc as any).theme,
    isPublic: (doc as any).isPublic,
    data: d,
    tagline: d.tagline,
    website: d.website,
    socials: d.socials || {},
    keywords: (doc as any).keywords || [],
    tags: (doc as any).tags || [],
    analytics: (doc as any).analytics || { views: 0, clicks: 0, shares: 0, saves: 0 },
    previewUrl,
  };
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
async function nextUniqueSlug(base: string) {
  const candidate = base || "card";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? candidate : `${candidate}-${i + 1}`;
    const exists = await Card.exists({ slug });
    if (!exists) return slug;
  }
  return `${candidate}-${Date.now()}`;
}

// Pick a nice display name from a User doc and/or cards
function pickDisplayName(owner: any, cards: ICard[]): string {
  const userName =
    owner?.name ||
    owner?.fullName ||
    [owner?.firstName, owner?.lastName].filter(Boolean).join(" ") ||
    (owner?.email ? String(owner.email).split("@")[0] : "");

  if (userName) return userName;

  // try to derive from first public card
  const first = cards[0] as any;
  const fromCard = first?.data?.name || first?.title;
  return fromCard || "Unknown User";
}

// ---------- controllers ----------

/** POST /api/cards — create */
export async function createCard(req: AuthedRequest, res: Response) {
  try {
    const owner = req.user?._id;
    if (!owner) return res.status(401).json({ message: "Unauthorized" });

    const ownerObjId = new mongoose.Types.ObjectId(owner);
    const { title, slug, theme = "luxe", data = {}, keywords = [], tags = [], isPublic = true } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });

    const base = slugify(slug || title);
    const uniqueSlug = await nextUniqueSlug(base);

    const kwFromData = (data as any)?.keywords;
    const normalizedKeywords = normalizeList(
      Array.isArray(keywords) || typeof keywords === "string" ? keywords : kwFromData
    );

    const doc = await Card.create({
      title,
      slug: uniqueSlug,
      owner: ownerObjId,
      theme,
      data,
      isPublic,
      keywords: normalizedKeywords,
      tags: normalizeList(tags),
    });

    return res.status(201).json(sanitize(doc));
  } catch (err) {
    console.error("createCard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** PUT /api/cards/:id — update */
export async function updateCard(req: AuthedRequest, res: Response) {
  try {
    const owner = req.user?._id;
    if (!owner) return res.status(401).json({ message: "Unauthorized" });

    const cardId = req.params.id;
    if (!mongoose.isValidObjectId(cardId)) return res.status(400).json({ message: "Invalid id" });

    const { title, theme, data, keywords, tags, isPublic, slug } = req.body;

    const $set: any = {};
    if (title !== undefined) $set.title = title;
    if (theme !== undefined) $set.theme = theme;
    if (data !== undefined) $set.data = data;
    if (isPublic !== undefined) $set.isPublic = !!isPublic;
    if (keywords !== undefined || data?.keywords !== undefined) {
      const kw = Array.isArray(keywords) || typeof keywords === "string" ? keywords : data.keywords;
      $set.keywords = normalizeList(kw);
    }
    if (tags !== undefined) $set.tags = normalizeList(tags);
    if (slug !== undefined) {
      const base = slugify(slug || title || "");
      $set.slug = await nextUniqueSlug(base);
    }

    const doc = await Card.findOneAndUpdate(
      { _id: cardId, owner: new mongoose.Types.ObjectId(owner) },
      { $set },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });

    return res.json(sanitize(doc));
  } catch (err) {
    console.error("updateCard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/cards/:id — owner fetch */
export async function getCardById(req: AuthedRequest, res: Response) {
  try {
    const owner = req.user?._id;
    if (!owner) return res.status(401).json({ message: "Unauthorized" });

    const cardId = req.params.id;
    if (!mongoose.isValidObjectId(cardId)) return res.status(400).json({ message: "Invalid id" });

    const doc = await Card.findOne({ _id: cardId, owner: new mongoose.Types.ObjectId(owner) });
    if (!doc) return res.status(404).json({ message: "Not found" });

    return res.json(sanitize(doc));
  } catch (err) {
    console.error("getCardById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/explore?q=... — public search with owner + category */
export async function searchPublic(req: Request, res: Response) {
  try {
    const q = String((req.query.q as string) || "").trim();
    const limit = Math.min(Number(req.query.limit) || 24, 60);
    const base = { isPublic: true };

    let docs: ICard[] = [];
    if (q) {
      docs = await Card.find({ ...base, $text: { $search: q } }).limit(limit).lean(false);
      if (docs.length === 0) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        docs = await Card.find({ ...base, $or: [{ title: rx }, { keywords: rx }, { tags: rx }] })
          .limit(limit)
          .lean(false);
      }
    } else {
      docs = await Card.find(base).sort({ updatedAt: -1 }).limit(limit).lean(false);
    }

    // batch owner lookup
    const ownerIds = Array.from(new Set((docs as any[]).map((d) => String(d.owner))));
    const users = await User.find({ _id: { $in: ownerIds } })
      .select("name fullName firstName lastName email")
      .lean();
    const nameOf = (u: any) =>
      u?.name ||
      u?.fullName ||
      [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
      (u?.email ? String(u.email).split("@")[0] : "");

    const userMap = new Map<string, string>(users.map((u: any) => [String(u._id), nameOf(u) || ""]));

    const results = (docs as any[]).map((d) => {
      const s = sanitize(d);
      const category =
        (s?.data as any)?.category ||
        (Array.isArray(s.tags) && s.tags[0]) ||
        (Array.isArray(s.keywords) && s.keywords[0]) ||
        "General";

      // robust owner name: prefer userMap, then card's own data/name/title
      const ownerName =
        userMap.get(String(s.owner)) ||
        (s as any)?.data?.name ||
        s.title ||
        "Unknown User";

      return {
        ...s,
        ownerId: s.owner,
        ownerName,
        category,
      };
    });

    return res.json({ results });
  } catch (err) {
    console.error("searchPublic error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/public/profile/:owner/cards — list a user's public cards + owner */
export async function getPublicCards(req: Request, res: Response) {
  try {
    const ownerId = String(req.params.owner);
    if (!mongoose.isValidObjectId(ownerId)) {
      return res.status(400).json({ message: "Invalid ownerId" });
    }

    const [cards, owner] = await Promise.all([
      Card.find({ owner: ownerId, isPublic: true }).sort({ updatedAt: -1 }).lean(false),
      User.findById(ownerId).select("name fullName firstName lastName email").lean().catch(() => null),
    ]);

    const displayName = pickDisplayName(owner, cards);

    return res.json({
      owner: { _id: ownerId, name: displayName },
      results: cards.map((doc) => sanitize(doc as any)),
    });
  } catch (err) {
    console.error("getPublicCards error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
