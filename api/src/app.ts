import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./modules/health/health.router.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp() {
  const app = express();

  // How many reverse proxies sit in front of the app. Needed for correct req.ip
  // behind Nginx (rate limiting, logging). Locally: 1 (the web container's Nginx).
  // In production: 2 (host Nginx + web container Nginx).
  app.set("trust proxy", config.TRUST_PROXY_HOPS);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = req.headers["x-request-id"]?.toString() ?? randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url === "/api/health" },
      redact: ["req.headers.cookie", "req.headers.authorization"],
    }),
  );

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
