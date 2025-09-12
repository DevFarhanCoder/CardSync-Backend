import type { Response } from "express";
import { AuthedRequest } from "../middlewares/auth.js";
import { User } from "../models/User.js";

/** GET /api/users/me */
export const me = async (req: AuthedRequest, res: Response) => {
  try {
    const doc = await User.findById((req as any).userId).lean().exec();
    if (!doc) return res.status(404).json({ error: "User not found" });

    const u: any = doc as any; // <-- relax types to avoid TS property errors
    return res.json({
      id: String(u?._id ?? ""),
      email: u?.email ?? "",
      name: u?.name ?? "",
      phone: u?.phone ?? "",
      about: u?.about ?? "",
      avatarUrl: u?.avatarUrl ?? "",
    });
  } catch (_e) {
    return res.status(500).json({ error: "Internal error" });
  }
};

/** PATCH /api/users/me */
export const updateMe = async (req: AuthedRequest, res: Response) => {
  try {
    const body: any = (req as any).body ?? {};
    const update: any = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.about !== undefined) update.about = body.about;
    if (body.avatarUrl !== undefined) update.avatarUrl = body.avatarUrl;

    const doc = await User.findByIdAndUpdate((req as any).userId, update, {
      new: true,
    })
      .lean()
      .exec();
    if (!doc) return res.status(404).json({ error: "User not found" });

    const u: any = doc as any;
    return res.json({
      id: String(u?._id ?? ""),
      email: u?.email ?? "",
      name: u?.name ?? "",
      phone: u?.phone ?? "",
      about: u?.about ?? "",
      avatarUrl: u?.avatarUrl ?? "",
    });
  } catch (_e) {
    return res.status(500).json({ error: "Internal error" });
  }
};
