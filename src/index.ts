// src/index.ts
import dotenv from "dotenv";
dotenv.config();

import express, { ErrorRequestHandler, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
// ⬇️ IMPORTANT: ESM requires the .js extension in TS source for runtime
import routes from "./routes/index.js";
// ✅ ESM requires .js on local paths
import { registerSocket } from "./socket.js";
import groupRoutes from "./routes/groups.js";
import groupPhotoRoutes from "./routes/groupPhoto.js";


const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

async function start() {
  try {
    const uri = process.env.MONGODB_URI!;
    await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
    console.log("✅ Mongo connected");

    app.use("/api", routes);

    app.get("/api/health", (_req: Request, res: Response) => res.json({ ok: true }));

    app.use("/api", groupRoutes);

    app.use("/api", groupPhotoRoutes);

    app.use("/uploads", express.static("uploads"));

    // Create HTTP server and register socket
    const http = await import("http");
    const server = http.createServer(app);
    registerSocket(server);

    const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    };
    app.use(errorHandler);

    const port = Number(process.env.PORT || 8080);
    server.listen(port, () => console.log(`🚀 API listening on http://localhost:${port}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
