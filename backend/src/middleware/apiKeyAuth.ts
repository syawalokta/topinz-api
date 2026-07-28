import { NextFunction, Request, Response } from "express";
import { Endpoint } from "../models/Endpoint";
import { RequestLog } from "../models/RequestLog";
import { Setting } from "../models/Setting";
import { User } from "../models/User";
import { pubFail } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getClientIp } from "../utils/ip";
import { startOfToday } from "../utils/dates";
import { usedToday } from "../utils/usage";
import { effectiveRole } from "./auth";

const DEFAULT_RATE_LIMIT_PER_MINUTE = 60;

/**
 * In-memory sliding-window rate limiter, keyed `${userId}:${path}`.
 * Each bucket holds the timestamps of requests within the last minute.
 */
const buckets = new Map<string, number[]>();

function allowRequest(key: string, limitPerMinute: number): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (recent.length >= limitPerMinute) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  // Cheap safety valve so the map cannot grow unbounded under key churn.
  if (buckets.size > 10_000) {
    for (const [k, times] of buckets) {
      if (times.every((t) => t <= windowStart)) buckets.delete(k);
    }
  }
  return true;
}

function extractApiKey(req: Request): string | null {
  const fromHeader = req.headers["apikey"] ?? req.headers["x-api-key"];
  if (typeof fromHeader === "string" && fromHeader.trim()) return fromHeader.trim();
  const fromQuery = req.query.apikey;
  if (typeof fromQuery === "string" && fromQuery.trim()) return fromQuery.trim();
  return null;
}

/** Full request path as documented, e.g. "/api/v1/tools/password". */
export function fullApiPath(req: Request): string {
  const raw = `${req.baseUrl}${req.path}`;
  return raw.length > 1 && raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

/**
 * The /api/v1 gate, in contract order:
 * maintenance → key extraction → key lookup → 0.0.0.0 block → whitelist →
 * premium/endpoint-maintenance → daily limit → per-endpoint rate limit → log.
 */
export const apiKeyAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // (1) Global maintenance mode.
  const settings = await Setting.getMain();
  if (settings.maintenanceMode) {
    pubFail(res, "API is under maintenance. Please try again later.", 503);
    return;
  }

  // (2) Extract the key from header `apikey`, `x-api-key`, or query `?apikey=`.
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    pubFail(res, "API key required. Pass it via the `apikey` header or `?apikey=` query.", 401);
    return;
  }

  // (3) Resolve the key owner.
  const user = await User.findOne({ apiKey });
  if (!user) {
    pubFail(res, "Invalid API key", 401);
    return;
  }

  // (4) 0.0.0.0 is unconditionally blocked (it can never be whitelisted either).
  const ip = getClientIp(req);
  if (ip === "0.0.0.0") {
    pubFail(res, "Forbidden", 403);
    return;
  }

  // (5) When a whitelist exists, only listed IPs may use the key.
  if (user.whitelistIPs.length > 0 && !user.whitelistIPs.some((entry) => entry.ip === ip)) {
    pubFail(res, "Forbidden: IP not whitelisted", 403);
    return;
  }

  // (6) Match the endpoint doc by exact path + method. Unknown/unpublished
  //     paths fall through to the router's catch-all (404/405 there).
  const path = fullApiPath(req);
  const endpointDoc = await Endpoint.findOne({ path, method: req.method });
  req.endpointDoc = endpointDoc;
  if (endpointDoc) {
    if (endpointDoc.premiumOnly && effectiveRole(user) === "free") {
      pubFail(res, "Premium plan required", 403);
      return;
    }
    if (endpointDoc.status === "maintenance") {
      pubFail(res, "Endpoint is under maintenance. Please try again later.", 503);
      return;
    }
  }
  const cost = endpointDoc?.requestCost ?? 1;

  // (7) Daily quota: sum of today's request costs (+ this one). Admins bypass.
  if (user.role !== "admin") {
    const used = await usedToday(user._id);
    if (used + cost > user.limit) {
      const resetAt = new Date(startOfToday().getTime() + 24 * 60 * 60 * 1000).toISOString();
      pubFail(
        res,
        `Daily request limit exceeded. Limit: ${user.limit}, used: ${used}. Resets at ${resetAt}`,
        429
      );
      return;
    }
  }

  // (8) Per-endpoint per-minute rate limit (sliding window, in-memory).
  const perMinute = endpointDoc?.rateLimit ?? DEFAULT_RATE_LIMIT_PER_MINUTE;
  if (!allowRequest(`${user._id.toString()}:${path}`, perMinute)) {
    pubFail(res, `Rate limit exceeded. Max ${perMinute} requests per minute on this endpoint.`, 429);
    return;
  }

  // (9) Log every request that reaches a handler — including handler 4xx.
  const startedAt = Date.now();
  res.on("finish", () => {
    RequestLog.create({
      user: user._id,
      apiKey,
      endpoint: path,
      method: req.method,
      statusCode: res.statusCode,
      ip,
      responseTimeMs: Date.now() - startedAt,
      cost,
    }).catch((err) => {
      console.error("[requestlog] failed to record request:", err instanceof Error ? err.message : err);
    });
  });

  req.user = user;
  req.effectiveRole = effectiveRole(user);
  next();
});
