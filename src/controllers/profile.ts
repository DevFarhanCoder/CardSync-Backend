import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  headline: z.string().max(140).optional(),
  bio: z.string().max(1000).optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  defaultCardId: z.string().optional(),
});

export async function getProfile(req: Request & { user?: { id: string } }, res: Response) {
  const user = await User.findById(req.user!.id).lean();
  if (!user) return res.status(404).json({ error: 'Profile not found' });
  const { _id, name, email, headline, bio, company, location, defaultCardId, createdAt, updatedAt } = user as any;
  return res.json({ id: _id, name, email, headline, bio, company, location, defaultCardId, createdAt, updatedAt });
}

export async function updateProfile(req: Request & { user?: { id: string } }, res: Response) {
  const data = profileSchema.parse(req.body);
  const updated = await User.findByIdAndUpdate(req.user!.id, data, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: 'Profile not found' });
  const { _id, name, email, headline, bio, company, location, defaultCardId, createdAt, updatedAt } = updated as any;
  return res.json({ id: _id, name, email, headline, bio, company, location, defaultCardId, createdAt, updatedAt });
}
