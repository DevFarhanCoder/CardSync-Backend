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

mongoose.connection.on("error", (err) => console.error("[db] error:", err));
mongoose.connection.on("disconnected", () => console.warn("[db] disconnected"));

// ---- App bootstrap ----
const app = express();

// If you run behind a proxy (nginx/heroku/render), uncomment:
// app.set("trust proxy", 1);

// ---------------- CORS ----------------
// Frontend origins you want to allow
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://card-sync.vercel.app", // prod frontend
];

// Allow any *.vercel.app preview too (optional)
function isAllowedOrigin(origin?: string | null) {
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
}

// Must be registered BEFORE your routes
app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server/no-origin requests OR check allowlist
      if (!origin || isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error(`CORS: blocked origin ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // set to true ONLY if you use cookies/session
    optionsSuccessStatus: 204,
  })
);

// Make sure OPTIONS is handled for all routes
app.options("*", cors());

// --------------- Parsers & logs ---------------
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(morgan("dev"));

// --------------- Routers ---------------
// NOTE: If "type":"module" is set in package.json and you compile to .js,
// keep the .js extensions below to match the emitted files.
import authRouter from "./routes/auth.js";
import cardsRouter from "./routes/cards.js";
import analyticsRouter from "./routes/analytics.js";

app.use("/api/auth", authRouter);
app.use("/api/cards", cardsRouter);
app.use("/v1/analytics", analyticsRouter);

// --------------- Health ---------------
app.get("/api/health", (_req: Request, res: Response) => res.json({ ok: true }));

// --------------- 404 handler ---------------
app.use((req: Request, res: Response) => {
  return res.status(404).json({ message: "Not Found" });
});

// --------------- Error handler ---------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] error:", err);
  const status = err?.status || 500;
  const msg = status >= 500 ? "Server error" : err?.message || "Request failed";
  res.status(status).json({ message: msg });
});

// --------------- Server start & graceful shutdown ---------------
const server = app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});

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
