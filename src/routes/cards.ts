import { Router } from "express";
import Card from "../models/Card.js";
import requireAuth from "../middlewares/auth.js";

const router = Router();

router.get("/cards", requireAuth, async (req: any, res) => {
  const cards = await Card.find({ owner: req.user.id }).sort({ updatedAt: -1 });
  res.json({ cards });
});

router.post("/cards", requireAuth, async (req: any, res) => {
  const payload = req.body || {};
  const card = await Card.create({
    owner: req.user.id,
    title: payload.title || "Untitled",
    theme: payload.theme || "luxe",
    data: payload,
    isPublic: !!payload.isPublic,
  });
  res.status(201).json({ card });
});

router.get("/cards/:id", requireAuth, async (req: any, res) => {
  const card = await Card.findOne({ _id: req.params.id, owner: req.user.id });
  if (!card) return res.status(404).json({ message: "Not found" });
  res.json({ card });
});

router.put("/cards/:id", requireAuth, async (req: any, res) => {
  const payload = req.body || {};
  const card = await Card.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    { title: payload.title, theme: payload.theme, data: payload, isPublic: !!payload.isPublic },
    { new: true }
  );
  if (!card) return res.status(404).json({ message: "Not found" });
  res.json({ card });
});

router.delete("/cards/:id", requireAuth, async (req: any, res) => {
  const out = await Card.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!out) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
});

export default router;
