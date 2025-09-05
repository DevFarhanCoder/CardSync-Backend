// src/routes/contacts.ts
import { Router, type Request, type Response, type NextFunction } from "express";
import User from "../models/User.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const contactsRouter = Router();
contactsRouter.use(requireAuth);

/**
 * POST /api/contacts/sync
 * body: { contacts: Array<{ email?: string; name?: string; phone?: string }> }
 * returns: { matches: Array<{ userId: string; email: string; name: string }> }
 */
contactsRouter.post("/contacts/sync", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contacts } = (req.body || {}) as { contacts?: Array<{ email?: string; name?: string; phone?: string }> };
    const emails = Array.from(
      new Set((contacts || []).map(c => String(c.email || "").trim().toLowerCase()).filter(Boolean))
    );
    if (emails.length === 0) return res.json({ matches: [] });

    const users = await User.find({ email: { $in: emails } }).select("_id email name").limit(500);
    const matches = users.map(u => ({ userId: String(u._id), email: u.email, name: u.name || "" }));
    return res.json({ matches });
  } catch (err) { next(err); }
});

export default contactsRouter;