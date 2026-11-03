import type { RequestHandler } from "express";
import { unauthorized } from "../lib/errors.js";
import { verifyToken } from "../modules/auth/auth.service.js";
import { AUTH_COOKIE } from "../modules/auth/auth.cookie.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies?.[AUTH_COOKIE];
  if (typeof token !== "string" || token.length === 0) throw unauthorized();
  try {
    req.userId = verifyToken(token);
  } catch {
    throw unauthorized("Invalid or expired session");
  }
  next();
};
