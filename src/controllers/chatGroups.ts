// src/controllers/chatGroups.ts
import type { Request, Response } from "express";
import { AuthedRequest } from "../middlewares/auth.js";

// Minimal group shape used by responses (no DB access yet)
type GroupShape = {
  id: string;
  name: string;
  description?: string;
  photoUrl?: string;
  ownerId?: string;
  admins?: string[];
  members?: string[];
  joinCode?: string;
};

/** GET /api/chat/groups – list current user's groups */
export async function listMyGroups(_req: AuthedRequest, res: Response) {
  const groups: GroupShape[] = []; // TODO: fetch from DB
  return res.json({ groups });
}

/** GET /api/chat/groups/:id – get one */
export async function getGroupById(req: Request, res: Response) {
  const id = String(req.params.id || "");
  if (!id) return res.status(400).json({ error: "id required" });

  const group: GroupShape = {
    id,
    name: "Untitled Group",
    description: "",
    photoUrl: "",
    ownerId: "",
    admins: [],
    members: [],
    joinCode: "",
  };
  return res.json(group);
}

/** POST /api/chat/groups – create */
export async function createGroup(req: AuthedRequest, res: Response) {
  const body: any = (req as any).body ?? {};
  const name: string = String(body.name || "");
  const description: string = String(body.description || "");
  if (!name) return res.status(400).json({ error: "name required" });

  const group: GroupShape = {
    id: "temp-id",
    name,
    description,
    photoUrl: "",
    ownerId: String((req as any).userId || ""),
    admins: [],
    members: [String((req as any).userId || "")],
    joinCode: "JOIN123",
  };
  return res.json(group);
}

/** PATCH /api/chat/groups/:id – update (stub) */
export async function updateGroup(req: Request, res: Response) {
  const id = String(req.params.id || "");
  if (!id) return res.status(400).json({ error: "id required" });
  // Apply updates here later
  return res.json({ ok: true });
}

/** DELETE /api/chat/groups/:id – delete (stub) */
export async function deleteGroup(req: Request, res: Response) {
  const id = String(req.params.id || "");
  if (!id) return res.status(400).json({ error: "id required" });
  return res.json({ ok: true });
}

/** POST /api/chat/groups/join – join by code (stub) */
export async function joinByCode(req: AuthedRequest, res: Response) {
  const code = String(((req as any).body || {}).code || "");
  if (!code) return res.status(400).json({ error: "code required" });
  // Add the requester to the group with this code
  return res.json({ ok: true, code });
}
