// routes/groups.ts
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { createRoom, joinRoom, leaveRoom, makeAdmin, removeMember, getRoomInfo, listRooms } from "../store";

const r = Router();
r.get("/rooms", (_req, res) => res.json([]));
r.use(requireAuth);

r.post("/rooms", async (req, res) => {
  const { name } = req.body;
  const room = await createRoom({ name, createdBy: req.user.id });
  res.json(room);
});

r.post("/rooms/join", async (req, res) => {
  const { code } = req.body; // your 5-digit code
  const room = await joinRoom({ userId: req.user.id, code });
  res.json(room);
});

r.post("/rooms/:roomId/leave", async (req, res) => {
  await leaveRoom({ roomId: req.params.roomId, userId: req.user.id });
  res.json({ ok: true });
});

r.post("/rooms/:roomId/make-admin", async (req, res) => {
  const { userId } = req.body;
  await makeAdmin({ roomId: req.params.roomId, actorId: req.user.id, userId });
  res.json({ ok: true });
});

r.post("/rooms/:roomId/remove", async (req, res) => {
  const { userId } = req.body;
  await removeMember({ roomId: req.params.roomId, actorId: req.user.id, userId });
  res.json({ ok: true });
});

r.get("/rooms/:roomId", async (req, res) => {
  const info = await getRoomInfo(req.params.roomId);
  res.json(info);
});

r.get("/rooms", async (req, res) => {
  const rooms = await listRooms(req.user.id);
  res.json(rooms);
});

export default r;
