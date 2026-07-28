import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { Setting } from "../models/Setting";
import { User } from "../models/User";
import { fail, ok, FieldError } from "../utils/apiResponse";
import { initialKey } from "../utils/apikey";
import { asyncHandler } from "../utils/asyncHandler";
import { audit } from "../utils/audit";
import { getClientIp } from "../utils/ip";
import { signToken } from "../utils/jwt";
import { env } from "../config/env";

export const authRouter = Router();

const registerSchema = z
  .object({
    email: z.string().email("Invalid email address").transform((v) => v.toLowerCase().trim()),
    username: z
      .string()
      .transform((v) => v.toLowerCase().trim())
      .pipe(z.string().regex(/^[a-z0-9_]{3,20}$/, "Username must be 3-20 chars: lowercase letters, digits, underscore")),
    phone: z.string().regex(/^\+62\d{8,13}$/, "Phone must be an Indonesian number like +6281234567890"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms of service" }) }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

authRouter.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, username, phone, password } = req.body as z.infer<typeof registerSchema>;

    const settings = await Setting.getMain();
    if (!settings.allowRegistration) {
      fail(res, "Registration is currently disabled", 403);
      return;
    }

    const errors: FieldError[] = [];
    if (await User.exists({ email })) errors.push({ field: "email", message: "Email is already registered" });
    if (await User.exists({ username })) errors.push({ field: "username", message: "Username is already taken" });
    if (errors.length > 0) {
      fail(res, errors[0].message, 400, errors);
      return;
    }

    const user = await User.create({
      role: "free",
      name: username,
      username,
      email,
      phone,
      password: await bcrypt.hash(password, 10),
      apiKey: initialKey(username),
      limit: 30,
    });

    audit(user._id.toString(), "user.register", `user:${username}`, { email }, getClientIp(req));
    ok(res, { user, token: signToken(user._id.toString(), user.role) }, "Account created successfully", 201);
  })
);

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required").transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

authRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body as z.infer<typeof loginSchema>;

    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      fail(res, "Invalid credentials", 401);
      return;
    }

    audit(user._id.toString(), "user.login", `user:${user.username}`, {}, getClientIp(req));
    ok(res, { user, token: signToken(user._id.toString(), user.role) }, "Logged in successfully");
  })
);

const forgotSchema = z.object({
  email: z.string().email("Invalid email address").transform((v) => v.toLowerCase().trim()),
});

authRouter.post(
  "/forgot-password",
  validate(forgotSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as z.infer<typeof forgotSchema>;
    const user = await User.findOne({ email });

    const data: Record<string, unknown> = {};
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
      user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      if (!env.isProduction) {
        data.resetToken = token;
        console.log(`[auth] Password reset URL: http://localhost:3000/reset-password?token=${token}`);
      }
    }

    // Same response whether or not the email exists (no account enumeration).
    ok(res, data, "If that email exists, a reset link has been sent.");
  })
);

const resetSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

authRouter.post(
  "/reset-password",
  validate(resetSchema),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as z.infer<typeof resetSchema>;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: { $gt: new Date() },
    }).select("+password");
    if (!user) {
      fail(res, "Invalid or expired reset token", 400);
      return;
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await user.save();

    audit(user._id.toString(), "user.password_reset", `user:${user.username}`, {}, getClientIp(req));
    ok(res, {}, "Password has been reset successfully. You can now log in.");
  })
);
