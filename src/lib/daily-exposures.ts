import { prisma } from './db';

type RawDailyCount = { date: Date; variantKey: string; visitors: bigint };

export type DailySeriesPoint = { date: string; countsByVariant: Record<string, number> };

/**
 * Per-day, per-variant exposure counts for the daily-exposures chart. Each
 * Exposure row already represents one visitor's first (deduped) exposure —
 * see the @@unique([projectId, userId, experimentKey]) constraint in
 * schema.prisma — so this is a plain row count per day, not a distinct-user
 * count on top of an already-deduped table.
 */
async function getDailyExposureCounts(projectId: string, experimentKey: string): Promise<RawDailyCount[]> {
  return prisma.$queryRaw<RawDailyCount[]>`
    SELECT date_trunc('day', "createdAt") AS date, "variantKey", COUNT(*) AS visitors
    FROM "Exposure"
    WHERE "projectId" = ${projectId} AND "experimentKey" = ${experimentKey}
    GROUP BY date_trunc('day', "createdAt"), "variantKey"
    ORDER BY date ASC
  `;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Builds a dense day-by-day series (zero-filled, no gaps) between rangeStart
 * and rangeEnd for the given variants — the chart needs every day to plot a
 * bar, not just the days that happened to have traffic.
 */
export async function getDailyExposureSeries(
  projectId: string,
  experimentKey: string,
  variantKeys: string[],
  rangeStart: Date,
  rangeEnd: Date
): Promise<DailySeriesPoint[]> {
  const counts = await getDailyExposureCounts(projectId, experimentKey);

  const byDate = new Map<string, Record<string, number>>();
  for (const { date, variantKey, visitors } of counts) {
    const key = toDateKey(date);
    const bucket = byDate.get(key) ?? {};
    bucket[variantKey] = Number(visitors);
    byDate.set(key, bucket);
  }

  const series: DailySeriesPoint[] = [];
  const cursor = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth(), rangeStart.getUTCDate()));
  const end = new Date(Date.UTC(rangeEnd.getUTCFullYear(), rangeEnd.getUTCMonth(), rangeEnd.getUTCDate()));

  while (cursor <= end) {
    const key = toDateKey(cursor);
    const bucket = byDate.get(key) ?? {};
    series.push({ date: key, countsByVariant: Object.fromEntries(variantKeys.map((k) => [k, bucket[k] ?? 0])) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return series;
}
