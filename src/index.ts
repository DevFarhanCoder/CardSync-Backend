import "dotenv/config";
import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";

// routers you already have
import deletionRouter from "./routes/deletion.js";
import routes from "./routes/index.js";
import { registerSocket } from "./socket.js";
import cardsRouter from "./routes/cards.js";
import requireAuth from "./middlewares/auth.js";
import chatGroupsRouter from "./routes/chatGroups.js";
import contactsRouter from "./routes/contacts.js";
import usersRouter from "./routes/users.js";
import directRouter from "./routes/direct.js";

const app = express();

/** behind proxy so secure cookies work on Render/HTTPS */
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("tiny"));
app.use(
  cors({
    origin: [
      "https://instantllycards.com",
      "https://www.instantllycards.com",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

/** static uploads (and make sure folder exists) */
const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

/** health */
app.get("/health", (_req, res) => res.json({ ok: true }));

/** mount routes (keep order stable) */
app.use("/api/cards", requireAuth, cardsRouter);
app.use("/api", routes);
app.use("/api", usersRouter);
app.use("/api/account-deletion", deletionRouter);
app.use("/api", chatGroupsRouter);
app.use("/api/direct", directRouter);
app.use("/api", contactsRouter);

/** error handler */
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Server error" });
};
app.use(errorHandler);

async function start() {
  try {
    const uri = process.env.MONGODB_URI as string;
    if (!uri) throw new Error("Missing MONGODB_URI");
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || undefined,
    });
    console.log("✅ Mongo connected");

    const http = await import("http");
    const server = http.createServer(app);
    registerSocket(server);

    const port = Number(process.env.PORT || 8080);
    server.listen(port, () =>
      console.log(`🚀 API listening on http://localhost:${port}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
