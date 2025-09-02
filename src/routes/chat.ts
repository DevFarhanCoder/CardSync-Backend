import { Router, Request, Response, NextFunction } from "express";
import ChatRoom, { IChatRoom } from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
import requireAuth from "../middlewares/requireAuth.js";

const chatRouter = Router();
chatRouter.use(requireAuth);

/* ------------ helpers ------------ */
function presentRoom(
  room: Pick<IChatRoom, "_id" | "name" | "code" | "admin" | "members" | "createdAt">,
  userId: string
) {
  const isAdmin = String(room.admin) === String(userId);
  return {
    id: String(room._id),
    name: room.name,
    membersCount: Array.isArray(room.members) ? room.members.length : 1,
    isAdmin,
    code: isAdmin ? room.code : undefined,
    createdAt: room.createdAt,
  };
}

/* ------------ routes ------------ */

// GET /api/chat/rooms
chatRouter.get("/rooms", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const rooms = await ChatRoom.find({ members: userId }).sort({ updatedAt: -1 }).lean();
    res.json(rooms.map((r) => presentRoom(r, userId)));
  } catch (e) { next(e); }
});

// POST /api/chat/rooms { name, code }
chatRouter.post("/rooms", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const name = String(req.body?.name || "").trim();
    const code = String(req.body?.code || "").trim();

    if (!name) return res.status(400).json({ error: "Room name is required." });
    if (!/^\d{5,6}$/.test(code)) return res.status(400).json({ error: "Invalid room code." });

    const dup = await ChatRoom.findOne({ code }).lean();
    if (dup) return res.status(409).json({ error: "Code already in use. Pick another." });

    const room = await ChatRoom.create({ name, code, admin: userId, members: [userId] });
    res.status(201).json({ room: presentRoom(room.toObject(), userId) });
  } catch (e) { next(e); }
});

// POST /api/chat/join { code }
chatRouter.post("/join", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const code = String(req.body?.code || "").trim();
    if (!/^\d{5,6}$/.test(code)) return res.status(400).json({ error: "Invalid code." });

    const room = await ChatRoom.findOne({ code });
    if (!room) return res.status(404).json({ error: "Room not found." });

    if (!room.members.some((m) => String(m) === String(userId))) {
      room.members.push(userId as any);
      await room.save();
    }
    res.json({ room: presentRoom(room.toObject(), userId) });
  } catch (e) { next(e); }
});

// GET /api/chat/rooms/:roomId/messages?after=<id>
chatRouter.get("/rooms/:roomId/messages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId).lean();
    if (!room) return res.status(404).json({ error: "Room not found." });
    if (!room.members.some((m) => String(m) === String(userId)))
      return res.status(403).json({ error: "Not a member of this room." });

    const after = req.query.after ? String(req.query.after) : "";
    const q: Record<string, any> = { roomId };
    if (after) q._id = { $gt: after };

    const items = await ChatMessage.find(q).sort({ _id: 1 }).limit(100).lean();
    res.json({
      items: items.map((m) => ({
        id: String(m._id),
        roomId: String(m.roomId),
        userId: String(m.userId),
        userName: undefined,
        text: m.text,
        createdAt: m.createdAt,
      })),
    });
  } catch (e) { next(e); }
});

// POST /api/chat/rooms/:roomId/messages { text }
chatRouter.post("/rooms/:roomId/messages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "Message text is required." });

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ error: "Room not found." });
    if (!room.members.some((m) => String(m) === String(userId)))
      return res.status(403).json({ error: "Not a member of this room." });

    const msg = await ChatMessage.create({ roomId, userId, text });
    res.status(201).json({
      message: {
        id: String(msg._id),
        roomId: String(msg.roomId),
        userId: String(msg.userId),
        userName: "You",
        text: msg.text,
        createdAt: msg.createdAt,
      },
    });
  } catch (e) { next(e); }
});

export default chatRouter;
export { chatRouter };
