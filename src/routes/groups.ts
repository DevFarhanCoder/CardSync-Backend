import { Router, Request, Response, NextFunction } from "express";
import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const groupRouter = Router();

/**
 * Create a new group
 */
groupRouter.post("/groups", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ error: "Name and code required" });

    const room = new ChatRoom({
      name,
      code,
      admin: userId,
      members: [userId],
      description: description || "",
    });
    await room.save();
    res.json({ room });
  } catch (err) {
    next(err);
  }
});

/**
 * Get all groups user is in
 */
groupRouter.get("/groups", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const rooms = await ChatRoom.find({ members: userId });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
});

/**
 * Update group (name / description)
 */
groupRouter.put("/groups/:roomId", requireAuth, async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { name, description }: { name?: string; description?: string } = req.body;

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (String(room.admin) !== String(req.user!.id)) {
      return res.status(403).json({ error: "Only admin can update" });
    }

    if (name) room.name = name;
    if (description) room.description = description;

    await room.save();
    res.json({ id: room.id, name: room.name, description: room.description });
  } catch (err) {
    next(err);
  }
});



/**
 * Leave group
 */
groupRouter.post("/groups/:roomId/leave", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    room.members = room.members.filter((m) => String(m) !== String(userId));
    await room.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete group
 */
groupRouter.delete("/groups/:roomId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (String(room.admin) !== String(userId)) return res.status(403).json({ error: "Only admin can delete" });

    await ChatMessage.deleteMany({ roomId });
    await room.deleteOne();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default groupRouter;
