import { NextFunction, Request, Response } from "express";
import { Role, User, UserDocument } from "../models/User";
import { fail } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { verifyToken } from "../utils/jwt";

/**
 * Premium users whose premiumExpiresAt is in the past behave as free users
 * for permission checks. We never write the downgrade back to the DB on the
 * request path — admin/user flows surface it via the premiumExpired hint.
 */
export function effectiveRole(user: Pick<UserDocument, "role" | "premiumExpiresAt">): Role {
  if (isPremiumExpired(user)) return "free";
  return user.role;
}

export function isPremiumExpired(user: Pick<UserDocument, "role" | "premiumExpiresAt">): boolean {
  return (
    user.role === "premium" &&
    user.premiumExpiresAt !== null &&
    user.premiumExpiresAt.getTime() < Date.now()
  );
}

async function loadUserFromAuthHeader(req: Request): Promise<UserDocument | null> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const payload = verifyToken(header.slice("Bearer ".length).trim());
  if (!payload) return null;
  return User.findById(payload.sub);
}

/** Bearer JWT → req.user, else 401. */
export const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await loadUserFromAuthHeader(req);
  if (!user) {
    fail(res, "Authentication required", 401);
    return;
  }
  req.user = user;
  req.effectiveRole = effectiveRole(user);
  next();
});

/** Attaches req.user when a valid token is present; never rejects. */
export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const user = await loadUserFromAuthHeader(req);
  if (user) {
    req.user = user;
    req.effectiveRole = effectiveRole(user);
  }
  next();
});

/** Must run after requireAuth. Admin role is never auto-downgraded. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    fail(res, "Admin access required", 403);
    return;
  }
  next();
}
