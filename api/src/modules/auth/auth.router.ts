import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import * as authService from "./auth.service.js";
import { clearAuthCookie, setAuthCookie } from "./auth.cookie.js";
import { requireAuth } from "../../middleware/auth.js";
import { isTest } from "../../config.js";

// 20 attempts per 15 minutes per IP on login/register. Slows down brute force.
// Skipped under NODE_ENV=test so integration tests can log in freely.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Too many attempts, try again later",
    },
  },
});

export const authRouter = Router();

authRouter.post("/register", authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const { user, token } = await authService.register(input);
  setAuthCookie(res, token);
  res.status(201).json({ user });
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const { user, token } = await authService.login(input);
  setAuthCookie(res, token);
  res.json({ user });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await authService.getCurrentUser(req.userId);
  res.json({ user });
});
