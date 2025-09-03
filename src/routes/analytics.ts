import { Router } from "express";
import requireAuth from "../middlewares/auth.js";
import { ViewEvent, ShareEvent, Connection } from "../models/index.js";
import Card from "../models/Card.js";


const router = Router();

// POST /v1/analytics/track
router.post("/track", async (req, res) => {
    try {
        const { type, cardId, channel, ownerId } = req.body as {
            type: "view" | "share" | "connection";
            cardId?: string;
            channel?: string;
            ownerId?: string;
        };

        if (!type) return res.status(400).json({ error: "type required" });

        // Resolve ownerId from the card if not provided
        let owner = ownerId;
        if (!owner && cardId) {
            const c = await Card.findById(cardId).select("ownerId").lean();
            owner = c ? String((c as any).ownerId) : undefined;        // ← was c.owner
        }
        if (!owner) return res.status(400).json({ error: "ownerId or cardId required" });

        if (type === "view") {
            await ViewEvent.create({ userId: owner, cardId, ip: req.ip, ua: req.headers["user-agent"] });
        } else if (type === "share") {
            await ShareEvent.create({ userId: owner, cardId, channel: channel || "link" });
        } else if (type === "connection") {
            await Connection.create({
                ownerId: owner,
                name: req.body?.name,
                email: req.body?.email,
                phone: req.body?.phone,
                source: "card",
            });
        }

        return res.json({ ok: true });
    } catch (e) {
        console.error("track error:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /v1/analytics/overview
router.get("/overview", requireAuth, async (req, res) => {
    try {
        const userId = (req as any).user?._id; // from requireAuth
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const since = new Date();
        since.setDate(since.getDate() - 29);
        since.setHours(0, 0, 0, 0);

        // totals
        const [totalViews, totalShares, newConnections] = await Promise.all([
            ViewEvent.countDocuments({ userId }),
            ShareEvent.countDocuments({ userId }),
            Connection.countDocuments({ ownerId: userId, createdAt: { $gte: since } }),
        ]);

        // 30-day buckets (YYYY-MM-DD)
        const buckets: string[] = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const s = d.toISOString().slice(0, 10);
            buckets.push(s);
        }

        const aggSeries = async (Model: any, match: any) => {
            const rows = await Model.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        c: { $sum: 1 },
                    },
                },
            ]);
            const m = new Map(rows.map((r: any) => [r._id, r.c]));
            return buckets.map((d) => m.get(d) ?? 0);
        };

        const [viewsTrend, sharesTrend] = await Promise.all([
            aggSeries(ViewEvent, { userId, createdAt: { $gte: since } }),
            aggSeries(ShareEvent, { userId, createdAt: { $gte: since } }),
        ]);

        // simple engagement score
        const engagementScore = Math.round((totalViews * 0.6 + totalShares * 0.4 + newConnections * 1.2) * 10) / 10;

        // recent activity (top 10 mixed)
        const recentViews = await ViewEvent.find({ userId }).sort({ createdAt: -1 }).limit(4).lean();
        const recentShares = await ShareEvent.find({ userId }).sort({ createdAt: -1 }).limit(4).lean();
        const recentConns = await Connection.find({ ownerId: userId }).sort({ createdAt: -1 }).limit(4).lean();

        const recentActivity = [...recentViews, [...recentShares], [...recentConns].flat()]
            .flat()
            .sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt))
            .slice(0, 10)
            .map((r: any) => ({
                id: String(r._id),
                message:
                    r.channel ? "Your card was shared"
                        : r.ownerId ? "New connection added"
                            : "Your card was viewed",
                createdAt: r.createdAt,
            }));

        return res.json({
            totals: { totalViews, totalShares, newConnections, engagementScore },
            trend: viewsTrend,
            sharesTrend,
            recentActivity,
        });
    } catch (e) {
        console.error("overview error:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
