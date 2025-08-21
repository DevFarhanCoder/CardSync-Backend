import { Router } from 'express';
import { register, login, me } from '../controllers/auth.js';
import { requireAuth } from '../middlewares/auth.js';

export const authRouter = Router();
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', requireAuth, me);
