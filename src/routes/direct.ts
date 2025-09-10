import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { Direct } from "../models/Direct.js";
import { Types } from "mongoose";

const router = Router();
router.use(requireAuth);

const oid = (s: string) => new Types.ObjectId(String(s));

// open or get a DM with another user
router.post("/dm/open", async (req, res) => {
  const me = (req as any).userId || (req as any).user?.id;
  const { userId } = req.body || {};
  if (!userId || String(userId) === String(me)) return res.status(400).json({ message: "Invalid userId" });

  // find existing dm (unordered pair)
  const docs = await Direct.find({
    participants: { $all: [oid(me), oid(userId)], $size: 2 },
  }).limit(1);

  if (docs.length) return res.json({ id: String(docs[0]._id) });

  const dm = await Direct.create({ participants: [oid(me), oid(userId)] });
  return res.json({ id: String(dm._id) });
});

// list all my DMs
router.get("/dm", async (req, res) => {
  const me = (req as any).userId || (req as any).user?.id;
  const list = await Direct.find({ participants: oid(me) })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  res.json({
    items: list.map((d) => ({
      id: String(d._id),
      lastMessageText: d.lastMessageText || null,
      lastMessageAt: d.lastMessageAt || null,
      participants: (d.participants || []).map(String),
    })),
  });
});

export default router;
