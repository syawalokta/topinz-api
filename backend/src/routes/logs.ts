import { Router } from "express";
import { FilterQuery } from "mongoose";
import { requireAuth } from "../middleware/auth";
import { IRequestLog, RequestLog } from "../models/RequestLog";
import { ok } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { buildMeta, parsePagination } from "../utils/pagination";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Shared log filter builder (own logs + admin logs).
 * `status` accepts an exact code ("404") or a class ("2xx" | "4xx" | "5xx").
 */
export function buildLogFilter(query: {
  q?: unknown;
  method?: unknown;
  status?: unknown;
}): FilterQuery<IRequestLog> {
  const filter: FilterQuery<IRequestLog> = {};

  if (typeof query.q === "string" && query.q.trim()) {
    filter.endpoint = { $regex: escapeRegex(query.q.trim()), $options: "i" };
  }
  if (typeof query.method === "string" && query.method.trim()) {
    filter.method = query.method.trim().toUpperCase();
  }
  if (typeof query.status === "string" && query.status.trim()) {
    const status = query.status.trim().toLowerCase();
    const classMatch = /^([1-5])xx$/.exec(status);
    if (classMatch) {
      const base = Number(classMatch[1]) * 100;
      filter.statusCode = { $gte: base, $lt: base + 100 };
    } else if (/^\d{3}$/.test(status)) {
      filter.statusCode = Number(status);
    }
  }

  return filter;
}

export const logsRouter = Router();
logsRouter.use(requireAuth);

logsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req);
    const filter = { ...buildLogFilter(req.query), user: req.user!._id };

    const [items, total] = await Promise.all([
      RequestLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate("user", "username"),
      RequestLog.countDocuments(filter),
    ]);

    ok(res, { items, ...buildMeta(total, pagination) });
  })
);
