// src/routes/shares.ts
import { Router, type Request, type Response, type NextFunction } from "express";
import mongoose from "mongoose";
import { requireAuth } from "../middlewares/requireAuth.js";
import ShareRecord from "../models/ShareRecord.js";
import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";

const sharesRouter = Router();
sharesRouter.use(requireAuth);

/** POST /api/shares/send  -> send to specific userIds (in-app sharing) */
sharesRouter.post("/shares/send", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user!.id;
    const { cardId, recipientUserIds } = req.body as { cardId: string; recipientUserIds: string[] };
    if (!mongoose.isValidObjectId(cardId)) return res.status(400).json({ message: "Invalid cardId" });
    const recipients = Array.from(new Set((recipientUserIds || []).filter(mongoose.isValidObjectId)));
    if (recipients.length === 0) return res.status(400).json({ message: "No recipients" });

    const rec = await ShareRecord.create({
      senderId, cardId, recipientIds: recipients, mode: "inapp"
    });
    return res.json({ ok: true, recordId: String(rec._id) });
  } catch (err) { next(err); }
});

/** POST /api/shares/group -> share to a group (ChatRoom) and drop a message with a link */
sharesRouter.post("/shares/group", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const senderId = req.user!.id;
    const { cardId, roomId, link } = req.body as { cardId: string; roomId: string; link?: string };
    if (!mongoose.isValidObjectId(cardId) || !mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Create record
    const rec = await ShareRecord.create({ senderId, roomId, cardId, recipientIds: [], mode: "group" });

    // Also drop a chat message with the link (if provided)
    if (link) {
      await ChatMessage.create({ roomId, userId: senderId, text: link });
    }

    return res.json({ ok: true, recordId: String(rec._id) });
  } catch (err) { next(err); }
});

/** GET /api/shares/mine -> sent & received */
sharesRouter.get("/shares/mine", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uid = req.user!.id;
    const sent = await ShareRecord.find({ senderId: uid }).sort({ createdAt: -1 }).limit(200);
    const received = await ShareRecord.find({ recipientIds: uid }).sort({ createdAt: -1 }).limit(200);
    return res.json({
      sent: sent.map(r => ({
        id: String(r._id), cardId: String(r.cardId), mode: r.mode, at: r.createdAt,
        roomId: r.roomId ? String(r.roomId) : null, recipients: r.recipientIds.map(x => String(x)),
      })),
      received: received.map(r => ({
        id: String(r._id), cardId: String(r.cardId), mode: r.mode, at: r.createdAt,
        roomId: r.roomId ? String(r.roomId) : null, senderId: String(r.senderId),
      })),
    });
  } catch (err) { next(err); }
});

export default sharesRouter;