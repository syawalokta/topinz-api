import { Request } from "express";

/**
 * Best-effort client IP with IPv6 loopback / IPv4-mapped prefixes normalized
 * so whitelist comparisons work on plain dotted-quad strings.
 */
export function getClientIp(req: Request): string {
  let ip = req.ip ?? req.socket.remoteAddress ?? "";
  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) ip = ip.slice("::ffff:".length);
  return ip;
}

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isValidIPv4(ip: string): boolean {
  const m = IPV4_RE.exec(ip);
  if (!m) return false;
  return m.slice(1).every((octet) => {
    // Reject leading zeros like "01" to avoid ambiguous octal notation.
    if (octet.length > 1 && octet.startsWith("0")) return false;
    const n = Number(octet);
    return n >= 0 && n <= 255;
  });
}
