import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import ChatRoom from "../models/ChatRoom.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const upload = multer({
  storage: multer.diskStorage({
    destination: function (_req, _file, cb) {
      const dir = "uploads/groups";
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (_req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
});

const router = Router();

router.post(
  "/groups/:roomId/photo",
  requireAuth,
  upload.single("photo"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roomId } = req.params;
      const room = await ChatRoom.findById(roomId);
      if (!room) return res.status(404).json({ error: "Room not found" });

      if (String(room.admin) !== String(req.user!.id)) {
        return res.status(403).json({ error: "Only admin can update photo" });
      }

      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      // Store relative path (adjust if serving static files differently)
      room.photoURL = `/uploads/groups/${req.file.filename}`;
      await room.save();

      res.json({ ok: true, photoURL: room.photoURL });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
