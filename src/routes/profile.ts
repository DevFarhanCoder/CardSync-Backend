import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { getProfile, updateProfile } from '../controllers/profile.js';

export const profileRouter = Router();
profileRouter.get('/', requireAuth, getProfile);
profileRouter.put('/', requireAuth, updateProfile);
