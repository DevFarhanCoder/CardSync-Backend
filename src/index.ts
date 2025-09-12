import "dotenv/config";
import express, { ErrorRequestHandler } from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { env } from "./utils/env.js";
import routes from "./routes/index.js";

const app = express();
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("tiny"));

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use("/api", routes);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal error" });
};
app.use(errorHandler);

async function start() {
  await mongoose.connect(env.MONGODB_URI);
  app.listen(env.PORT, () => {
    console.log(`✅ API listening on ${env.PORT}`);
  });
}

start().catch((e) => {
  console.error("Boot error:", e);
  process.exit(1);
});