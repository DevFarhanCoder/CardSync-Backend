import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Types } from "mongoose";

// ✅ use the SAME auth middleware you already use elsewhere
import requireAuth from "../middlewares/auth.js";
// If your project actually exports a named { requireAuth }, switch this import accordingly.

import { User } from "../models/User.js";

import type { FileFilterCallback } from "multer";

const router = Router();
router.use(requireAuth);

// ---- helper: read authenticated user id no matter how middleware sets it ----
function getReqUserId(req: any): string {
    const id =
        req.userId ??
        req.user?._id ??
        req.user?.id ??
        "";
    return id ? String(id) : "";
}

// ---- GET /api/users/me ----
router.get("/users/me", async (req, res) => {
    const id = getReqUserId(req);
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const u = await User.findById(id).select("_id name email phone bio avatarUrl");
    if (!u) return res.status(404).json({ message: "User not found" });

    res.json({
        id: String(u._id),
        name: u.name || "",
        email: u.email || "",
        phone: (u as any).phone || "",
        bio: (u as any).bio || "",
        avatarUrl: (u as any).avatarUrl || null,
    });
});

// ---- PATCH /api/users/me ----
router.patch("/users/me", async (req, res) => {
    const id = getReqUserId(req);
    if (!id) return res.status(401).json({ message: "Unauthorized" });

    const { name, phone, bio } = req.body || {};
    const u = await User.findById(id);
    if (!u) return res.status(404).json({ message: "User not found" });

    if (typeof name === "string") u.name = name.trim();
    if (typeof phone === "string") (u as any).phone = phone.replace(/[^\d+]/g, "");
    if (typeof bio === "string") (u as any).bio = bio.trim();
    await u.save();

    res.json({ ok: true });
});

// ---- GET /api/users/:id (public view) ----
router.get("/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid user id" });

    const u = await User.findById(id).select("_id name phone bio avatarUrl");
    if (!u) return res.status(404).json({ message: "User not found" });

    res.json({
        id: String(u._id),
        name: u.name || "",
        phone: (u as any).phone || "",
        bio: (u as any).bio || "",
        avatarUrl: (u as any).avatarUrl || null,
    });
});

const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    if (ok) return cb(null, true);          // ✅ accept (two args)
    return cb(new Error("INVALID_IMAGE_TYPE")); // ✅ reject (one arg)
  },
});


router.post("/users/me/avatar", (req, res, next) => {
    upload.single("avatar")(req as any, res as any, async (err: any) => {
        try {
            if (err) {
                if (String(err?.message).includes("INVALID_IMAGE_TYPE")) {
                    return res.status(400).json({ message: "Only JPG/PNG/WEBP/GIF allowed" });
                }
                if (String(err?.message).includes("File too large")) {
                    return res.status(413).json({ message: "Image too large (max 5MB)" });
                }
                throw err;
            }

            // <-- read the authenticated id the same way everywhere
            const id =
                (req as any).userId ??
                (req as any).user?._id ??
                (req as any).user?.id ??
                "";
            if (!id) return res.status(401).json({ message: "Unauthorized" });

            const u = await User.findById(id);
            if (!u) return res.status(404).json({ message: "User not found" });

            if (!req.file) return res.status(400).json({ message: "No file uploaded" });

            (u as any).avatarUrl = `/uploads/avatars/${req.file.filename}`;
            await u.save();
            res.json({ ok: true, avatarUrl: (u as any).avatarUrl });
        } catch (e) {
            next(e);
        }
    });
});


export default router;
