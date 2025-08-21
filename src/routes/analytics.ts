// src/routes/analytics.ts
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { trackEvent, getOverview } from '../controllers/analytics.js';

export const analyticsRouter = Router();
analyticsRouter.post('/event', requireAuth, trackEvent);
analyticsRouter.get('/overview', requireAuth, getOverview); // <-- new
