import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { api } from './routes/index.js';
import { errorHandler } from './middlewares/error.js';
import { log } from './utils/logger.js';

const app = express();

// Helmet: loosen cross-origin resource policy so responses can be embedded if needed
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = env.corsOrigin && env.corsOrigin.length
  ? env.corsOrigin
  : []; // e.g. ["https://card-sync.vercel.app","http://localhost:5173"]

// Add Vary so caches don’t mix origins
app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

// CORS (before any routes)
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // non-browser/curl
    return (allowedOrigins.length === 0 || allowedOrigins.includes(origin))
      ? cb(null, true)
      : cb(new Error("CORS not allowed"));
  },
  credentials: true, // keep true only if you set cookies
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
  optionsSuccessStatus: 204,
}));

// VERY IMPORTANT: respond to all preflights with CORS headers
app.options("*", cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    return (allowedOrigins.length === 0 || allowedOrigins.includes(origin))
      ? cb(null, true)
      : cb(new Error("CORS not allowed"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
  optionsSuccessStatus: 204,
}));

app.use(morgan('combined'));

app.get('/', (_req, res) => res.json({ name: 'cardsync-backend-mongo', ok: true }));

app.use(api);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(env.port, () => {
    log.info(`API listening on :${env.port} (${env.nodeEnv})`);
  });
}).catch((e) => {
  log.error('Failed to connect to MongoDB', e);
  process.exit(1);
});
