import { Router } from "express";
import { User } from '../models/User.js';
import { Card } from '../models/Card.js';
import { getPublicProfileByHandle, getPublicCardBySlug } from "../controllers/public.js";

const publicRouter = Router();

publicRouter.get("/profile/:handle", getPublicProfileByHandle);
publicRouter.get("/card/:handle/:slug", getPublicCardBySlug);

/** profile header */
publicRouter.get("/public/user/:id", async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id).select("_id name email phone");
    if (!u) return res.status(404).json({ error: "User not found" });
    res.json({ user: { id: String(u._id), name: u.name || "", email: u.email, phone: u.phone || "" } });
  } catch (e) { next(e); }
});

/** all cards by owner (published) - adjust filters if you have a flag */
publicRouter.get("/public/profile/:owner/cards", async (req, res, next) => {
  try {
    const { owner } = req.params;
    const cards = await Card.find({ userId: owner }).sort({ createdAt: -1 }).limit(100);
    res.json({ cards: cards.map((c) => ({ id: String(c._id), data: c.data, createdAt: c.createdAt })) });
  } catch (e) { next(e); }
});

/** single card (viewer) */
publicRouter.get("/public/card/:id", async (req, res, next) => {
  try {
    const c = await Card.findById(req.params.id);
    if (!c) return res.status(404).json({ error: "Card not found" });
    res.json({ card: { id: String(c._id), ownerId: String(c.userId), data: c.data, createdAt: c.createdAt } });
  } catch (e) { next(e); }
});

export default publicRouter;
