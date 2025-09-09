import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  listMyGroups,
  createGroup,
  getGroupMembers,
  addMemberByPhone,
  joinByCode,
} from "../controllers/chatGroups.js";

const router = Router();
router.use(requireAuth);

router.get("/groups", listMyGroups);
router.post("/groups", createGroup);
router.get("/groups/:id/members", getGroupMembers);
router.post("/groups/:id/members", addMemberByPhone);
router.post("/groups/join", joinByCode);

export default router;
