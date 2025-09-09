import type { Request, Response } from "express";
import { Types } from "mongoose";
import crypto from "node:crypto";
import { Group } from "../models/Group.js";
import { User } from "../models/User.js";

/** Read the authenticated user id in a tolerant way */
function getReqUserId(req: Request): string {
  const anyReq = req as any;
  const id =
    anyReq.userId ??
    anyReq.user?._id ??
    anyReq.user?.id ??
    "";
  return id ? String(id) : "";
}
const oid = (id: string) => new Types.ObjectId(id);
const newJoinCode = () => crypto.randomBytes(2).toString("base64url").toUpperCase(); // e.g., TRY

/** GET /api/chat/groups
 * Return only groups where current user is owner OR member
 */
export async function listMyGroups(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const userObjectId = oid(uid);
  const groups = await Group.find({
    $or: [{ ownerId: userObjectId }, { members: userObjectId }],
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  res.json({
    items: groups.map(g => ({
      id: String(g._id),
      name: g.name,
      ownerId: String(g.ownerId),
      joinCode: g.joinCode,
      lastMessageText: g.lastMessageText || null,
      lastMessageAt: g.lastMessageAt || null,
    })),
  });
}

/** POST /api/chat/groups  body: { name } */
export async function createGroup(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const { name } = (req.body || {}) as { name?: string };
  if (!name || !name.trim()) return res.status(400).json({ message: "Name required" });

  const owner = oid(uid);
  const doc = await Group.create({
    name: name.trim(),
    ownerId: owner,
    joinCode: newJoinCode(),
    // ✅ owner always present in members
    members: [owner],
    lastMessageText: null,
    lastMessageAt: null,
  });

  res.status(201).json({
    group: {
      id: String(doc._id),
      name: doc.name,
      ownerId: String(doc.ownerId),
      joinCode: doc.joinCode,
      lastMessageText: null,
      lastMessageAt: null,
    },
  });
}

/** GET /api/chat/groups/:id/members */
export async function getGroupMembers(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;
  const g = await Group.findById(id).lean();
  if (!g) return res.status(404).json({ message: "Group not found" });

  const isOwner = String(g.ownerId) === uid;
  const isMember = (g.members || []).some(m => String(m) === uid);

  // ✅ Owner can always view; members can view; otherwise 403
  if (!isOwner && !isMember) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // ✅ Ensure owner is included in response (legacy groups)
  const memberIds = Array.from(
    new Set([String(g.ownerId), ...(g.members || []).map(m => String(m))])
  ).map(s => new Types.ObjectId(s));

  const users = await User.find({ _id: { $in: memberIds } })
    .select("_id name phone avatarUrl bio")
    .lean();

  const members = users.map(u => ({
    id: String(u._id),
    name: (u as any).name || "",
    phone: (u as any).phone || "",
    avatarUrl: (u as any).avatarUrl || null,
    bio: (u as any).bio || null,
  }));

  res.json({ ownerId: String(g.ownerId), members });
}

/** POST /api/chat/groups/:id/members  body: { phone } */
export async function addMemberByPhone(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;
  const { phone } = (req.body || {}) as { phone?: string };
  if (!phone) return res.status(400).json({ message: "Phone required" });

  const group = await Group.findById(id);
  if (!group) return res.status(404).json({ message: "Group not found" });

  // ✅ Only owner can add
  if (String(group.ownerId) !== uid) {
    return res.status(403).json({ message: "Only the group owner can add members." });
  }

  const clean = String(phone).replace(/[^\d+]/g, "");
  const user = await User.findOne({ phone: clean });
  if (!user) return res.status(404).json({ message: "No account with that phone" });

  const userId = user._id as Types.ObjectId;
  await Group.updateOne(
    { _id: group._id },
    { $addToSet: { members: userId } }
  );

  res.json({ ok: true });
}

/** POST /api/chat/groups/join  body: { code } */
export async function joinByCode(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const { code } = (req.body || {}) as { code?: string };
  if (!code) return res.status(400).json({ message: "Code required" });

  const group = await Group.findOne({ joinCode: String(code).trim().toUpperCase() });
  if (!group) return res.status(404).json({ message: "Invalid code" });

  await Group.updateOne(
    { _id: group._id },
    { $addToSet: { members: oid(uid) } }
  );

  res.json({ ok: true, id: String(group._id) });
}
