import type { Request, Response, NextFunction } from "express";
import { Card } from '../models/Card';

export default async function ensureOwner(
  req: Request & { userId?: string },
  res: Response,
  next: NextFunction
) {
  const owner = req.userId as string;
  const { id } = req.params;
  if (!owner) return res.status(401).json({ message: "Unauthorized" });

  const exists = await Card.exists({ _id: id, userId: owner });
  if (!exists) return res.status(403).json({ message: "Forbidden" });
  next();
}
