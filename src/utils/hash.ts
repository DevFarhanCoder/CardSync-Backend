// src/utils/hash.ts
import bcrypt from "bcryptjs";

// You can tune the cost via env; 10 is a good default for server-side.
const ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

/** Hash a plain password with bcrypt. */
export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== "string" || plain.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  const salt = await bcrypt.genSalt(ROUNDS);
  return bcrypt.hash(plain, salt);
}

/** Compare a plain password to a stored bcrypt hash. */
export function comparePassword(plain: string, hash: string): Promise<boolean> {
  if (!hash || typeof plain !== "string") return Promise.resolve(false);
  return bcrypt.compare(plain, hash);
}
