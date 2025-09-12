import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import fs from "fs";
import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const groupRouter = Router();
groupRouter.use(requireAuth);

/** Update group (name/description) - admin only */
groupRouter.put("/groups/:roomId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;
    const { name, description } = req.body as { name?: string; description?: string };

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (String(room.admin) !== String(userId)) return res.status(403).json({ error: "Only admin can update" });

    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    await room.save();

    res.json({ id: room.id, name: room.name, description: room.description });
  } catch (err) { next(err); }
});

/** Leave group (any member) */
groupRouter.post("/groups/:roomId/leave", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    room.members = room.members.filter((m) => String(m) !== String(userId));
    await room.save();

    res.json({ ok: true });
  } catch (err) { next(err); }
});

/** Delete group (admin only) */
groupRouter.delete("/groups/:roomId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (String(room.admin) !== String(userId)) return res.status(403).json({ error: "Only admin can delete" });

    await ChatMessage.deleteMany({ roomId });
    await room.deleteOne();

    res.json({ ok: true });
  } catch (err) { next(err); }
});

/** Upload group photo (admin only) */
const uploadDir = "uploads/groups";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({ dest: uploadDir });

groupRouter.post("/groups/:roomId/photo", upload.single("photo"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (String(room.admin) !== String(userId)) return res.status(403).json({ error: "Only admin can update photo" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    room.photoURL = `/uploads/groups/${req.file.filename}`;
    await room.save();

    res.json({ ok: true, photoURL: room.photoURL });
  } catch (err) { next(err); }
});

export default groupRouter;
