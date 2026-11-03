import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { isProd } from "../config.js";

function isPgError(err: unknown): err is { code: string; detail?: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res
      .status(err.status)
      .json({
        error: { code: err.code, message: err.message, details: err.details },
      });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
    });
    return;
  }

  // unique_violation: two concurrent registrations with the same email, for example
  if (isPgError(err) && err.code === "23505") {
    res
      .status(409)
      .json({
        error: { code: "CONFLICT", message: "Resource already exists" },
      });
    return;
  }

  req.log.error({ err }, "Unhandled error");
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: isProd ? "Something went wrong" : String(err),
    },
  });
};
