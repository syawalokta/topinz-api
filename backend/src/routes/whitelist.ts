import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { UserDocument } from "../models/User";
import { fail, ok } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { audit } from "../utils/audit";
import { getClientIp, isValidIPv4 } from "../utils/ip";

export const whitelistRouter = Router();
whitelistRouter.use(requireAuth);

const MAX_IPS = 10;

const ipSchema = z.object({
  ip: z.string().trim().min(1, "IP address is required"),
  label: z.string().trim().max(60, "Label is too long").optional(),
});

/**
 * Shared guard for add/update: syntactic IPv4 check, the hard 0.0.0.0 block,
 * and duplicate detection (optionally ignoring the entry being edited).
 */
function ipProblem(user: UserDocument, ip: string, excludeId?: string): string | null {
  if (!isValidIPv4(ip)) return "Invalid IPv4 address";
  if (ip === "0.0.0.0") return "0.0.0.0 is always blocked and cannot be whitelisted";
  const duplicate = user.whitelistIPs.some(
    (entry) => entry.ip === ip && entry._id.toString() !== excludeId
  );
  if (duplicate) return "IP is already whitelisted";
  return null;
}

whitelistRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    ok(res, { items: req.user!.whitelistIPs });
  })
);

whitelistRouter.post(
  "/",
  validate(ipSchema),
  asyncHandler(async (req, res) => {
    const { ip, label } = req.body as z.infer<typeof ipSchema>;
    const user = req.user!;

    if (user.whitelistIPs.length >= MAX_IPS) {
      fail(res, `Whitelist is full (max ${MAX_IPS} IPs)`, 400);
      return;
    }
    const problem = ipProblem(user, ip);
    if (problem) {
      fail(res, problem, 400, [{ field: "ip", message: problem }]);
      return;
    }

    user.whitelistIPs.push({ ip, label });
    await user.save();

    audit(user._id.toString(), "whitelist.add", `user:${user.username}`, { ip, label }, getClientIp(req));
    ok(res, { items: user.whitelistIPs }, "IP added to whitelist");
  })
);

whitelistRouter.put(
  "/:id",
  validate(ipSchema),
  asyncHandler(async (req, res) => {
    const { ip, label } = req.body as z.infer<typeof ipSchema>;
    const user = req.user!;

    const entry = user.whitelistIPs.id(req.params.id);
    if (!entry) {
      fail(res, "Whitelist entry not found", 404);
      return;
    }
    const problem = ipProblem(user, ip, entry._id.toString());
    if (problem) {
      fail(res, problem, 400, [{ field: "ip", message: problem }]);
      return;
    }

    entry.ip = ip;
    entry.label = label;
    await user.save();

    audit(user._id.toString(), "whitelist.update", `user:${user.username}`, { ip, label }, getClientIp(req));
    ok(res, { items: user.whitelistIPs }, "Whitelist entry updated");
  })
);

whitelistRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = req.user!;

    const entry = user.whitelistIPs.id(req.params.id);
    if (!entry) {
      fail(res, "Whitelist entry not found", 404);
      return;
    }

    const removedIp = entry.ip;
    entry.deleteOne();
    await user.save();

    audit(user._id.toString(), "whitelist.remove", `user:${user.username}`, { ip: removedIp }, getClientIp(req));
    ok(res, { items: user.whitelistIPs }, "IP removed from whitelist");
  })
);
