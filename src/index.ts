import { env } from "./config/env.js";
import dotenv from "dotenv";
dotenv.config();

import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

// Routers / utils
import cardsRouter from "./routes/cards.js";
import chatGroupsRouter from "./routes/chatGroups.js";
import contactsRouter from "./routes/contacts.js";
import usersRouter from "./routes/users.js";
import directRouter from "./routes/direct.js";
import deletionRouter from "./routes/deletion.js";
import requireAuth from "./middlewares/auth.js";
import { registerSocket } from "./socket.js";
import routes from "./routes/index.js";

const app = express();

// Single, env-based CORS (no duplicates)
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Postman/server-to-server
      if (env.corsOrigin.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("tiny"));

// ✅ ESM-safe static serving (no require)
app.use("/uploads", express.static("uploads"));

// Authenticated cards routes
app.use("/api/cards", requireAuth, cardsRouter);

// Other /api routes (no duplicates)
app.use("/api", usersRouter);
app.use("/api", directRouter);
app.use("/api", chatGroupsRouter);
app.use("/api", contactsRouter);
app.use("/api/account-deletion", deletionRouter);

// Health
app.use("/api", routes);
app.get("/health", (_req, res) => res.json({ ok: true }));

// Error handler
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
};
app.use(errorHandler);

async function start() {
  try {
    const uri = process.env.MONGODB_URI as string;
    if (!uri) throw new Error("Missing MONGODB_URI");
    await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
    console.log("✅ Mongo connected");

    const { createServer } = await import("http");
    const server = createServer(app);
    registerSocket(server);

    const port = Number(process.env.PORT || 8080);
    server.listen(port, () => console.log(`🚀 API listening on http://localhost:${port}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
