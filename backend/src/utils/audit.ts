import { AuditLog } from "../models/AuditLog";

/**
 * Fire-and-forget audit trail write. Never throws and never blocks the
 * request path — audit failures are logged and swallowed.
 */
export function audit(
  actorId: string | null,
  action: string,
  target: string,
  meta: Record<string, unknown> = {},
  ip = ""
): void {
  AuditLog.create({ actor: actorId, action, target, meta, ip }).catch((err) => {
    console.error(`[audit] failed to record "${action}":`, err instanceof Error ? err.message : err);
  });
}
