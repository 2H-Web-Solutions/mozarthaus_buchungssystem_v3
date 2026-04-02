function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function formatTimeLabel(s: string): string {
  const t = s.trim();
  if (t.length >= 5) return t.slice(0, 5);
  return t;
}

function normalizeTimes(slots: unknown): string[] {
  if (!Array.isArray(slots)) return [];
  const out: string[] = [];
  for (const slot of slots) {
    if (typeof slot === 'string') {
      out.push(formatTimeLabel(slot));
    } else if (Array.isArray(slot) && slot[0] !== undefined) {
      out.push(formatTimeLabel(String(slot[0])));
    } else if (isRecord(slot) && typeof slot.time === 'string') {
      out.push(formatTimeLabel(slot.time));
    }
  }
  return [...new Set(out)].sort();
}

export interface AvailabilityDayRow {
  date: string;
  times: string[];
}

/**
 * Flattens Regiondo availability payload into sorted date rows.
 */
export function parseAvailabilitySchedule(body: unknown): AvailabilityDayRow[] {
  if (!isRecord(body) || body.data === undefined || body.data === null) {
    return [];
  }
  const data = body.data as Record<string, unknown>;
  return Object.entries(data)
    .map(([date, slots]) => ({
      date,
      times: normalizeTimes(slots),
    }))
    .filter((row) => row.times.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}
