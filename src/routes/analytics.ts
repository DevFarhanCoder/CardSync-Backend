import { Router } from "express";
import requireAuth from "../middlewares/auth.js";

const router = Router();

/** GET /api/analytics/overview
 *  Add your real KPIs here; returning static shape to stop 404s and unblock UI.
 */
router.get("/analytics/overview", requireAuth, async (_req, res) => {
  res.json({
    totalViews: 0,
    totalShares: 0,
    uniqueVisitors: 0,
    topCards: [],
    series: [],
  });
});

export default router;
