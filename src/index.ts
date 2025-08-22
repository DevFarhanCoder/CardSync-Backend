import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import mongoose from "mongoose";
export { default as authRouter } from "./auth";

// ---- env
const PORT = Number(process.env.PORT || 8080);
const MONGODB_URI = process.env.MONGODB_URI || "";
if (!MONGODB_URI) console.warn("[WARN] MONGODB_URI missing in environment.");
const FRONTEND_URL = (process.env.FRONTEND_URL || "").trim();

// ---- app
const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("dev"));

// ---- CORS (dev-friendly) — must be BEFORE routes
const explicitWhitelist = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  FRONTEND_URL,
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // allow server-to-server/no-Origin
    const isLocalhost =
      process.env.NODE_ENV !== "production" &&
      (/^http:\/\/localhost:\d+$/i.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/i.test(origin));
    if (isLocalhost || explicitWhitelist.includes(origin)) return cb(null, true);
    console.warn("[CORS] Blocked origin:", origin);
    return cb(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  maxAge: 86400,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ---- parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ---- health
app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

// ---- routes (mount AFTER CORS/parsers)
app.use("/v1/auth", authRouter);

// ---- error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[ERROR] UnhandledError", err);
  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS: origin not allowed" });
  }
  res.status(err?.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Server error"
        : err?.message || "Server error",
  });
});

// ---- start
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("[INFO] Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`[INFO] API listening on :${PORT} (${process.env.NODE_ENV || "development"})`)
    );
  } catch (e) {
    console.error("[FATAL] Failed to start server:", e);
    process.exit(1);
  }
}
start();
