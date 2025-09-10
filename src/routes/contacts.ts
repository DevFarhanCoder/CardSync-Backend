import { Router, type Request, type Response, type NextFunction } from "express";
import { User } from '../models/User.js';
import { requireAuth } from "../middlewares/requireAuth.js";

const contactsRouter = Router();
contactsRouter.use(requireAuth);

/**
 * POST /api/contacts/sync
 * body: { contacts: Array<{ email?: string; name?: string; phone?: string }> }
 * returns: { matches: Array<{ userId: string; email: string; name: string; phone?: string }> }
 * Notes: We match by email or by E.164 phone (digits and '+' only).
 */
contactsRouter.post("/contacts/sync", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contacts } = (req.body || {}) as { contacts?: Array<{ email?: string; name?: string; phone?: string }> };
    const emails = Array.from(
      new Set((contacts || []).map(c => String(c.email || "").trim().toLowerCase()).filter(Boolean))
    );
    const phones = Array.from(
      new Set((contacts || []).map(c => String(c.phone || "").replace(/[^\d+]/g, "")).filter(Boolean))
    );

    if (emails.length === 0 && phones.length === 0) return res.json({ matches: [] });

    const query: any = { $or: [] as any[] };
    if (emails.length) query.$or.push({ email: { $in: emails } });
    if (phones.length) query.$or.push({ phone: { $in: phones } });

    const users = await User.find(query).select("_id email name phone").limit(1000);
    const matches = users.map(u => ({
      userId: String(u._id),
      email: u.email,
      name: u.name || "",
      phone: (u as any).phone || "",
    }));
    return res.json({ matches });
  } catch (err) { next(err); }
});

export default contactsRouter;
