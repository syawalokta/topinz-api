import { Router } from "express";
import { FilterQuery, Types } from "mongoose";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { AuditLog } from "../models/AuditLog";
import { Category } from "../models/Category";
import { Endpoint } from "../models/Endpoint";
import { RequestLog } from "../models/RequestLog";
import { Setting } from "../models/Setting";
import { IUser, User } from "../models/User";
import { fail, ok } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { audit } from "../utils/audit";
import { getClientIp } from "../utils/ip";
import { startOfMonth, startOfToday } from "../utils/dates";
import { buildMeta, parsePagination } from "../utils/pagination";
import { dailyCounts } from "../utils/usage";
import { buildLogFilter } from "./logs";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------------------------------------------------------------- stats ----

adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [
      todayRequest,
      totalRequest,
      totalUser,
      premiumUser,
      totalEndpoint,
      totalCategory,
      monthRequest,
      requestsPerDay,
      topEndpoints,
      recentLogs,
    ] = await Promise.all([
      RequestLog.countDocuments({ createdAt: { $gte: startOfToday() } }),
      RequestLog.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ role: "premium" }),
      Endpoint.countDocuments(),
      Category.countDocuments(),
      RequestLog.countDocuments({ createdAt: { $gte: startOfMonth() } }),
      dailyCounts({}, 30),
      RequestLog.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$endpoint", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      RequestLog.find().sort({ createdAt: -1 }).limit(10).populate("user", "username"),
    ]);
    const freeUser = await User.countDocuments({ role: "free" });

    ok(res, {
      todayRequest,
      totalRequest,
      totalUser,
      premiumUser,
      freeUser,
      totalEndpoint,
      totalCategory,
      monthRequest,
      requestsPerDay,
      topEndpoints: topEndpoints.map((t) => ({ endpoint: t._id, count: t.count })),
      recentLogs,
    });
  })
);

// ---------------------------------------------------------------- users ----

adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const filter: FilterQuery<IUser> = {};
    if (typeof req.query.q === "string" && req.query.q.trim()) {
      const rx = { $regex: escapeRegex(req.query.q.trim()), $options: "i" };
      filter.$or = [{ name: rx }, { username: rx }, { email: rx }];
    }
    if (typeof req.query.role === "string" && ["free", "premium", "admin"].includes(req.query.role)) {
      filter.role = req.query.role;
    }

    const pagination = parsePagination(req);
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
      User.countDocuments(filter),
    ]);

    ok(res, { items, ...buildMeta(total, pagination) });
  })
);

adminRouter.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      fail(res, "User not found", 404);
      return;
    }

    const [totalRequest, todayRequest] = await Promise.all([
      RequestLog.countDocuments({ user: user._id }),
      RequestLog.countDocuments({ user: user._id, createdAt: { $gte: startOfToday() } }),
    ]);

    ok(res, { user, stats: { totalRequest, todayRequest } });
  })
);

const updateUserSchema = z.object({
  role: z.enum(["free", "premium", "admin"]).optional(),
  limit: z.number().int().min(0, "Limit cannot be negative").optional(),
  premiumExpiresAt: z
    .string()
    .datetime({ offset: true, message: "premiumExpiresAt must be an ISO date" })
    .nullable()
    .optional(),
  name: z.string().trim().min(1, "Name cannot be empty").max(60, "Name is too long").optional(),
});

adminRouter.put(
  "/users/:id",
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateUserSchema>;

    const user = await User.findById(req.params.id);
    if (!user) {
      fail(res, "User not found", 404);
      return;
    }

    // Safety rail: an admin can never demote their own account.
    const isSelf = user._id.toString() === req.user!._id.toString();
    if (isSelf && body.role !== undefined && body.role !== "admin") {
      fail(res, "You cannot change your own admin role", 400);
      return;
    }

    if (body.name !== undefined) user.name = body.name;
    if (body.limit !== undefined) user.limit = body.limit;
    if (body.premiumExpiresAt !== undefined) {
      user.premiumExpiresAt = body.premiumExpiresAt === null ? null : new Date(body.premiumExpiresAt);
    }
    if (body.role !== undefined) {
      user.role = body.role;
      if (body.role === "premium" && body.premiumExpiresAt === undefined) {
        // Default premium grant: 30 days from now.
        user.premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      if (body.role === "free") user.premiumExpiresAt = null;
    }
    await user.save();

    audit(req.user!._id.toString(), "user.update", `user:${user.username}`, body, getClientIp(req));
    ok(res, { user }, "User updated");
  })
);

adminRouter.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      fail(res, "User not found", 404);
      return;
    }
    if (user._id.toString() === req.user!._id.toString()) {
      fail(res, "You cannot delete your own account", 400);
      return;
    }

    await user.deleteOne();
    audit(req.user!._id.toString(), "user.delete", `user:${user.username}`, {}, getClientIp(req));
    ok(res, {}, "User deleted");
  })
);

// ----------------------------------------------------------------- logs ----

adminRouter.get(
  "/logs",
  asyncHandler(async (req, res) => {
    const filter = buildLogFilter(req.query);
    if (typeof req.query.user === "string" && req.query.user.trim()) {
      const userId = req.query.user.trim();
      if (!Types.ObjectId.isValid(userId)) {
        fail(res, "Invalid user id", 400);
        return;
      }
      filter.user = userId;
    }

    const pagination = parsePagination(req);
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

// ------------------------------------------------------------- settings ----

adminRouter.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    ok(res, { settings: await Setting.getMain() });
  })
);

const updateSettingsSchema = z.object({
  siteName: z.string().trim().min(1).max(60).optional(),
  siteDescription: z.string().trim().max(300).optional(),
  maintenanceMode: z.boolean().optional(),
  allowRegistration: z.boolean().optional(),
});

adminRouter.put(
  "/settings",
  validate(updateSettingsSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateSettingsSchema>;

    const settings = await Setting.getMain();
    settings.set(body);
    await settings.save();

    audit(req.user!._id.toString(), "settings.update", "settings:main", body, getClientIp(req));
    ok(res, { settings }, "Settings updated");
  })
);

// -------------------------------------------------------------- pricing ----

const pricingPlanSchema = z.object({
  id: z.enum(["free", "premium"]),
  name: z.string().trim().min(1),
  price: z.number().min(0),
  period: z.string().trim().min(1),
  description: z.string().default(""),
  dailyLimit: z.number().int().min(0),
  features: z.array(z.string()),
  highlighted: z.boolean(),
});

const updatePricingSchema = z.object({
  plans: z.array(pricingPlanSchema).min(1, "At least one plan is required"),
});

adminRouter.put(
  "/pricing",
  validate(updatePricingSchema),
  asyncHandler(async (req, res) => {
    const { plans } = req.body as z.infer<typeof updatePricingSchema>;

    const settings = await Setting.getMain();
    settings.pricing = plans;
    await settings.save();

    audit(req.user!._id.toString(), "pricing.update", "settings:main", { plans: plans.length }, getClientIp(req));
    ok(res, { plans: settings.pricing }, "Pricing updated");
  })
);

// ---------------------------------------------------------------- audit ----

adminRouter.get(
  "/audit",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req);
    const [items, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate("actor", "username"),
      AuditLog.countDocuments(),
    ]);

    ok(res, { items, ...buildMeta(total, pagination) });
  })
);
