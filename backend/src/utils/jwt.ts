import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "../models/User";

export interface JwtPayload {
  sub: string; // user id
  role: Role;
}

export function signToken(userId: string, role: Role): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId, role }, env.jwtSecret, options);
}

/** Returns the decoded payload or null when invalid/expired. */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === "string" || !decoded.sub) return null;
    return { sub: String(decoded.sub), role: (decoded as { role?: Role }).role ?? "free" };
  } catch {
    return null;
  }
}
