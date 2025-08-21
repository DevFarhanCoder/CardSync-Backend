import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function signToken(id: string, email: string) {
  return jwt.sign({ id, email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = registerSchema.parse(req.body);
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash: hash });
  const token = signToken(user.id, user.email);
  return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = signToken(user.id, user.email);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}

export async function me(req: Request & { user?: { id: string; email: string } }, res: Response) {
  const user = await User.findById(req.user!.id).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ id: user._id, name: user.name, email: user.email });
}
