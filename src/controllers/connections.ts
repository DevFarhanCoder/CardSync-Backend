import { Request, Response } from 'express';
import { z } from 'zod';
import { Connection } from '../models/Connection.js';

const createSchema = z.object({
  withUserId: z.string().min(1),
  note: z.string().max(500).optional(),
});

const updateSchema = z.object({
  status: z.enum(['pending','accepted','declined']),
  note: z.string().max(500).optional(),
});

export async function listConnections(req: Request & { user?: { id: string } }, res: Response) {
  const items = await Connection.find({ userId: req.user!.id }).sort({ createdAt: -1 }).lean();
  res.json(items.map(i => ({ id: i._id, ...i })));
}

export async function createConnection(req: Request & { user?: { id: string } }, res: Response) {
  const payload = createSchema.parse(req.body);
  const conn = await Connection.create({ userId: req.user!.id, ...payload });
  const created = await Connection.findById(conn._id).lean();
  res.status(201).json({ id: created!._id, ...created });
}

export async function updateConnection(req: Request & { user?: { id: string } }, res: Response) {
  const payload = updateSchema.parse(req.body);
  const updated = await Connection.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    payload,
    { new: true }
  ).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ id: updated._id, ...updated });
}
