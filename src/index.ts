import dotenv from "dotenv";
dotenv.config();

import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

import routes from "./routes/index.js";   // <-- single aggregator for all /api routes
import { registerSocket } from "./socket";
// src/index.ts


const app = express();

/* Middleware */
app.use(cors());                          // add options here if you want to restrict origins
app.use(express.json());
app.use(morgan("tiny"));
app.use("/api", routes);
app.use("/uploads", express.static("uploads"));

async function start() {
  try {
    const uri = process.env.MONGODB_URI as string;
    if (!uri) throw new Error("Missing MONGODB_URI");
    await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
    console.log("✅ Mongo connected");

    /* Mount everything under /api */
    app.use("/api", routes);

    /* Simple health checks */
    app.get("/health", (_req, res) => res.json({ ok: true }));      // plain health
    // /api/health is handled by routes/index.ts (see below)

    const http = await import("http");
    const server = http.createServer(app);
    registerSocket(server);

    /* Error handler */
    const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    };
    app.use(errorHandler);

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
