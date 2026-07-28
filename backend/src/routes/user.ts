import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { isPremiumExpired, requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { User } from "../models/User";
import { fail, ok } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { audit } from "../utils/audit";
import { getClientIp } from "../utils/ip";

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const data: Record<string, unknown> = { user };
    if (isPremiumExpired(user)) data.premiumExpired = true;
    ok(res, data);
  })
);

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty").max(60, "Name is too long").optional(),
    phone: z
      .string()
      .regex(/^\+62\d{8,13}$/, "Phone must be an Indonesian number like +6281234567890")
      .optional(),
  })
  .refine((v) => v.name !== undefined || v.phone !== undefined, {
    message: "Provide at least one field to update",
  });

userRouter.put(
  "/profile",
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const { name, phone } = req.body as z.infer<typeof updateProfileSchema>;
    const user = req.user!;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    await user.save();

    audit(user._id.toString(), "user.update_profile", `user:${user.username}`, { name, phone }, getClientIp(req));
    ok(res, { user }, "Profile updated successfully");
  })
);

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

userRouter.put(
  "/password",
  validate(updatePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as z.infer<typeof updatePasswordSchema>;

    // req.user was loaded without the password field; re-select it.
    const user = await User.findById(req.user!._id).select("+password");
    if (!user) {
      fail(res, "User not found", 404);
      return;
    }
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      fail(res, "Current password is incorrect", 400);
      return;
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    audit(user._id.toString(), "user.update_password", `user:${user.username}`, {}, getClientIp(req));
    ok(res, {}, "Password updated successfully");
  })
);
