function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Regiondo may return map keys like `2026-4-7` while the UI uses `2026-04-07` — lookups then miss that day
 * (often the first column / Monday appears empty).
 */
export function normalizeAvailabilityDateKey(raw: string): string {
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    return `${m[1]}-${pad2(Number(m[2]))}-${pad2(Number(m[3]))}`;
  }
  const d = new Date(t);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  return t;
}

function formatTimeLabel(s: string): string {
  const t = s.trim();
  if (t.length >= 5) return t.slice(0, 5);
  return t;
}

/** Keys Regiondo (or similar) may use on slot objects — best-effort extraction. */
const TIME_KEYS = ['time', 'start_time', 'start', 'from_time'] as const;

const AVAILABLE_NUM_KEYS = [
  'available',
  'qty',
  'quantity',
  'free',
  'places_left',
  'remaining',
  'slots_left',
  'stock',
] as const;

const TOTAL_NUM_KEYS = [
  'total',
  'capacity',
  'max',
  'max_qty',
  'qty_max',
  'places_total',
  'max_places',
] as const;

function pickNumber(obj: Record<string, unknown>, keys: readonly string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && /^-?\d+(\.\d+)?$/.test(v.trim())) {
      return Number(v.trim());
    }
  }
  return undefined;
}

function timeFromRecord(slot: Record<string, unknown>): string | null {
  for (const k of TIME_KEYS) {
    const v = slot[k];
    if (typeof v === 'string' && v.trim() !== '') return formatTimeLabel(v);
  }
  return null;
}

export interface AvailabilityTimeSlot {
  time: string;
  /** Seats / places left (API-dependent). */
  available?: number;
  /** Max seats / capacity for this slot (API-dependent). */
  total?: number;
}

/**
 * Regiondo often wraps times as `[["20:00:00"]]` — unwrap single-element arrays until we hit a leaf.
 */
function unwrapSlotLeaf(slot: unknown): unknown {
  let cur = slot;
  while (Array.isArray(cur) && cur.length === 1) {
    cur = cur[0];
  }
  return cur;
}

function parseOneSlot(slot: unknown): AvailabilityTimeSlot | null {
  if (typeof slot === 'string') {
    return { time: formatTimeLabel(slot) };
  }
  const leaf = unwrapSlotLeaf(slot);
  if (typeof leaf === 'string') {
    return { time: formatTimeLabel(leaf) };
  }
  if (Array.isArray(leaf) && leaf[0] !== undefined) {
    return { time: formatTimeLabel(String(leaf[0])) };
  }
  if (isRecord(leaf)) {
    const time = timeFromRecord(leaf);
    if (!time) return null;
    const available = pickNumber(leaf, AVAILABLE_NUM_KEYS);
    const total = pickNumber(leaf, TOTAL_NUM_KEYS);
    return {
      time,
      ...(available !== undefined ? { available } : {}),
      ...(total !== undefined ? { total } : {}),
    };
  }
  return null;
}

function normalizeSlots(slots: unknown): AvailabilityTimeSlot[] {
  if (!Array.isArray(slots)) return [];
  const byTime = new Map<string, AvailabilityTimeSlot>();
  for (const slot of slots) {
    const parsed = parseOneSlot(slot);
    if (!parsed) continue;
    const prev = byTime.get(parsed.time);
    if (!prev) {
      byTime.set(parsed.time, parsed);
      continue;
    }
    byTime.set(parsed.time, {
      time: parsed.time,
      available: parsed.available ?? prev.available,
      total: parsed.total ?? prev.total,
    });
  }
  return [...byTime.values()].sort((a, b) => a.time.localeCompare(b.time));
}

export interface AvailabilityDayRow {
  date: string;
  /** Per time slot; may include optional capacity when the API sends numeric fields. */
  slots: AvailabilityTimeSlot[];
}

/** Human-readable capacity fragment for UI (e.g. badges). */
export function formatSlotCapacityLabel(s: AvailabilityTimeSlot): string | undefined {
  if (s.available !== undefined && s.total !== undefined) {
    return `${s.available} / ${s.total}`;
  }
  if (s.available !== undefined) return `${s.available} frei`;
  if (s.total !== undefined) return `max. ${s.total}`;
  return undefined;
}

/** Count slots and whether any carry numeric capacity; first example label for previews. */
export function summarizeScheduleCapacity(rows: AvailabilityDayRow[]): {
  slotCount: number;
  hasCapacityInfo: boolean;
  exampleLabel?: string;
} {
  let slotCount = 0;
  let hasCapacityInfo = false;
  let exampleLabel: string | undefined;

  for (const row of rows) {
    for (const s of row.slots) {
      slotCount += 1;
      if (s.available !== undefined || s.total !== undefined) {
        hasCapacityInfo = true;
        if (!exampleLabel) {
          exampleLabel = formatSlotCapacityLabel(s);
        }
      }
    }
  }

  return { slotCount, hasCapacityInfo, exampleLabel };
}

/** Parses a `date → slots[]` map (e.g. `available_dates` on a variation). */
export function parseAvailabilityDateMap(map: unknown): AvailabilityDayRow[] {
  if (!isRecord(map)) return [];
  return Object.entries(map)
    .map(([date, slots]) => ({
      date: normalizeAvailabilityDateKey(date),
      slots: normalizeSlots(slots),
    }))
    .filter((row) => row.slots.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Time slots for one calendar day from a variation’s `available_dates` map (product detail). */
export function slotsForDateInVariation(availableDates: unknown, ymd: string): AvailabilityTimeSlot[] {
  const rows = parseAvailabilityDateMap(availableDates);
  return rows.find((r) => r.date === ymd)?.slots ?? [];
}

/**
 * Flattens Regiondo availability payload into sorted date rows.
 * Accepts `{ data: { … } }` from `GET …/availabilities/{id}` or `{ available_dates: { … } }` (e.g. on product detail).
 */
export function parseAvailabilitySchedule(body: unknown): AvailabilityDayRow[] {
  if (!isRecord(body)) return [];
  const raw = body.data ?? body.available_dates;
  if (raw === undefined || raw === null) return [];
  return parseAvailabilityDateMap(raw);
}
