import type { Request, Response } from "express";
import { User } from '../models/User.js';

/** GET /api/profile/me */
export const getMe = async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
  const user = await User.findById(req.userId).lean();
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name ?? "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
};

/** PATCH /api/profile */
export const updateMe = async (req: Request & { userId?: string }, res: Response) => {
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
  const payload = req.body as Partial<{ name: string }>;
  const user = await User.findByIdAndUpdate(req.userId, { $set: payload }, { new: true }).lean();
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: { _id: user._id, email: user.email, name: user.name ?? "" } });
};

/** Aliases to match routes that expect getProfile/updateProfile */
export const getProfile = getMe;
export const updateProfile = updateMe;
