// src/controllers/public.ts
import type { Request, Response } from "express";

/** GET /api/public/search?q=... */
export async function searchPublic(req: Request, res: Response) {
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
  return res.json({ id, name: "Untitled" });
}

/** GET /api/public */
export async function listPublic(_req: Request, res: Response) {
  return res.json({ items: [] as Array<{ id: string; name: string }> });
}

/** --- Aliases expected by routes/public.ts --- */

// GET /api/public/profile/:handle
export async function getPublicProfileByHandle(req: Request, res: Response) {
  const handle = String(req.params.handle || "");
  if (!handle) return res.status(400).json({ error: "handle required" });
  return res.json({ id: handle, handle, name: `@${handle}` });
}

// GET /api/public/card/:slug
export async function getPublicCardBySlug(req: Request, res: Response) {
  const slug = String(req.params.slug || "");
  if (!slug) return res.status(400).json({ error: "slug required" });
  return res.json({ id: slug, slug, name: `Card ${slug}` });
}
