import { Router } from "express";
import requireAuth from "../middlewares/auth";
import ensureOwner from "../middlewares/ensureOwner";
import {
  listMyCards,
  getCard,           // our canonical getter
  getCardById,      // alias for compatibility
  createCard,
  updateCard,
  removeCard,
  shareCardLink,    // optional helper if you expose share
} from "../controllers/cards";

const router = Router();

// list/create
router.get("/", requireAuth, listMyCards);
router.post("/", requireAuth, createCard);

// read/update/delete
router.get("/:id", requireAuth, ensureOwner, getCard);        // canonical
router.get("/:id/by-id", requireAuth, ensureOwner, getCardById); // compatibility alias
router.patch("/:id", requireAuth, ensureOwner, updateCard);
router.delete("/:id", requireAuth, ensureOwner, removeCard);

// sharing endpoint (optional)
router.post("/:id/share", requireAuth, ensureOwner, shareCardLink);

export default router;
