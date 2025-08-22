import express from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { api } from "./routes/index.js";
import { errorHandler } from "./middlewares/error.js";
import { log } from "./utils/logger.js";

const app = express();

const allowedOrigins = [
  "https://card-sync.vercel.app",
  "http://localhost:5173",
];

// Allow embedding/cross-origin assets if needed
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));


// Help caches vary by Origin
app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

const corsOpts: CorsOptions = {
  origin(
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (!origin) return callback(null, true); // non-browser/curl
    return allowedOrigins.includes(origin)
      ? callback(null, true)
      : callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: false,
  optionsSuccessStatus: 204,
};

// Enable CORS for all routes
app.use(cors(corsOpts));
// Respond to ALL preflight requests
app.options("*", cors(corsOpts));

app.use(morgan("combined"));

app.get("/", (_req, res) => res.json({ name: "cardsync-backend-mongo", ok: true }));

app.use(api);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(env.port, () => {
    log.info(`API listening on :${env.port} (${env.nodeEnv})`);
  });
}).catch((e) => {
  log.error("Failed to connect to MongoDB", e);
  process.exit(1);
});
