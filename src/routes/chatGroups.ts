import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  listMyGroups, createGroup, getGroupMembers, addMemberByPhone, addMembersBulk,
  modifyAdmin, removeMember, joinByCode, updateSettings, leaveGroup
} from "../controllers/chatGroups.js";
import { Group } from "../models/Group.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();
router.use(requireAuth);

// ---- core endpoints ----
router.get("/chat/groups", listMyGroups);
router.post("/chat/groups", createGroup);
router.get("/chat/groups/:id/members", getGroupMembers);
router.post("/chat/groups/:id/members", addMemberByPhone);
router.post("/chat/groups/:id/members/bulk", addMembersBulk);
router.post("/chat/groups/:id/admins", modifyAdmin);
router.post("/chat/groups/:id/members/remove", removeMember);
router.post("/chat/groups/join", joinByCode);
router.patch("/chat/groups/:id/settings", updateSettings);
router.post("/chat/groups/:id/leave", leaveGroup);

// ---- photo upload (admin only) ----
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "groups");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),     // ✅ ensure destination
    filename: (_req, file, cb) => {                             // ✅ and filename
      const ext = path.extname(file.originalname || "");
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    cb(ok ? null : new Error("INVALID_IMAGE_TYPE"), ok);
  },
});

router.post("/chat/groups/:id/photo", (req, res, next) => {
  upload.single("photo")(req as any, res as any, async (err: any) => {
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

      const userId = (req as any).userId || (req as any).user?.id;
      const g = await Group.findById(req.params.id);
      if (!g) return res.status(404).json({ message: "Group not found" });

      const isAdmin =
        String(g.ownerId) === String(userId) ||
        (g.admins || []).some((a) => String(a) === String(userId));
      if (!isAdmin) return res.status(403).json({ message: "Only admins can update photo." });

      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const rel = `/uploads/groups/${req.file.filename}`;
      g.photoUrl = rel;
      await g.save();

      return res.json({ ok: true, photoUrl: rel });
    } catch (e) {
      next(e);
    }
  });
});

export default router;
