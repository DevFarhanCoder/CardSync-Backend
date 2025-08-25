import { Router } from "express";
import { searchPublic } from "../controllers/cards.js";

const router = Router();

// GET /api/explore?q=software
router.get("/", searchPublic);

export default router;
