// src/routes/chatCompat.ts
import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
import { User } from "../models/User.js";
import mongoose, { Types } from "mongoose";

const router = Router();
router.use(requireAuth);

const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const asId = (s: string) => (Types.ObjectId.isValid(s) ? new Types.ObjectId(s) : null);

/** POST /api/chat/rooms  -> create group */
router.post("/chat/rooms", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = asId(req.user!.id)!;
    const name = String((req.body as any)?.name || "").trim();
    if (!name) return res.status(400).json({ message: "Name is required" });

    const room = await ChatRoom.create({ name, code: genCode(), admin: uid, members: [uid] });
    res.json({ room: { id: String(room._id), name: room.name, code: room.code, members: room.members.map(String), isAdmin: true } });
  } catch (e) { next(e); }
});

/** GET /api/chat/rooms  -> list my rooms */
router.get("/chat/rooms", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = asId(req.user!.id)!;
    const rooms = await ChatRoom.find({ $or: [{ admin: uid }, { members: uid }] }).sort({ updatedAt: -1 }).limit(200).lean();
    res.json({ rooms: rooms.map(r => ({ id: String(r._id), name: r.name, code: r.code, isAdmin: String(r.admin) === String(uid), members: (r.members||[]).map(String) })) });
  } catch (e) { next(e); }
});

/** GET /api/chat/rooms/:roomId -> details (+members) */
router.get("/chat/rooms/:roomId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId).lean();
    if (!room) return res.status(404).json({ message: "Room not found" });
    const members = await User.find({ _id: { $in: room.members } }).select("_id name email phone").lean();
    res.json({ room: { id: String(room._id), name: room.name, code: room.code, members: members.map(m => ({ id: String(m._id), name: m.name || "", email: m.email, phone: (m as any).phone || "" })) } });
  } catch (e) { next(e); }
});

/** POST /api/chat/rooms/join  -> { code } */
router.post("/chat/rooms/join", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = asId(req.user!.id)!;
    const code = String((req.body as any)?.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ message: "Code is required" });
    const room = await ChatRoom.findOne({ code });
    if (!room) return res.status(404).json({ message: "Invalid code" });
    if (!room.members.some(m => String(m) === String(uid))) { room.members.push(uid); await room.save(); }
    res.json({ room: { id: String(room._id), name: room.name, code: room.code, isAdmin: String(room.admin) === String(uid), members: room.members.map(String) } });
  } catch (e) { next(e); }
});

/** GET /api/chat/messages?roomId=&since=ISO */
router.get("/chat/messages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = String(req.query.roomId || "");
    if (!mongoose.isValidObjectId(roomId)) return res.status(400).json({ message: "roomId invalid" });
    const since = req.query.since ? new Date(String(req.query.since)) : null;
    const q: any = { roomId };
    if (since && !isNaN(since.getTime())) q.createdAt = { $gt: since };
    const msgs = await ChatMessage.find(q).sort({ createdAt: 1 }).limit(200).lean();
    res.json({ messages: msgs.map(m => ({ id: String(m._id), roomId: String(m.roomId), userId: String(m.userId), text: m.text || "", kind: (m as any).kind || "text", payload: (m as any).payload || null, createdAt: m.createdAt })) });
  } catch (e) { next(e); }
});

/** POST /api/chat/messages  -> { roomId, text? , kind? , payload? } */
router.post("/chat/messages", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = asId(req.user!.id)!;
    const { roomId, text = "", kind = "text", payload = null } = (req.body || {}) as { roomId: string; text?: string; kind?: "text" | "card"; payload?: any };
    if (!mongoose.isValidObjectId(roomId)) return res.status(400).json({ message: "roomId invalid" });
    const msg = await ChatMessage.create({ roomId, userId: uid, text, kind, payload });
    res.json({ message: { id: String(msg._id), roomId: String(msg.roomId), userId: String(msg.userId), text: msg.text || "", kind, payload, createdAt: msg.createdAt } });
  } catch (e) { next(e); }
});

router.get("/chat/rooms/:roomId/messages", async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: "roomId invalid" });
    }
    const sinceStr = req.query.since ? String(req.query.since) : "";
    const since = sinceStr ? new Date(sinceStr) : null;

    const q: any = { roomId };
    if (since && !isNaN(since.getTime())) q.createdAt = { $gt: since };

    const msgs = await ChatMessage.find(q).sort({ createdAt: 1 }).limit(200).lean();
    res.json({
      messages: msgs.map(m => ({
        id: String(m._id),
        roomId: String(m.roomId),
        userId: String(m.userId),
        text: m.text || "",
        kind: (m as any).kind || "text",
        payload: (m as any).payload || null,
        createdAt: m.createdAt,
      })),
    });
  } catch (e) { next(e); }
});

router.post("/chat/rooms/:roomId/messages", async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: "roomId invalid" });
    }
    const { text = "", kind = "text", payload = null } =
      (req.body || {}) as { text?: string; kind?: "text" | "card"; payload?: any };

    const msg = await ChatMessage.create({
      roomId,
      userId: req.user!.id,
      text,
      kind,
      payload,
    });

    res.json({
      message: {
        id: String(msg._id),
        roomId: String(msg.roomId),
        userId: String(msg.userId),
        text: msg.text || "",
        kind,
        payload,
        createdAt: msg.createdAt,
      },
    });
  } catch (e) { next(e); }
});
export default router;
