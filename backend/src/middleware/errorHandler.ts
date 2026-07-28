import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { fail } from "../utils/apiResponse";

/** Optional shape for errors thrown with an explicit HTTP status. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Mounted last: any unmatched route. */
export function notFoundHandler(req: Request, res: Response): void {
  fail(res, `Route not found: ${req.method} ${req.path}`, 404);
}

/** Central error handler — never leaks stack traces in production. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let status = err instanceof HttpError ? err.status : 500;
  let rawMessage = err instanceof Error ? err.message : "Unknown error";

  // Well-known mongoose failures are client errors, not server faults.
  if (err instanceof Error) {
    if (err.name === "CastError") {
      status = 400;
      rawMessage = "Invalid id format";
    } else if (err.name === "ValidationError") {
      status = 400;
    } else if ((err as { code?: number }).code === 11000) {
      status = 400;
      rawMessage = "Duplicate value for a unique field";
    }
  }

  if (!env.isProduction) {
    console.error("[error]", err);
  }

  if (res.headersSent) return;
  const message = status >= 500 && env.isProduction ? "Internal server error" : rawMessage;
  fail(res, message, status);
}
