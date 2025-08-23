// src/index.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

// ---- Validate essential env (optional but helpful) ----
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/test";
const PORT = Number(process.env.PORT || 8080);

// ---- Connect MongoDB ----
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("[db] connected"))
  .catch((e) => {
    console.error("[db] connection error", e);
    process.exit(1);
  });

// Helpful connection logs
mongoose.connection.on("error", (err) => console.error("[db] error:", err));
mongoose.connection.on("disconnected", () => console.warn("[db] disconnected"));

// ---- App bootstrap ----
const app = express();

// If you run behind a proxy (nginx/heroku), uncomment:
// app.set("trust proxy", 1);

// CORS (adjust origins as needed)
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: false,
  })
);

// Parsers & logs
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(morgan("dev"));

// ---- Routers ----
// NOTE: Keep the .js extensions if your compiled output uses .js.
// If working purely in TS with ts-node, you can omit .js in imports.
import authRouter from "./routes/auth.js";
import cardsRouter from "./routes/cards.js";
import analyticsRouter from "./routes/analytics.js";

app.use("/api/auth", authRouter);
app.use("/api/cards", cardsRouter);
app.use("/v1/analytics", analyticsRouter);

// ---- Health ----
app.get("/api/health", (_req: Request, res: Response) => res.json({ ok: true }));

// ---- 404 handler (after all routes) ----
app.use((req: Request, res: Response) => {
  return res.status(404).json({ message: "Not Found" });
});

// ---- Error handler ----
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] error:", err);
  const status = err?.status || 500;
  const msg = status >= 500 ? "Server error" : err?.message || "Request failed";
  res.status(status).json({ message: msg });
});

// ---- Server start + graceful shutdown ----
const server = app.listen(PORT, () =>
  console.log(`[server] http://localhost:${PORT}`)
);

function shutdown(signal: string) {
  console.log(`[server] ${signal} received, shutting down...`);
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      console.log("[db] closed");
      process.exit(0);
    });
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
