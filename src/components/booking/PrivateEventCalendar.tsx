import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toYmdLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Monday-based weekday: Mon=0 … Sun=6 */
function mondayWeekday(d: Date): number {
  const wd = d.getDay();
  return wd === 0 ? 6 : wd - 1;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseYmd(ymd: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(y, mo - 1, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== day) return null;
  return startOfDay(d);
}

interface PrivateEventCalendarProps {
  /** YYYY-MM-DD or '' */
  selectedDateYmd: string;
  onSelectDate: (ymd: string) => void;
  /** HH:mm (HTML time input) */
  timeValue: string;
  onTimeChange: (hhmm: string) => void;
}

/**
 * Month grid + time — styled for Privatbuchung (Firebase only, no Regiondo purchase).
 * Visual language aligned with `RegiondoVariationWeekCalendar` (rounded card, header bar).
 */
export function PrivateEventCalendar({
  selectedDateYmd,
  onSelectDate,
  timeValue,
  onTimeChange,
}: PrivateEventCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  useEffect(() => {
    if (!selectedDateYmd) return;
    const p = parseYmd(selectedDateYmd);
    if (!p) return;
    setViewMonth((prev) => {
      if (prev.getFullYear() === p.getFullYear() && prev.getMonth() === p.getMonth()) return prev;
      return new Date(p.getFullYear(), p.getMonth(), 1);
    });
  }, [selectedDateYmd]);

  const today = startOfDay(new Date());

  const { year, monthIndex, labelDe, cells } = useMemo(() => {
    const y = viewMonth.getFullYear();
    const mi = viewMonth.getMonth();
    const label = viewMonth.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });
    const first = new Date(y, mi, 1);
    const mondayOffset = mondayWeekday(first);
    const gridStart = new Date(y, mi, 1 - mondayOffset);
    const out: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      out.push({
        date: startOfDay(d),
        inMonth: d.getMonth() === mi,
      });
    }
    return { year: y, monthIndex: mi, labelDe: label, cells: out };
  }, [viewMonth]);

  const selectedDate = selectedDateYmd ? parseYmd(selectedDateYmd) : null;

  const goPrev = () => setViewMonth(new Date(year, monthIndex - 1, 1));
  const goNext = () => setViewMonth(new Date(year, monthIndex + 1, 1));
  const goThisMonth = () => {
    const n = new Date();
    setViewMonth(new Date(n.getFullYear(), n.getMonth(), 1));
  };

  const weekLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500 leading-relaxed">
        Privat-Events werden <strong>nur in Firebase</strong> angelegt — ohne Regiondo-Kauf-API. Wählen Sie Datum
        und Uhrzeit für Ihre interne Planung.
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-purple-100 bg-purple-50/90">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="p-2 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 text-purple-900 transition-colors"
              aria-label="Vorheriger Monat"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="p-2 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 text-purple-900 transition-colors"
              aria-label="Nächster Monat"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-gray-900 capitalize ml-1">{labelDe}</span>
          </div>
          <button
            type="button"
            onClick={goThisMonth}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-amber-400 text-amber-950 hover:bg-amber-300 transition-colors"
          >
            Heute
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-purple-100/80 border-b border-purple-100">
          {weekLabels.map((w) => (
            <div
              key={w}
              className="bg-purple-50/80 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-purple-800"
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-100 p-2">
          {cells.map(({ date, inMonth }, idx) => {
            const ymd = toYmdLocal(date);
            const isSelected = selectedDate != null && date.getTime() === selectedDate.getTime();
            const isToday = date.getTime() === today.getTime();
            const isPast = date.getTime() < today.getTime();
            return (
              <button
                key={`${ymd}-${idx}`}
                type="button"
                disabled={isPast}
                onClick={() => onSelectDate(ymd)}
                className={[
                  'aspect-square min-h-[2.5rem] rounded-xl text-sm font-semibold transition-all',
                  !inMonth && 'text-gray-300',
                  inMonth && !isPast && 'text-gray-900 hover:bg-purple-100',
                  isPast && 'text-gray-200 cursor-not-allowed',
                  isToday && inMonth && !isPast && 'ring-2 ring-amber-400 ring-offset-1',
                  isSelected && 'bg-purple-600 text-white shadow-md hover:bg-purple-700',
                  !isSelected && inMonth && !isPast && 'bg-white border border-gray-100',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5 shadow-inner">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
          <Clock className="w-5 h-5 text-purple-600" aria-hidden />
          Uhrzeit
        </label>
        <input
          type="time"
          value={timeValue}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-full max-w-xs p-4 border border-gray-300 rounded-xl bg-white text-gray-900 text-lg font-semibold tabular-nums shadow-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400"
        />
      </div>
    </div>
  );
}
