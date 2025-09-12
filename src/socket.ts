import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";

export function registerSocket(server: HTTPServer, _server: any) {
  const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    socket.on("room:join", ({ roomId }) => roomId && socket.join(roomId));
    socket.on("room:leave", ({ roomId }) => roomId && socket.leave(roomId));

    socket.on("room:send", ({ id, roomId, text }) => {
      if (!id || !roomId || !text) return;
      const payload = { id, roomId, text, authorId: socket.id, createdAt: Date.now() };
      socket.to(roomId).emit("room:message", payload);
      socket.emit("room:message", payload); // ack to sender
    });

    socket.on("disconnect", () => console.log("socket disconnected:", socket.id));
  });

  return io;
}
