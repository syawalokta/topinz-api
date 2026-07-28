import { Router } from "express";
import { isPremiumExpired, requireAuth } from "../middleware/auth";
import { RequestLog } from "../models/RequestLog";
import { ok } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { startOfToday } from "../utils/dates";
import { dailyCounts, usedToday } from "../utils/usage";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = req.user!;

    const [used, todayRequest, totalRequest, usage, recentLogs] = await Promise.all([
      usedToday(user._id),
      RequestLog.countDocuments({ user: user._id, createdAt: { $gte: startOfToday() } }),
      RequestLog.countDocuments({ user: user._id }),
      dailyCounts({ user: user._id }, 14),
      RequestLog.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "username"),
    ]);

    const data: Record<string, unknown> = {
      role: user.role,
      apiKey: user.apiKey,
      limit: user.limit,
      usedToday: used,
      remainingToday: Math.max(0, user.limit - used),
      premiumExpiresAt: user.premiumExpiresAt,
      whitelistCount: user.whitelistIPs.length,
      todayRequest,
      totalRequest,
      usage,
      recentLogs,
    };
    if (isPremiumExpired(user)) data.premiumExpired = true;

    ok(res, data);
  })
);
