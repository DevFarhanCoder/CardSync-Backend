import mongoose from 'mongoose';
import { env } from './env.js';
import { log } from '../utils/logger.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri, { autoIndex: true });
  log.info('Connected to MongoDB');
}
