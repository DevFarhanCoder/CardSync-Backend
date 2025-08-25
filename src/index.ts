import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

// Routers
import apiRouter from "./routes/index.js";
import analyticsRouter from "./routes/analytics.js";

const app = express();

// --- Middleware
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// --- Routes
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", apiRouter);
app.use("/v1/analytics", analyticsRouter); // legacy shim

// --- Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server error" });
});

// --- Database
const PORT = Number(process.env.PORT || 8080);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cardsync";

mongoose.set("strictQuery", true);
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("[db] connected"))
  .catch((e) => {
    console.error("[db] connection error", e);
    process.exit(1);
  });

// --- Server
const server = app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});

// --- Graceful shutdown
function shutdown(signal: string) {
  console.log(`[server] ${signal} received, closing...`);
  server.close(() => {
    mongoose.connection.close(false).then(() => process.exit(0));
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
