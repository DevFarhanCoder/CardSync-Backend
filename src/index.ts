import dotenv from "dotenv";
dotenv.config();

import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

import requireAuth from "./middlewares/auth.js";

// Routers
import authRouter from "./routes/auth.js";          // ⬅️ your auth routes (login/register/refresh/logout)
import usersRouter from "./routes/users.js";
import cardsRouter from "./routes/cards.js";
import chatGroupsRouter from "./routes/chatGroups.js";
import contactsRouter from "./routes/contacts.js";
import directRouter from "./routes/direct.js";
import deletionRouter from "./routes/deletion.js";

const app = express();

// trust proxy for correct secure cookies behind Render/Cloudflare
app.set("trust proxy", 1);

// CORS — include both apex and www
const ALLOWED = [
  "https://instantllycards.com",
  "https://www.instantllycards.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
app.use(cors({
  origin: (origin, cb) => (!origin || ALLOWED.includes(origin)) ? cb(null, true) : cb(new Error("Not allowed by CORS")),
  credentials: true,
}));

app.use(express.json());
app.use(morgan("tiny"));
app.use("/uploads", express.static("uploads"));

// ----------------------- PUBLIC -----------------------
app.use("/api/auth", authRouter);     // ⬅️ login must be here (no requireAuth)
app.get("/health", (_req, res) => res.json({ ok: true }));

// ----------------------- PROTECTED --------------------
app.use("/api/cards", requireAuth, cardsRouter);

// gate all remaining /api routes
app.use("/api", requireAuth, usersRouter);
app.use("/api", requireAuth, directRouter);
app.use("/api", requireAuth, chatGroupsRouter);
app.use("/api", requireAuth, contactsRouter);
app.use("/api/account-deletion", requireAuth, deletionRouter);

// --------------------- ERRORS -------------------------
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
};
app.use(errorHandler);

// --------------------- START --------------------------
(async function start() {
  const uri = process.env.MONGODB_URI as string;
  if (!uri) throw new Error("Missing MONGODB_URI");
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
  console.log("✅ Mongo connected");

  const { createServer } = await import("http");
  const server = createServer(app);
  const { registerSocket } = await import("./socket.js");
  registerSocket(server);

  const port = Number(process.env.PORT || 8080);
  server.listen(port, () => console.log(`🚀 API listening on :${port}`));
})();
