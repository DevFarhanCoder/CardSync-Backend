import { Router } from "express";
import requireAuth from "../middlewares/auth.js";
import mongoose from "mongoose";

const router = Router();

/** Minimal ChatGroup model (replace with your actual one if different) */
const ChatGroup = mongoose.model(
  "ChatGroup",
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      description: { type: String, default: "" },
      photoUrl: { type: String, default: "" },
      adminIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
  )
);

/** GET /api/chat/groups */
router.get("/chat/groups", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const groups = await ChatGroup.find({ memberIds: userId })
    .sort({ updatedAt: -1 })
    .lean();
  res.json(groups.map(g => ({ id: String(g._id), name: g.name, description: g.description, photoUrl: g.photoUrl })));
});

/** POST /api/chat/groups */
router.post("/chat/groups", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { name, description } = req.body ?? {};
  if (!name) return res.status(400).json({ message: "name is required" });

  const g = await ChatGroup.create({
    name,
    description: description ?? "",
    adminIds: [userId],
    memberIds: [userId],
  });

  res.status(201).json({ id: String(g._id) });
});

/** PATCH /api/chat/groups/:id */
router.patch("/chat/groups/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const { id } = req.params;

  const group = await ChatGroup.findById(id);
  if (!group) return res.status(404).json({ message: "Group not found" });

  const isAdmin = group.adminIds.some((x: any) => String(x) === String(userId));
  if (!isAdmin) return res.status(403).json({ message: "Only admins can edit the group" });

  const { name, description, photoUrl } = req.body ?? {};
  if (name !== undefined) group.name = name;
  if (description !== undefined) group.description = description;
  if (photoUrl !== undefined) group.photoUrl = photoUrl;

  await group.save();
  res.json({ id: String(group._id), name: group.name, description: group.description, photoUrl: group.photoUrl });
});

/** DELETE /api/chat/groups/:id */
router.delete("/chat/groups/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId;
  const group = await ChatGroup.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Group not found" });

  const isAdmin = group.adminIds.some((x: any) => String(x) === String(userId));
  if (!isAdmin) return res.status(403).json({ message: "Only admins can delete the group" });

  await group.deleteOne();
  res.json({ ok: true });
});

export default router;
