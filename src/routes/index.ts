import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from './auth.js';
import { profileRouter } from './profile.js';
import { cardsRouter } from './cards.js';
import { connectionsRouter } from './connections.js';
import { analyticsRouter } from './analytics.js';

export const api = Router();
api.use('/health', healthRouter);
api.use('/v1/auth', authRouter);
api.use('/v1/profile', profileRouter);
api.use('/v1/cards', cardsRouter);
api.use('/v1/connections', connectionsRouter);
api.use('/v1/analytics', analyticsRouter);
