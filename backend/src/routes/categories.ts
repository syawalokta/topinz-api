import { Router } from "express";
import { z } from "zod";
import { optionalAuth, requireAdmin, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { Category } from "../models/Category";
import { Endpoint } from "../models/Endpoint";
import { fail, ok } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { audit } from "../utils/audit";
import { getClientIp } from "../utils/ip";
import { slugify, uniqueSlug } from "../utils/slugify";

export const categoriesRouter = Router();

const categorySlugExists = async (slug: string, excludeId?: string): Promise<boolean> =>
  (await Category.exists(excludeId ? { slug, _id: { $ne: excludeId } } : { slug })) !== null;

categoriesRouter.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const wantAll = req.query.all === "true";

    if (wantAll) {
      if (!req.user || req.user.role !== "admin") {
        fail(res, "Admin access required", 403);
        return;
      }
      const [categories, counts] = await Promise.all([
        Category.find().sort({ sortOrder: 1, name: 1 }),
        Endpoint.aggregate<{ _id: unknown; count: number }>([
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ]),
      ]);
      const countByCategory = new Map(counts.map((c) => [String(c._id), c.count]));
      const items = categories.map((c) => ({
        ...c.toJSON(),
        endpointCount: countByCategory.get(c._id.toString()) ?? 0,
      }));
      ok(res, { items });
      return;
    }

    const items = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 });
    ok(res, { items });
  })
);

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  description: z.string().trim().max(300, "Description is too long").optional().default(""),
  active: z.boolean().optional().default(true),
});

categoriesRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  validate(createCategorySchema),
  asyncHandler(async (req, res) => {
    const { name, description, active } = req.body as z.infer<typeof createCategorySchema>;

    const slug = await uniqueSlug(slugify(name), (s) => categorySlugExists(s));
    const last = await Category.findOne().sort({ sortOrder: -1 });
    const category = await Category.create({
      name,
      slug,
      description,
      active,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    });

    audit(req.user!._id.toString(), "category.create", `category:${slug}`, { name }, getClientIp(req));
    ok(res, { category }, "Category created", 201);
  })
);

const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "ids must be a non-empty array"),
});

// NOTE: registered before "/:id" so "reorder" is not captured as an id.
categoriesRouter.put(
  "/reorder",
  requireAuth,
  requireAdmin,
  validate(reorderSchema),
  asyncHandler(async (req, res) => {
    const { ids } = req.body as z.infer<typeof reorderSchema>;

    await Category.bulkWrite(
      ids.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { sortOrder: index } } },
      }))
    );

    audit(req.user!._id.toString(), "category.reorder", "categories", { ids }, getClientIp(req));
    const items = await Category.find().sort({ sortOrder: 1, name: 1 });
    ok(res, { items }, "Categories reordered");
  })
);

const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(60, "Name is too long").optional(),
  description: z.string().trim().max(300, "Description is too long").optional(),
  active: z.boolean().optional(),
});

categoriesRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validate(updateCategorySchema),
  asyncHandler(async (req, res) => {
    const { name, description, active } = req.body as z.infer<typeof updateCategorySchema>;

    const category = await Category.findById(req.params.id);
    if (!category) {
      fail(res, "Category not found", 404);
      return;
    }

    if (name !== undefined && name !== category.name) {
      category.name = name;
      category.slug = await uniqueSlug(slugify(name), (s) => categorySlugExists(s, category._id.toString()));
    }
    if (description !== undefined) category.description = description;
    if (active !== undefined) category.active = active;
    await category.save();

    audit(req.user!._id.toString(), "category.update", `category:${category.slug}`, req.body, getClientIp(req));
    ok(res, { category }, "Category updated");
  })
);

categoriesRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
      fail(res, "Category not found", 404);
      return;
    }

    const endpointCount = await Endpoint.countDocuments({ category: category._id });
    if (endpointCount > 0) {
      fail(res, "Category still has endpoints", 400);
      return;
    }

    await category.deleteOne();
    audit(req.user!._id.toString(), "category.delete", `category:${category.slug}`, {}, getClientIp(req));
    ok(res, {}, "Category deleted");
  })
);
