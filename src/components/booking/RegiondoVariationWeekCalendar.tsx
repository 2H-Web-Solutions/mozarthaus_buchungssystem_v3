import { useMemo } from 'react';
import type { RegiondoVariation } from '../../types/regiondo';
import {
  formatSlotCapacityLabel,
  normalizeAvailabilityDateKey,
  type AvailabilityTimeSlot,
} from '../../utils/regiondoAvailability';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';

/** Date & time only — ticket category is chosen in „Kontingente & Tickets“, not on the calendar. */
export interface SelectedCalendarSlot {
  dateYmd: string;
  time: string;
  capacityLabel?: string;
}

export interface WeekCalendarBlock {
  variationId: string;
  variationName: string;
  variationIndex: number;
  dateYmd: string;
  slot: AvailabilityTimeSlot;
}

export function regiondoVariationLabel(v: RegiondoVariation): string {
  const n = v.name?.trim();
  if (n) return n;
  return v.title || v.variation_name || `Variation ${v.variation_id}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function startOfWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function toYmdLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const VAR_BG = [
  'bg-teal-600 hover:bg-teal-700',
  'bg-emerald-600 hover:bg-emerald-700',
  'bg-cyan-600 hover:bg-cyan-700',
  'bg-sky-600 hover:bg-sky-700',
  'bg-indigo-600 hover:bg-indigo-700',
  'bg-violet-600 hover:bg-violet-700',
];

interface RegiondoVariationWeekCalendarProps {
  productName: string;
  hasVariations: boolean;
  /** Slots for the visible week only (from API per variation). */
  blocks: WeekCalendarBlock[];
  loading: boolean;
  weekStart: Date;
  onWeekStartChange: (d: Date) => void;
  selected: SelectedCalendarSlot | null;
  onSelect: (slot: SelectedCalendarSlot) => void;
}

function slotKey(s: SelectedCalendarSlot): string {
  return `${s.dateYmd}|${s.time}`;
}

export function RegiondoVariationWeekCalendar({
  productName,
  hasVariations,
  blocks,
  loading,
  weekStart,
  onWeekStartChange,
  selected,
  onSelect,
}: RegiondoVariationWeekCalendarProps) {
  const blocksByDay = useMemo(() => {
    const m = new Map<string, WeekCalendarBlock[]>();
    for (let i = 0; i < 7; i++) {
      const ymd = toYmdLocal(addDays(weekStart, i));
      m.set(ymd, []);
    }
    for (const b of blocks) {
      const key = normalizeAvailabilityDateKey(b.dateYmd);
      const list = m.get(key);
      if (list) list.push({ ...b, dateYmd: key });
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.slot.time.localeCompare(b.slot.time) || a.variationName.localeCompare(b.variationName));
    }
    return m;
  }, [blocks, weekStart]);

  const monthYear = weekStart.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });
  const selectedKey = selected ? slotKey(selected) : '';

  const goPrevWeek = () => onWeekStartChange(addDays(weekStart, -7));
  const goNextWeek = () => onWeekStartChange(addDays(weekStart, 7));
  const goToday = () => onWeekStartChange(startOfWeekMonday(new Date()));

  const showEmptyNoProduct = !loading && !productName;
  const showEmptyNoVariations = !loading && productName && !hasVariations;
  const showEmptyWeek = !loading && hasVariations && blocks.length === 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/90">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevWeek}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50"
            aria-label="Vorherige Woche"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goNextWeek}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50"
            aria-label="Nächste Woche"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-gray-900 capitalize ml-1">{monthYear}</span>
        </div>
        <button
          type="button"
          onClick={goToday}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold rounded-xl bg-amber-400 text-amber-950 hover:bg-amber-300 transition-colors disabled:opacity-50"
        >
          Heute
        </button>
      </div>

      <p className="px-4 py-2 text-[11px] text-gray-500 border-b border-gray-100 bg-white">
        Es wird nur die <strong>aktuelle Kalenderwoche</strong> von der Verfügbarkeits-API geladen. Wechsel der Woche
        lädt die nächste/vorherige Woche neu.
      </p>

      {loading && (
        <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
          <span className="inline-block w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          Verfügbarkeit für diese Woche wird geladen…
        </div>
      )}

      {showEmptyNoProduct && (
        <div className="p-8 text-center text-gray-500 text-sm">Bitte zuerst ein Konzert auswählen.</div>
      )}

      {showEmptyNoVariations && (
        <div className="p-8 text-center text-amber-800 text-sm bg-amber-50">
          Keine Varianten für dieses Produkt.
        </div>
      )}

      {showEmptyWeek && (
        <div className="p-8 text-center text-gray-600 text-sm">
          Für diese Woche liefert die API keine Termine — andere Woche wählen oder in Regiondo prüfen.
        </div>
      )}

      {!loading && hasVariations && blocks.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] grid grid-cols-7 divide-x divide-gray-100">
            {Array.from({ length: 7 }, (_, i) => {
              const day = addDays(weekStart, i);
              const ymd = toYmdLocal(day);
              const dayBlocks = blocksByDay.get(ymd) ?? [];
              const isToday = toYmdLocal(new Date()) === ymd;
              const wd = day.toLocaleDateString('de-AT', { weekday: 'short' });
              const dd = pad2(day.getDate());

              return (
                <div
                  key={ymd}
                  className={`flex flex-col min-h-[320px] ${isToday ? 'bg-amber-50/50 ring-2 ring-amber-400 ring-inset' : ''}`}
                >
                  <div
                    className={`text-center py-3 px-2 border-b border-gray-100 text-xs font-bold uppercase tracking-wide ${
                      isToday ? 'text-amber-900' : 'text-gray-600'
                    }`}
                  >
                    <div>{wd}</div>
                    <div className="text-lg text-gray-900 tabular-nums">{dd}</div>
                  </div>
                  <div className="flex-1 p-2 flex flex-col gap-2">
                    {dayBlocks.length === 0 && (
                      <div className="text-[11px] text-gray-400 text-center py-6">—</div>
                    )}
                    {dayBlocks.map((b) => {
                      const cap = formatSlotCapacityLabel(b.slot);
                      const sel: SelectedCalendarSlot = {
                        dateYmd: b.dateYmd,
                        time: b.slot.time,
                        capacityLabel: cap,
                      };
                      const active = slotKey(sel) === selectedKey;
                      const bg = VAR_BG[b.variationIndex % VAR_BG.length];

                      return (
                        <button
                          key={`${b.variationId}-${b.dateYmd}-${b.slot.time}`}
                          type="button"
                          onClick={() => onSelect(sel)}
                          className={`w-full text-left rounded-xl px-3 py-2.5 text-white shadow-md transition-all ${bg} ${
                            active ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-white scale-[1.02]' : ''
                          }`}
                        >
                          <div className="text-base font-bold tabular-nums">{b.slot.time}</div>
                          <div className="text-xs font-semibold opacity-95 leading-snug line-clamp-2">
                            {productName}
                          </div>
                          <div className="text-xs font-medium opacity-90 mt-0.5">{b.variationName}</div>
                          <div className="flex items-center gap-1 mt-1.5 text-[11px] opacity-90">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span className="tabular-nums">{cap ?? '—'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
