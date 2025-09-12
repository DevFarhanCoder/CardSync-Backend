import type { Response } from "express";
import { AuthedRequest } from "../middlewares/auth.js";
import { User } from "../models/User.js";

/** GET /api/profile (or /api/users/me) */
export async function getProfile(req: AuthedRequest, res: Response) {
  try {
    const userId = (req as any).userId;
    const doc = await User.findById(userId).lean().exec(); // <- single doc, not array
    if (!doc) return res.status(404).json({ error: "User not found" });
    const u: any = doc;

    return res.json({
      id: String(u?._id ?? ""),
      email: u?.email ?? "",
      name: u?.name ?? "",
      createdAt: u?.createdAt ?? null,
      updatedAt: u?.updatedAt ?? null,
    });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
}

/** PATCH /api/profile (or /api/users/me) */
export async function updateProfile(req: AuthedRequest, res: Response) {
  try {
    const userId = (req as any).userId;
    const body: any = (req as any).body ?? {};
    const update: any = {};
    if (body.name !== undefined) update.name = body.name;

    const doc = await User.findByIdAndUpdate(userId, update, { new: true }).lean().exec();
    if (!doc) return res.status(404).json({ error: "User not found" });
    const u: any = doc;

    return res.json({
      id: String(u?._id ?? ""),
      email: u?.email ?? "",
      name: u?.name ?? "",
      createdAt: u?.createdAt ?? null,
      updatedAt: u?.updatedAt ?? null,
    });
  } catch {
    return res.status(500).json({ error: "Internal error" });
  }
}

/* Aliases for routes that expect these names */
export const me = getProfile;
export const updateMe = updateProfile;
