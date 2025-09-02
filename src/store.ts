import Room from "./models/Room.js";
import RoomMember from "./models/RoomMember.js";
import Message from "./models/Message.js";

export async function createRoom({ name, createdBy }: { name: string; createdBy: string; }) {
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  const room = await Room.create({ name, createdBy, code });
  await RoomMember.create({ roomId: room.id, userId: createdBy, role: "admin" });
  return { id: room.id, name: room.name, code: room.code, createdBy: room.createdBy, createdAt: room.createdAt };
}

export async function joinRoom({ userId, code }: { userId: string; code: string; }) {
  const room = await Room.findOne({ code }).lean();
  if (!room) throw new Error("Invalid code");
  await RoomMember.updateOne(
    { roomId: room._id.toString(), userId },
    { $setOnInsert: { role: "member", joinedAt: Date.now() } },
    { upsert: true }
  );
  return { id: room._id.toString(), name: room.name, code: room.code };
}

export async function leaveRoom({ roomId, userId }: { roomId: string; userId: string; }) {
  await RoomMember.deleteOne({ roomId, userId });
}

export async function makeAdmin({ roomId, actorId, userId }: { roomId: string; actorId: string; userId: string; }) {
  const actor = await RoomMember.findOne({ roomId, userId: actorId }).lean();
  if (!actor || actor.role !== "admin") throw new Error("Not allowed");
  await RoomMember.updateOne({ roomId, userId }, { $set: { role: "admin" } });
}

export async function removeMember({ roomId, actorId, userId }: { roomId: string; actorId: string; userId: string; }) {
  const actor = await RoomMember.findOne({ roomId, userId: actorId }).lean();
  if (!actor || actor.role !== "admin") throw new Error("Not allowed");
  await RoomMember.deleteOne({ roomId, userId });
}

export async function getRoomInfo(roomId: string) {
  const room = await Room.findById(roomId).lean();
  if (!room) throw new Error("Room not found");
  const members = await RoomMember.find({ roomId }).lean();
  return {
    id: room._id.toString(),
    name: room.name,
    createdBy: room.createdBy,
    createdAt: room.createdAt,
    members: members.map(m => ({ userId: m.userId, role: m.role })),
  };
}

export async function listRooms(userId: string) {
  const memberships = await RoomMember.find({ userId }).lean();
  const roomIds = memberships.map(m => m.roomId);
  const rooms = await Room.find({ _id: { $in: roomIds } }).lean();
  return rooms.map(r => ({ id: r._id.toString(), name: r.name, code: r.code }));
}

export async function persistMessage(m: { id: string; roomId: string; text: string; authorId: string; createdAt: number; }) {
  await Message.updateOne({ id: m.id }, { $setOnInsert: m }, { upsert: true });
}

export async function getRecentMessages(roomId: string, limit = 100) {
  const msgs = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(limit).lean();
  return msgs.map(x => ({ id: x.id, roomId: x.roomId, text: x.text, authorId: x.authorId, createdAt: x.createdAt }));
}
