import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Card } from '../models/Card.js';
import { User } from '../models/User.js';

const linkSchema = z.object({ label: z.string().min(1), url: z.string().url() });
const createCardSchema = z.object({
  title: z.string().min(1),
  tagline: z.string().optional(),
  links: z.array(linkSchema).optional().default([]),
  theme: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});
const updateCardSchema = createCardSchema.partial();

export async function listCards(req: Request & { user?: { id: string } }, res: Response) {
  const items = await Card.find({ userId: req.user!.id }).sort({ createdAt: -1 }).lean();
  res.json(items.map(i => ({ id: i._id, ...i })));
}

export async function createCard(req: Request & { user?: { id: string } }, res: Response) {
  const payload = createCardSchema.parse(req.body);
  const card = await Card.create({ userId: req.user!.id, ...payload });
  if (payload.isDefault) {
    await User.findByIdAndUpdate(req.user!.id, { defaultCardId: card._id });
  }
  const created = await Card.findById(card._id).lean();
  res.status(201).json({ id: created!._id, ...created });
}

export async function getCard(req: Request & { user?: { id: string } }, res: Response) {
  const card = await Card.findOne({ _id: req.params.id, userId: req.user!.id }).lean();
  if (!card) return res.status(404).json({ error: 'Not found' });
  res.json({ id: card._id, ...card });
}

export async function updateCard(req: Request & { user?: { id: string } }, res: Response) {
  const payload = updateCardSchema.parse(req.body);
  const card = await Card.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    payload,
    { new: true }
  ).lean();
  if (!card) return res.status(404).json({ error: 'Not found' });
  if (payload.isDefault === true) {
    await User.findByIdAndUpdate(req.user!.id, { defaultCardId: card._id });
  }
  res.json({ id: card._id, ...card });
}

export async function deleteCard(req: Request & { user?: { id: string } }, res: Response) {
  await Card.deleteOne({ _id: req.params.id, userId: req.user!.id });
  res.status(204).send();
}
