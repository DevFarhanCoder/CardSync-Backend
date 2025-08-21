import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { log } from '../utils/logger.js';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'ValidationError', details: err.errors });
  }
  log.error('UnhandledError', err);
  return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}
