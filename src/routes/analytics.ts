import { Router } from "express";
import { getCardAnalytics, incrementCardMetric } from "../controllers/analytics.js";
import { requireAuth } from "../middlewares/auth.js";
import { ensureCardOwner } from "../middlewares/ensureOwner.js";
import { overview } from "../controllers/analytics.js";

const router = Router();

/** Owner-only read: must be authed AND own the card */
router.get("/card/:id", requireAuth, ensureCardOwner, getCardAnalytics);
router.get("/overview", overview);
/** Public increments: anyone can record view/click/share/save */
router.post("/card/:id/increment", incrementCardMetric);

export default router;
