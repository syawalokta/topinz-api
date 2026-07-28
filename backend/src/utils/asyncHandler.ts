import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 does not catch rejected promises from async handlers.
 * Wrap every async handler/middleware with this so rejections reach the
 * central error handler instead of crashing the process.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
