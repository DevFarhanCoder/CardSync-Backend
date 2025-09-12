import type { Response } from "express";
import { env } from "./env.js";

export function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: env.PROD,         // secure in prod (Render)
    sameSite: env.PROD ? "none" : "lax",
    maxAge: env.JWT_COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.PROD,
    sameSite: env.PROD ? "none" : "lax",
  });
}