import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { listConnections, createConnection, updateConnection } from '../controllers/connections.js';

export const connectionsRouter = Router();
connectionsRouter.get('/', requireAuth, listConnections);
connectionsRouter.post('/', requireAuth, createConnection);
connectionsRouter.patch('/:id', requireAuth, updateConnection);
