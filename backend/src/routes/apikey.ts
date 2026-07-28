import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { User } from "../models/User";
import { ok } from "../utils/apiResponse";
import { resetKey } from "../utils/apikey";
import { asyncHandler } from "../utils/asyncHandler";
import { audit } from "../utils/audit";
import { getClientIp } from "../utils/ip";

export const apikeyRouter = Router();
apikeyRouter.use(requireAuth);

apikeyRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    ok(res, { apiKey: req.user!.apiKey });
  })
);

apikeyRouter.put(
  "/reset",
  asyncHandler(async (req, res) => {
    const user = req.user!;

    // resetKey has 36^6 combinations per user; retry on the unlikely collision.
    let next = resetKey(user.username);
    while (await User.exists({ apiKey: next })) next = resetKey(user.username);

    user.apiKey = next;
    await user.save();

    audit(user._id.toString(), "apikey.reset", `user:${user.username}`, {}, getClientIp(req));
    ok(res, { apiKey: user.apiKey }, "API key has been reset");
  })
);
