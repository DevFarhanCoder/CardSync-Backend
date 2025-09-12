import type { Request, Response } from "express";
import { User } from "../models/User.js";
import { Card } from "../models/Card.js";

export const getPublicProfileByHandle = async (req: Request, res: Response) => {
  const { handle } = req.params;
  const user = await User.findOne({ handle }).lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  const cards = await Card.find({ userId: user._id, visibility: { $in: ["public", "unlisted"] } })
    .sort({ updatedAt: -1 })
    .lean();

  res.json({
    user: { id: String(user._id), name: user.name || handle, handle, phone: (user as any).phone || "" },
    cards: cards.map((c: any) => ({
      id: String(c._id), title: c.title, slug: c.slug, visibility: c.visibility
    })),
  });
};

export const getPublicCardBySlug = async (req: Request, res: Response) => {
  const { handle, slug } = req.params;
  const user = await User.findOne({ handle }).lean();
  if (!user) return res.status(404).json({ message: "User not found" });

  const card = await Card.findOne({
    userId: user._id,
    slug,
    visibility: { $in: ["public", "unlisted"] },
  }).lean();

  if (!card) return res.status(404).json({ message: "Card not found" });

  res.json({
    card: {
      id: String(card._id),
      title: card.title,
      slug: card.slug,
      visibility: card.visibility,
      // …include any public fields needed by UI …
    },
    user: { id: String(user._id), name: user.name || handle, handle },
  });
};
