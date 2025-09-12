import { Router } from "express";
import auth from "./auth.js";
import users from "./users.js";
import chat from "./chat.js";

const router = Router();
router.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

router.use("/auth", auth);
router.use("/users", users);
router.use("/chat", chat);

export default router;