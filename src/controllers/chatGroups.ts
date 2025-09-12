import type { Request, Response } from "express";
import { Types } from "mongoose";
import crypto from "node:crypto";
import { Group } from "../models/Group.js";
import { User } from "../models/User.js";

/** Utility */
const oid = (s: string) => new Types.ObjectId(String(s));

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

/** Generate short join code (A–Z, 0–9) */
function genJoinCode() {
  return crypto.randomBytes(3).toString("base64url").slice(0, 6).toUpperCase();
}

/** GET /api/chat/groups — only groups the viewer is a member of */
export async function listMyGroups(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const me = oid(uid);
  const groups = await Group.find({
    $or: [{ ownerId: me }, { members: me }],
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  res.json({
    items: groups.map((g: any) => ({
      id: String(g._id),
      name: g.name,
      ownerId: String(g.ownerId),
      joinCode: g.joinCode,
      lastMessageText: g.lastMessageText || null,
      lastMessageAt: g.lastMessageAt || null,
      photoUrl: g.photoUrl || null,
    })),
  });
}

/** POST /api/chat/groups { name } — create + auto-admin/member + code */
export async function createGroup(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const { name } = (req.body || {}) as { name?: string };
  if (!name || !name.trim()) return res.status(400).json({ message: "Name required" });

  const code = genJoinCode();
  const me = oid(uid);
  const doc = await Group.create({
    name: name.trim(),
    ownerId: me,
    joinCode: code,
    members: [me],
    admins: [me],
  });

  res.status(201).json({
    group: {
      id: String(doc._id),
      name: doc.name,
      ownerId: String(doc.ownerId),
      joinCode: doc.joinCode,
      lastMessageText: null,
      lastMessageAt: null,
      photoUrl: doc.photoUrl || null,
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

  const allMemberIds = Array.from(
    new Set<string>([String(g.ownerId), ...(g.members || []).map((m: any) => String(m))])
  );

  const isMember = allMemberIds.includes(uid);
  if (!isMember) return res.status(403).json({ message: "Forbidden" });

  // Pull any existing user docs; if some are missing, still return placeholders
  const users = await User.find({ _id: { $in: allMemberIds.map(oid) } })
    .select("_id name phone avatarUrl bio email")
    .lean();

  const userMap = new Map<string, any>();
  for (const u of users) userMap.set(String(u._id), u);

  const adminsSet = new Set<string>([(g.admins || []).map(String), String(g.ownerId)].flat());

  const members = allMemberIds.map((idStr) => {
    const u = userMap.get(idStr);
    return {
      id: idStr,
      name: u?.name || "",
      phone: u?.phone || "",
      email: u?.email || "",
      avatarUrl: u?.avatarUrl || null,
      bio: u?.bio || null,
      isAdmin: adminsSet.has(idStr),
    };
  });

  res.json({
    viewerId: uid,
    viewerIsOwner: String(g.ownerId) === uid,
    ownerId: String(g.ownerId),
    admins: Array.from(adminsSet),
    members,
    joinCode: g.joinCode,
    name: g.name,
    description: g.description || "",
    photoUrl: g.photoUrl || null,
  });
}

/** POST /api/chat/groups/:id/members  { phone } — Admin only */
export async function addMemberByPhone(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  const { id } = req.params;
  const { phone } = (req.body || {}) as { phone?: string };
  if (!phone) return res.status(400).json({ message: "Phone required" });

  const g = await Group.findById(id);
  if (!g) return res.status(404).json({ message: "Group not found" });

  const isAdmin = String(g.ownerId) === uid || (g.admins || []).some(a => String(a) === uid);
  if (!isAdmin) return res.status(403).json({ message: "Only admins can add members." });

  const clean = String(phone).replace(/[^\d+]/g, "");
  const user = await User.findOne({ phone: clean });
  if (!user) return res.status(404).json({ message: "No account with that phone" });

  await Group.updateOne({ _id: g._id }, { $addToSet: { members: user._id } });
  res.json({ ok: true });
}

/** POST /api/chat/groups/:id/members/bulk  { phones: string[] } — Admin only */
export async function addMembersBulk(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  const { id } = req.params;
  const { phones } = (req.body || {}) as { phones?: string[] };
  if (!Array.isArray(phones) || phones.length === 0) return res.status(400).json({ message: "phones[] required" });

  const g = await Group.findById(id);
  if (!g) return res.status(404).json({ message: "Group not found" });
  const isAdmin = String(g.ownerId) === uid || (g.admins || []).some(a => String(a) === uid);
  if (!isAdmin) return res.status(403).json({ message: "Only admins can add members." });

  const cleaned = phones.map(s => String(s).replace(/[^\d+]/g, "")).filter(Boolean);
  const users = await User.find({ phone: { $in: cleaned } }).select("_id").lean();
  await Group.updateOne({ _id: g._id }, { $addToSet: { members: { $each: users.map(u => u._id) } } });
  res.json({ ok: true, added: users.length });
}

/** POST /api/chat/groups/:id/admins  { userId, action: 'add'|'remove' } — Owner only */
export async function modifyAdmin(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  const { id } = req.params;
  const { userId, action } = (req.body || {}) as { userId?: string; action?: "add" | "remove" };
  if (!userId || !action) return res.status(400).json({ message: "userId and action required" });

  const g = await Group.findById(id);
  if (!g) return res.status(404).json({ message: "Group not found" });

  // Only owner can modify admins (safer)
  if (String(g.ownerId) != uid) return res.status(403).json({ message: "Only owner can change admins." });
  if (String(userId) === String(g.ownerId)) return res.status(400).json({ message: "Owner is always admin." });

  if (action === "add") {
    await Group.updateOne({ _id: g._id }, { $addToSet: { admins: oid(userId) } });
  } else {
    await Group.updateOne({ _id: g._id }, { $pull: { admins: oid(userId) } });
  }
  res.json({ ok: true });
}

/** POST /api/chat/groups/:id/members/remove  { userId } — Admin only */
export async function removeMember(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  const { id } = req.params;
  const { userId } = (req.body || {}) as { userId?: string };
  if (!userId) return res.status(400).json({ message: "userId required" });

  const g = await Group.findById(id);
  if (!g) return res.status(404).json({ message: "Group not found" });
  const isAdmin = String(g.ownerId) === uid || (g.admins || []).some(a => String(a) === uid);
  if (!isAdmin) return res.status(403).json({ message: "Only admins can remove members." });
  if (String(userId) === String(g.ownerId)) return res.status(400).json({ message: "Cannot remove owner." });

  await Group.updateOne({ _id: g._id }, { $pull: { members: oid(userId), admins: oid(userId) } });
  res.json({ ok: true });
}

/** POST /api/chat/groups/join  { code } — Anyone with code (must be logged in) */
export async function joinByCode(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });

  const { code } = (req.body || {}) as { code?: string };
  if (!code) return res.status(400).json({ message: "Code required" });

  const group = await Group.findOne({ joinCode: String(code).trim().toUpperCase() });
  if (!group) return res.status(404).json({ message: "Invalid code" });

  await Group.updateOne({ _id: group._id }, { $addToSet: { members: oid(uid) } });
  res.json({ ok: true, id: String(group._id) });
}

/** PATCH /api/chat/groups/:id/settings  { name?, description? } — Admin only */
export async function updateSettings(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  const { id } = req.params;
  const { name, description } = (req.body || {}) as { name?: string; description?: string };

  const g = await Group.findById(id);
  if (!g) return res.status(404).json({ message: "Group not found" });
  const isAdmin = String(g.ownerId) === uid || (g.admins || []).some(a => String(a) === uid);
  if (!isAdmin) return res.status(403).json({ message: "Only admins can update settings." });

  if (typeof name === "string" && name.trim()) g.name = name.trim();
  if (typeof description === "string") g.description = description.trim();
  await g.save();
  res.json({ ok: true });
}

/** POST /api/chat/groups/:id/leave — Member leaves group (owner cannot leave) */
export async function leaveGroup(req: Request, res: Response) {
  const uid = getReqUserId(req);
  if (!uid) return res.status(401).json({ message: "Unauthorized" });
  const { id } = req.params;

  const g = await Group.findById(id);
  if (!g) return res.status(404).json({ message: "Group not found" });

  if (String(g.ownerId) === uid) {
    return res.status(400).json({ message: "Owner cannot leave. Transfer ownership or delete the group." });
  }

  await Group.updateOne(
    { _id: g._id },
    { $pull: { members: oid(uid), admins: oid(uid) } }
  );

  res.json({ ok: true });
}
