import { Router } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import requireAuth from "../middlewares/auth.js";
import { User } from "../models/User.js"; // named export

// --- Types to keep TS happy with mongoose documents ---
import type { Document } from "mongoose";
type UserDoc = Document & {
  _id: any;
  name: string;
  email: string;
  phone?: string;
  about?: string;
  avatarUrl?: string;
  updatedAt?: Date;
};

const router = Router();

/** ---------- uploads ---------- */
const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.mimetype
    );
    if (!ok) return cb(new Error("INVALID_IMAGE_TYPE"));
    cb(null, true);
  },
});

/** ---------- me (GET) ---------- */
router.get("/users/me", requireAuth as any, async (req: any, res) => {
  try {
    const id = req.user.id;

    let u = (await User.findById(id)) as UserDoc | null;
    if (!u) {
      u = (await User.create({
        _id: id,
        name: req.user.name || "User",
        email: req.user.email,
        about: "",
        phone: "",
        avatarUrl: "",
      })) as UserDoc;
    }

    res.json({
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      about: u.about ?? "",
      avatarUrl: u.avatarUrl ?? "",
      lastActive: u.updatedAt ?? new Date(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- me (PATCH) ---------- */
router.patch("/users/me", requireAuth as any, async (req: any, res) => {
  try {
    const { name, phone, about } = req.body || {};

    const u = (await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name, phone, about } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )) as UserDoc;

    res.json({
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone ?? "",
      about: u.about ?? "",
      avatarUrl: u.avatarUrl ?? "",
      lastActive: u.updatedAt ?? new Date(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/** ---------- avatar upload ---------- */
router.post(
  "/users/me/avatar",
  requireAuth as any,
  upload.single("avatar"),
  async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file" });

      const url = `/uploads/${req.file.filename}`;
      await User.findByIdAndUpdate(req.user.id, { $set: { avatarUrl: url } });
      res.json({ url });
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("INVALID_IMAGE_TYPE")) {
        return res.status(400).json({ message: "Only JPG/PNG/WEBP/GIF allowed" });
      }
      if (msg.includes("File too large")) {
        return res.status(413).json({ message: "Image too large (max 5MB)" });
      }
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/** ---------- public profile ---------- */
router.get("/users/:id", requireAuth as any, async (req, res) => {
  try {
    const u = (await User.findById(req.params.id)) as UserDoc | null;
    if (!u) return res.status(404).json({ message: "User not found" });

    res.json({
      id: String(u._id),
      name: u.name,
      avatarUrl: u.avatarUrl ?? "",
      about: u.about ?? "",
      phone: u.phone ?? "",
      lastActive: u.updatedAt ?? new Date(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
