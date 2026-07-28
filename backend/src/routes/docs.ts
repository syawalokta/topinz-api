import { Router } from "express";
import { Category } from "../models/Category";
import { Endpoint } from "../models/Endpoint";
import { fail, ok } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const docsRouter = Router();

/** Sidebar navigation: active categories with their published endpoints. */
docsRouter.get(
  "/nav",
  asyncHandler(async (_req, res) => {
    const [categories, endpoints] = await Promise.all([
      Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }),
      Endpoint.find({ published: true })
        .sort({ sortOrder: 1, name: 1 })
        .select("name slug method path premiumOnly category"),
    ]);

    const byCategory = new Map<string, typeof endpoints>();
    for (const endpoint of endpoints) {
      const key = endpoint.category.toString();
      const list = byCategory.get(key) ?? [];
      list.push(endpoint);
      byCategory.set(key, list);
    }

    const nav = categories
      .map((category) => ({
        name: category.name,
        slug: category.slug,
        endpoints: (byCategory.get(category._id.toString()) ?? []).map((e) => ({
          name: e.name,
          slug: e.slug,
          method: e.method,
          path: e.path,
          premiumOnly: e.premiumOnly,
        })),
      }))
      .filter((category) => category.endpoints.length > 0); // skip empty categories

    ok(res, { categories: nav });
  })
);

docsRouter.get(
  "/endpoint/:slug",
  asyncHandler(async (req, res) => {
    const endpoint = await Endpoint.findOne({ slug: req.params.slug, published: true }).populate("category");
    if (!endpoint) {
      fail(res, "Endpoint not found", 404);
      return;
    }
    ok(res, { endpoint });
  })
);
