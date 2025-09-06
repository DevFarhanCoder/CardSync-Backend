import { Router } from "express";
import requireAuth from "../middlewares/auth.js";
import { User } from '../models/User.js';
import { Card } from '../models/Card.js';


const router = Router();

router.get("/participants", requireAuth, async (_req: any, res) => {
  const users = await User.find().limit(10).lean();
  const out = users.map((u: any) => ({
    id: String(u._id),
    name: u.name ?? "",
    email: u.email,
  }));
  res.json({ participants: out });
});

router.get("/recent-cards", requireAuth, async (req: any, res) => {
  const cards = await Card.find({ userId: req.userId }).sort({ updatedAt: -1 }).limit(10).lean();
  res.json({ items: cards.map((c: any) => ({ id: String(c._id), title: c.title ?? "" })) });
});

export default router;
 