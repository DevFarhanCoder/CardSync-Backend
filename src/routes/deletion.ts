// src/routes/deletion.ts
import { Router } from "express";
import { createDeletionRequest } from "../controllers/deletion.js";

const router = Router();
router.post("/", createDeletionRequest);

export default router;
