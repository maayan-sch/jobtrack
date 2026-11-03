import type { Response } from "express";
import { config, isProd } from "../../config.js";

export const AUTH_COOKIE = "jobtrack_token";

const baseOptions = {
  httpOnly: true, // JS in the browser cannot read it -> protects against XSS token theft
  secure: isProd, // only over HTTPS in production
  sameSite: "lax" as const, // not sent on cross-site POSTs -> CSRF protection
  path: "/",
};

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE, token, {
    ...baseOptions,
    maxAge: config.JWT_EXPIRES_IN_SECONDS * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, baseOptions);
}
