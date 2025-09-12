import { Router } from "express";
import requireAuth from "../middlewares/auth.js";
// import { Group } from "../models/Group.js"; // When ready

const router = Router();

// GET /api/chat/groups
router.get("/groups", requireAuth, async (_req, res) => {
  // Replace with actual fetch from Group when ready:
  // const groups = await Group.find({ members: req.userId }).lean();
  // return res.json({ groups: groups.map(g => ({ id: String(g._id), name: g.name })) });
  return res.json({ groups: [] });
});

export default router;