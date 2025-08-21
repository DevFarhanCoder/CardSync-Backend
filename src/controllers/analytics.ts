// src/controllers/analytics.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { Event } from '../models/Event.js';
import mongoose from 'mongoose';

const eventSchema = z.object({
  event_type: z.string().min(1),
  card_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const supabase = env.supabaseUrl && env.supabaseServiceKey
  ? createClient(env.supabaseUrl, env.supabaseServiceKey, { auth: { persistSession: false } })
  : null;

export async function trackEvent(req: Request & { user?: { id: string } }, res: Response) {
  const payload = eventSchema.parse(req.body);
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') as string;
  const userAgent = req.headers['user-agent'] || '';

  const evt = await Event.create({
    userId: req.user!.id,
    eventType: payload.event_type,
    cardId: payload.card_id,
    metadata: payload.metadata || {},
    ip,
    userAgent,
  });

  if (supabase) {
    await supabase.from(`${env.supabaseSchema}.events`).insert({
      user_id: req.user!.id,
      event_type: payload.event_type,
      card_id: payload.card_id,
      metadata: payload.metadata || {},
      ip,
      user_agent: userAgent,
    });
  }

  return res.status(201).json({ id: evt._id });
}

// NEW: return totals + 30-day trends (all zero if no data)
export async function getOverview(req: Request & { user?: { id: string } }, res: Response) {
  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Totals (views/shares/connections)
  const totals = await Event.aggregate([
    { $match: { userId, createdAt: { $gte: since } } },
    { $group: { _id: '$eventType', count: { $sum: 1 } } }
  ]);

  const get = (k: string) => totals.find(t => t._id === k)?.count || 0;

  const totalViews = get('view');
  const totalShares = get('share');
  const newConnections = get('connection');

  // Naive engagement score (can tune later)
  const engagementScore = Math.max(0, Math.round(
    totalViews * 1 + totalShares * 2 + newConnections * 3
  ));

  // 30-day simple trend per day for 'view'
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const trendMap: Record<string, number> = {};
  const events = await Event.find({ userId, createdAt: { $gte: since } })
                            .select({ createdAt: 1, eventType: 1 }).lean();
  for (const e of events) {
    if (e.eventType !== 'view') continue;
    const k = dayKey(e.createdAt as unknown as Date);
    trendMap[k] = (trendMap[k] || 0) + 1;
  }
  const trend: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    trend.push(trendMap[dayKey(d)] || 0);
  }

  return res.json({
    totals: { totalViews, totalShares, newConnections, engagementScore },
    trend, // array of 30 values
    recentActivity: [] // let frontend fill from other endpoints later
  });
}
