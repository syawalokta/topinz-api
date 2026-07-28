import { Router } from "express";
import { FilterQuery } from "mongoose";
import { z } from "zod";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { Category } from "../models/Category";
import { Endpoint, IEndpoint } from "../models/Endpoint";
import { fail, ok } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { audit } from "../utils/audit";
import { getClientIp } from "../utils/ip";
import { buildMeta, parsePagination } from "../utils/pagination";
import { slugify, uniqueSlug } from "../utils/slugify";

export const endpointsRouter = Router();

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const endpointSlugExists = async (slug: string, excludeId?: string): Promise<boolean> =>
  (await Endpoint.exists(excludeId ? { slug, _id: { $ne: excludeId } } : { slug })) !== null;

const methodEnum = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);

const paramSchema = z.object({
  name: z.string().trim().min(1),
  type: z.string().trim().min(1),
  required: z.boolean().default(false),
  description: z.string().default(""),
  in: z.enum(["query", "body", "path", "header"]).default("query"),
});

const responseCodeSchema = z.object({
  code: z.number().int(),
  description: z.string().default(""),
});

const endpointBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  category: z.string().min(1, "Category is required"),
  method: methodEnum,
  path: z
    .string()
    .trim()
    .refine((p) => p.startsWith("/api/v1/"), { message: 'Path must start with "/api/v1/"' }),
  shortDescription: z.string().trim().max(160).default(""),
  description: z.string().default(""),
  status: z.enum(["active", "maintenance", "deprecated"]).default("active"),
  published: z.boolean().default(true),
  premiumOnly: z.boolean().default(false),
  rateLimit: z.number().int().min(1).max(10000).default(60),
  requestCost: z.number().int().min(1).max(100).default(1),
  tags: z.array(z.string()).default([]),
  params: z.array(paramSchema).default([]),
  exampleRequest: z.string().default(""),
  exampleResponse: z.string().default(""),
  responseCodes: z.array(responseCodeSchema).default([]),
  sortOrder: z.number().int().default(0),
});

const endpointUpdateSchema = endpointBodySchema.partial();

/** GET /endpoint — public directory (published only) or full admin listing. */
endpointsRouter.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const wantAll = req.query.all === "true";
    if (wantAll && (!req.user || req.user.role !== "admin")) {
      fail(res, "Admin access required", 403);
      return;
    }

    const filter: FilterQuery<IEndpoint> = wantAll ? {} : { published: true };

    if (typeof req.query.category === "string" && req.query.category.trim()) {
      const category = await Category.findOne({ slug: req.query.category.trim() });
      // Unknown category slug matches nothing rather than erroring.
      filter.category = category?._id ?? null;
    }
    if (typeof req.query.method === "string" && req.query.method.trim()) {
      filter.method = req.query.method.trim().toUpperCase();
    }
    if (typeof req.query.q === "string" && req.query.q.trim()) {
      const rx = { $regex: escapeRegex(req.query.q.trim()), $options: "i" };
      filter.$or = [{ name: rx }, { path: rx }];
    }

    const pagination = parsePagination(req);
    const [items, total] = await Promise.all([
      Endpoint.find(filter)
        .sort({ sortOrder: 1, name: 1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate("category"),
      Endpoint.countDocuments(filter),
    ]);

    ok(res, { items, ...buildMeta(total, pagination) });
  })
);

endpointsRouter.get(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const endpoint = await Endpoint.findById(req.params.id).populate("category");
    if (!endpoint) {
      fail(res, "Endpoint not found", 404);
      return;
    }
    ok(res, { endpoint });
  })
);

endpointsRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  validate(endpointBodySchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof endpointBodySchema>;

    const category = await Category.findById(body.category);
    if (!category) {
      fail(res, "Category not found", 400, [{ field: "category", message: "Category not found" }]);
      return;
    }

    const slug = await uniqueSlug(slugify(body.name), (s) => endpointSlugExists(s));
    const endpoint = await Endpoint.create({ ...body, slug, category: category._id });
    await endpoint.populate("category");

    audit(req.user!._id.toString(), "endpoint.create", `endpoint:${slug}`, { path: body.path }, getClientIp(req));
    ok(res, { endpoint }, "Endpoint created", 201);
  })
);

endpointsRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(endpointUpdateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof endpointUpdateSchema>;

    const endpoint = await Endpoint.findById(req.params.id);
    if (!endpoint) {
      fail(res, "Endpoint not found", 404);
      return;
    }

    if (body.category !== undefined) {
      const category = await Category.findById(body.category);
      if (!category) {
        fail(res, "Category not found", 400, [{ field: "category", message: "Category not found" }]);
        return;
      }
      endpoint.category = category._id;
    }
    if (body.name !== undefined && body.name !== endpoint.name) {
      endpoint.name = body.name;
      endpoint.slug = await uniqueSlug(slugify(body.name), (s) => endpointSlugExists(s, endpoint._id.toString()));
    }

    const { name: _name, category: _category, ...rest } = body;
    endpoint.set(rest);
    await endpoint.save();
    await endpoint.populate("category");

    audit(req.user!._id.toString(), "endpoint.update", `endpoint:${endpoint.slug}`, body, getClientIp(req));
    ok(res, { endpoint }, "Endpoint updated");
  })
);

endpointsRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const endpoint = await Endpoint.findById(req.params.id);
    if (!endpoint) {
      fail(res, "Endpoint not found", 404);
      return;
    }

    await endpoint.deleteOne();
    audit(req.user!._id.toString(), "endpoint.delete", `endpoint:${endpoint.slug}`, {}, getClientIp(req));
    ok(res, {}, "Endpoint deleted");
  })
);

const publishSchema = z.object({ published: z.boolean() });

endpointsRouter.patch(
  "/:id/publish",
  requireAuth,
  requireAdmin,
  validate(publishSchema),
  asyncHandler(async (req, res) => {
    const { published } = req.body as z.infer<typeof publishSchema>;

    const endpoint = await Endpoint.findByIdAndUpdate(
      req.params.id,
      { published },
      { new: true }
    ).populate("category");
    if (!endpoint) {
      fail(res, "Endpoint not found", 404);
      return;
    }

    audit(req.user!._id.toString(), "endpoint.publish", `endpoint:${endpoint.slug}`, { published }, getClientIp(req));
    ok(res, { endpoint }, published ? "Endpoint published" : "Endpoint unpublished");
  })
);
