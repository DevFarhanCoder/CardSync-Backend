// src/index.ts
import dotenv from "dotenv";
dotenv.config();

import express, { ErrorRequestHandler, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import routes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

async function start() {
  try {
    const uri = process.env.MONGODB_URI!;
    await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
    console.log("✅ Mongo connected");

    // API routes
    app.use("/api", routes);

    // Health
    app.get("/api/health", (_req: Request, res: Response) => res.json({ ok: true }));

    // Typed error handler (fixes TS7006)
    const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    };
    app.use(errorHandler);

    const port = Number(process.env.PORT || 8080);
    app.listen(port, () => console.log(`🚀 API listening on http://localhost:${port}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
