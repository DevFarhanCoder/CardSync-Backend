import { Router, type Request, type Response, type NextFunction } from "express";
import ChatRoom from "../models/ChatRoom.js";
import type { IChatRoom } from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const chatRouter = Router();
chatRouter.use(requireAuth);

/* presenter */
function presentRoom(
  room: Pick<IChatRoom, "_id" | "name" | "code" | "admin" | "members" | "createdAt" | "description" | "photoURL">,
  userId: string
) {
  const isAdmin = String(room.admin) === String(userId);
  return {
    id: String(room._id),
    name: room.name,
    code: room.code,
    isAdmin,
    membersCount: room.members?.length ?? 0,
    createdAt: room.createdAt,
    description: room.description ?? "",
    photoURL: room.photoURL ?? null,
  };
}

/** GET /api/chat/rooms -> only my rooms */
chatRouter.get("/chat/rooms", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const rooms = await ChatRoom.find({ members: userId }).sort({ updatedAt: -1 });
    res.json(rooms.map((r) => presentRoom(r as any, userId)));
  } catch (err) { next(err); }
});

/** POST /api/chat/rooms -> create, add only me */
chatRouter.post("/chat/rooms", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, code } = req.body as { name: string; code: string };
    if (!name || !code) return res.status(400).json({ error: "Name and code required" });

    const room = await ChatRoom.create({ name, code, admin: userId, members: [userId], description: "" });
    res.json({ room: presentRoom(room as any, userId) });
  } catch (err) { next(err); }
});

/** POST /api/chat/join -> join by code (idempotent) */
chatRouter.post("/chat/join", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { code } = req.body as { code: string };
    const room = await ChatRoom.findOne({ code });
    if (!room) return res.status(404).json({ error: "Invalid code" });

    if (!room.members.some((m) => String(m) === String(userId))) {
      room.members.push(userId as any);
      await room.save();
    }
    res.json({ room: presentRoom(room as any, userId) });
  } catch (err) { next(err); }
});

/** POST /api/chat/rooms/:roomId/messages -> send message (example) */
chatRouter.post("/chat/rooms/:roomId/messages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;
    const { text } = req.body as { text: string };

    const msg = await ChatMessage.create({ roomId, userId, text });
    res.json({ message: { id: String(msg._id), roomId, userId, text, createdAt: msg.createdAt } });
  } catch (err) { next(err); }
});

export default chatRouter;
