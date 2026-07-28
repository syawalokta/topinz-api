import { Router } from "express";
import { Category } from "../models/Category";
import { Endpoint } from "../models/Endpoint";
import { RequestLog } from "../models/RequestLog";
import { Setting } from "../models/Setting";
import { User } from "../models/User";
import { ok } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { dateKeysForLastNDays, lastNDays, toDateKey } from "../utils/dates";

const WINDOW_DAYS = 90;

type DayStatus = "ok" | "degraded" | "down";

interface DayBucket {
  total: number;
  err5xx: number;
}

const round2 = (n: number) => Math.min(100, Math.max(0, Math.round(n * 100) / 100));

function dayStatus(bucket: DayBucket | undefined): DayStatus {
  if (!bucket || bucket.total === 0) return "ok";
  const share = bucket.err5xx / bucket.total;
  if (share > 0.5) return "down";
  if (share > 0.1) return "degraded";
  return "ok";
}

export const statusRouter = Router();

statusRouter.get(
  "/public",
  asyncHandler(async (_req, res) => {
    // ~4k logs in the window at seed scale — computing in JS keeps the
    // per-category/per-day bucketing straightforward.
    const [logs, categories, endpoints, totalEndpoints] = await Promise.all([
      RequestLog.find({ createdAt: { $gte: lastNDays(WINDOW_DAYS) } })
        .select("endpoint statusCode createdAt responseTimeMs")
        .lean(),
      Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }),
      Endpoint.find().select("path category").lean(),
      Endpoint.countDocuments({ published: true }),
    ]);

    const pathToCategory = new Map(endpoints.map((e) => [e.path, e.category.toString()]));
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const dateKeys = dateKeysForLastNDays(WINDOW_DAYS);

    // Overall uptime: share of non-5xx responses in the window.
    const total5xx = logs.filter((l) => l.statusCode >= 500).length;
    const uptimePercent = logs.length === 0 ? 100 : round2(((logs.length - total5xx) / logs.length) * 100);

    // Average response time: last hour, falling back to the whole window, then 42.
    const lastHourLogs = logs.filter((l) => l.createdAt.getTime() >= hourAgo);
    const avgOf = (list: { responseTimeMs: number }[]) =>
      Math.round(list.reduce((sum, l) => sum + l.responseTimeMs, 0) / list.length);
    const avgResponseMs = lastHourLogs.length > 0 ? avgOf(lastHourLogs) : logs.length > 0 ? avgOf(logs) : 42;

    const services = categories.map((category) => {
      const categoryId = category._id.toString();
      const catLogs = logs.filter((l) => pathToCategory.get(l.endpoint) === categoryId);

      // Operational unless >10% of the category's last-hour requests were 5xx.
      const catLastHour = catLogs.filter((l) => l.createdAt.getTime() >= hourAgo);
      const lastHour5xx = catLastHour.filter((l) => l.statusCode >= 500).length;
      const operational = catLastHour.length === 0 || lastHour5xx / catLastHour.length <= 0.1;

      const cat5xx = catLogs.filter((l) => l.statusCode >= 500).length;
      const catUptime = catLogs.length === 0 ? 100 : round2(((catLogs.length - cat5xx) / catLogs.length) * 100);

      const byDay = new Map<string, DayBucket>();
      for (const log of catLogs) {
        const key = toDateKey(new Date(log.createdAt));
        const bucket = byDay.get(key) ?? { total: 0, err5xx: 0 };
        bucket.total += 1;
        if (log.statusCode >= 500) bucket.err5xx += 1;
        byDay.set(key, bucket);
      }

      return {
        name: category.name,
        operational,
        uptimePercent: catUptime,
        days: dateKeys.map((date) => ({ date, status: dayStatus(byDay.get(date)) })),
      };
    });

    // One static, resolved sample incident (~14 days ago) alongside live data.
    const incidentDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const incidents = [
      {
        date: incidentDate.toISOString(),
        title: "Elevated latency on Downloader endpoints",
        description:
          "An upstream provider slowdown caused elevated response times on Downloader endpoints for roughly 40 minutes. Traffic was rerouted and latency returned to normal.",
        resolved: true,
      },
    ];

    ok(res, {
      operational: services.every((s) => s.operational),
      uptimePercent,
      avgResponseMs,
      totalEndpoints,
      services,
      incidents,
    });
  })
);

/** Mounted at /pricing — public pricing table, sourced from Settings. */
export const pricingRouter = Router();

pricingRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const settings = await Setting.getMain();
    ok(res, { plans: settings.pricing });
  })
);

/** Mounted at /stats — public landing-page counters. */
export const publicStatsRouter = Router();

publicStatsRouter.get(
  "/public",
  asyncHandler(async (_req, res) => {
    const [totalEndpoints, totalUsers, totalRequests] = await Promise.all([
      Endpoint.countDocuments({ published: true }),
      User.countDocuments(),
      RequestLog.countDocuments(),
    ]);
    ok(res, { totalEndpoints, totalUsers, totalRequests });
  })
);
