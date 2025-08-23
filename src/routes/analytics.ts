// src/routes/analytics.ts
import { Router } from 'express';
const router = Router();

router.get('/overview', async (req, res) => {
  // TODO: compute analytics
  return res.json({ users: 0, cards: 0, views: 0 });
});

export default router;
