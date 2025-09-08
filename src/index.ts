import { env } from "./config/env.js";
import dotenv from "dotenv";
dotenv.config();
console.log("JWT_SECRET loaded?", !!process.env.JWT_SECRET);

import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import deletionRouter from "./routes/deletion.js";

import routes from "./routes/index.js";   // aggregator for other /api routes
import { registerSocket } from "./socket.js";
import cardsRouter from "./routes/cards.js";
import requireAuth from "./middlewares/auth.js";

const app = express();

// ❌ REMOVE: unused constant & duplicate CORS
// const allowedOrigins = [
//   "http://localhost:3000",
//   "http://127.0.0.1:3000",
//   "https://instantllycards.com"
// ];

// ❌ REMOVE this hardcoded CORS (it overrides prod)
// app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// ✅ KEEP a single, env-driven CORS:
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server, Postman, etc.
    if (env.corsOrigin.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());
app.use(morgan("tiny"));
app.use("/uploads", express.static("uploads"));

/* Mount cards under /api/cards (auth here so router doesn't need to repeat it) */
app.use("/api/cards", requireAuth, cardsRouter);

/* Mount the rest of your /api routes once (no duplicates) */
app.use("/api", routes);

/* Mount deletion request route */
app.use("/api/account-deletion", deletionRouter);

/* Simple health checks */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* Error handler (keep after routes) */
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

    const http = await import("http");
    const server = http.createServer(app);
    registerSocket(server); // your socket.js already sets permissive CORS

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
