import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'ValidationError', details: err.errors });
  }
  logger.error('UnhandledError', err);
  return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}
