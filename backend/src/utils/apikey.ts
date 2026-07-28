import crypto from "crypto";

/** Key assigned at registration: Tpz-<username> */
export function initialKey(username: string): string {
  return `Tpz-${username}`;
}

const ALPHANUM = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Key after a reset: Tpz-<username>-<6 random lowercase alphanumerics> */
export function resetKey(username: string): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += ALPHANUM[crypto.randomInt(ALPHANUM.length)];
  }
  return `Tpz-${username}-${suffix}`;
}
