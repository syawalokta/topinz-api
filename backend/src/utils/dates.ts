/** Midnight today, server-local time. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** First day of the current month, midnight server-local time. */
export function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Midnight of the day (n - 1) days ago, i.e. a window covering the last n calendar days. */
export function lastNDays(n: number): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - (n - 1));
  return d;
}

/** Format a Date as local "YYYY-MM-DD" — used as aggregation bucket keys. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Ordered list of local date keys for the last n days ending today. */
export function dateKeysForLastNDays(n: number): string[] {
  const keys: string[] = [];
  const start = lastNDays(n);
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    keys.push(toDateKey(d));
  }
  return keys;
}
