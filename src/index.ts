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
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (env.corsOrigin.length === 0 || env.corsOrigin.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
  credentials: true,
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
