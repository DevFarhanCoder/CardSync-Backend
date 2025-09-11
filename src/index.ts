import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import usersRouter from "./routes/users.js";
import chatGroupsRouter from "./routes/chatGroups.js";
import analyticsRouter from "./routes/analytics.js";

const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(morgan("tiny"));

const ORIGINS = (process.env.CORS_ORIGIN ??
  "https://instantllycards.com,https://www.instantllycards.com,http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: ORIGINS,
    credentials: true,
  })
);

const MONGO_URI = process.env.MONGODB_URI || "";
if (!mongoose.connection.readyState) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ Mongo connected"))
    .catch(err => {
      console.error("Mongo error", err);
      process.exit(1);
    });
}

/** Mount once at /api (avoid double prefixes) */
app.use("/api", usersRouter);
app.use("/api", chatGroupsRouter);
app.use("/api", analyticsRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", (_req, res) => res.status(404).json({ message: "Not Found" }));

const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, () => console.log(`🚀 API on :${PORT}`));

export default app;
