import rateLimit from "express-rate-limit";
import { fail } from "../utils/apiResponse";

/** Blanket protection for the whole app: 300 requests/min per IP. */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, "Too many requests, please slow down", 429);
  },
});

/** Stricter limiter for /auth: 20 requests per 15 minutes per IP. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => {
    fail(res, "Too many authentication attempts. Please try again in 15 minutes.", 429);
  },
});
