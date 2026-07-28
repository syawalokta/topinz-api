import { FilterQuery, Types } from "mongoose";
import { IRequestLog, RequestLog } from "../models/RequestLog";
import { dateKeysForLastNDays, lastNDays, startOfToday } from "./dates";

/**
 * Timezone offset string ("+07:00") for Mongo's $dateToString so day buckets
 * line up with the server-local date keys produced in JS.
 */
function localTimezoneOffset(): string {
  const minutes = -new Date().getTimezoneOffset(); // minutes AHEAD of UTC
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

export interface DailyCount {
  date: string; // YYYY-MM-DD
  count: number;
}

/** Per-day request counts for the last `days` days, zero-filled (no gaps). */
export async function dailyCounts(match: FilterQuery<IRequestLog>, days: number): Promise<DailyCount[]> {
  const rows = await RequestLog.aggregate<{ _id: string; count: number }>([
    { $match: { ...match, createdAt: { $gte: lastNDays(days) } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: localTimezoneOffset() } },
        count: { $sum: 1 },
      },
    },
  ]);
  const byDate = new Map(rows.map((r) => [r._id, r.count]));
  return dateKeysForLastNDays(days).map((date) => ({ date, count: byDate.get(date) ?? 0 }));
}

/** Sum of request costs consumed today by one user (the daily-limit meter). */
export async function usedToday(userId: Types.ObjectId): Promise<number> {
  const agg = await RequestLog.aggregate<{ _id: null; used: number }>([
    { $match: { user: userId, createdAt: { $gte: startOfToday() } } },
    { $group: { _id: null, used: { $sum: "$cost" } } },
  ]);
  return agg[0]?.used ?? 0;
}
