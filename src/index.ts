import dotenv from "dotenv";
dotenv.config();
import express from "express";
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

    app.use("/api", routes);

    app.get("/api/health", (_req, res) => res.json({ ok: true }));

    app.use((err: any, _req, res, _next) => {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    });

    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`🚀 API listening on http://localhost:${port}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
