import type { Request, Response } from "express";

/** GET /api/public/search?q=... */
export async function searchPublic(req: Request, res: Response) {
  // TODO: plug in your real search later
  const q = String(req.query.q ?? "").trim();
  return res.json({
    q,
    results: [] as Array<{ id: string; name: string }>,
  });
}

/** GET /api/public/:id */
export async function getPublicById(req: Request, res: Response) {
  const id = String(req.params.id || "");
  if (!id) return res.status(400).json({ error: "id required" });
  // TODO: fetch real doc
  return res.json({ id, name: "Untitled" });
}

/** GET /api/public */
export async function listPublic(_req: Request, res: Response) {
  // TODO: fetch real list
  return res.json({ items: [] as Array<{ id: string; name: string }> });
}
