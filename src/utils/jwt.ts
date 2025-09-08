// src/utils/jwt.ts
import * as JWTNS from "jsonwebtoken";

// jsonwebtoken v9 may expose both namespace and default;
// pick the object that actually has .sign/.verify
const jwtAny: any =
  (JWTNS as any)?.default && (JWTNS as any).default.sign
    ? (JWTNS as any).default
    : (JWTNS as any);

// Re-export useful types so callers don't import jsonwebtoken directly
export type SignOptions = JWTNS.SignOptions;
export type VerifyOptions = JWTNS.VerifyOptions;
export type JwtPayload = JWTNS.JwtPayload;

export function signJwt(
  payload: string | Buffer | object,
  secret: string,
  options?: SignOptions
) {
  return jwtAny.sign(payload, secret, options);
}

export function verifyJwt<T = JwtPayload>(
  token: string,
  secret: string,
  options?: VerifyOptions
): T {
  return jwtAny.verify(token, secret, options) as T;
}
