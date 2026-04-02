import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchSupplierBookings } from '../../services/regiondoSupplierBookingsService';
import type { RegiondoSupplierBooking } from '../../types/regiondoSupplierBooking';
import { Calendar, FileText, Package, RefreshCw, User } from 'lucide-react';

function formatDateTimeDe(raw: string | undefined): string {
  if (!raw) return '—';
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    const [, y, mo, d, h, mnt] = m;
    return `${d}.${mo}.${y}, ${h}:${mnt} Uhr`;
  }
  try {
    return new Date(raw.replace(' ', 'T')).toLocaleString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
}

function formatEuro(amount: string | undefined): string {
  if (amount === undefined || amount === '') return '—';
  const n = Number.parseFloat(amount);
  if (Number.isNaN(n)) return `€ ${amount}`;
  return `€ ${n.toFixed(2)}`;
}

function guestDisplayName(b: RegiondoSupplierBooking): string {
  const fn = b.first_name?.trim();
  const ln = b.last_name?.trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ');
  const c = b.contact_data;
  if (c?.firstname || c?.lastname) {
    return [c.firstname, c.lastname].filter(Boolean).join(' ');
  }
  return '—';
}

function guestEmail(b: RegiondoSupplierBooking): string {
  return b.email?.trim() || b.contact_data?.email?.trim() || '—';
}

function guestPhone(b: RegiondoSupplierBooking): string {
  return b.phone_number?.trim() || b.contact_data?.telephone?.trim() || '';
}

function receiptUrl(b: RegiondoSupplierBooking): string | undefined {
  const docs = b.documents;
  if (!docs?.length) return undefined;
  const sales = docs.find((d) => d.type === 'sales_receipt' && d.url);
  return sales?.url ?? docs.find((d) => d.url)?.url;
}

function bookingRowKey(b: RegiondoSupplierBooking, idx: number): string {
  return b.booking_key || b.order_number || `${b.order_id}-${idx}` || `row-${idx}`;
}

interface RegiondoSupplierBookingsPanelProps {
  searchTerm: string;
}

export function RegiondoSupplierBookingsPanel({ searchTerm }: RegiondoSupplierBookingsPanelProps) {
  const [bookings, setBookings] = useState<RegiondoSupplierBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateFilter, setDateFilter] = useState('date_bought');
  const [totalHint, setTotalHint] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const date_range =
        dateFrom && dateTo ? `${dateFrom},${dateTo}` : dateFrom ? `${dateFrom},${dateFrom}` : undefined;
      const { bookings: rows, page } = await fetchSupplierBookings({
        limit,
        offset,
        date_filter: dateFilter || undefined,
        date_range,
        store_locale: 'de-AT',
      });
      setBookings(rows);
      setTotalHint(page?.total_items ?? null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Regiondo Buchungen konnten nicht geladen werden.');
      setBookings([]);
      setTotalHint(null);
    } finally {
      setLoading(false);
    }
  }, [limit, offset, dateFrom, dateTo, dateFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => JSON.stringify(b).toLowerCase().includes(q));
  }, [bookings, searchTerm]);

  const canPrev = offset > 0;
  const canNext = totalHint != null ? offset + limit < totalHint : bookings.length >= limit;

  return (
    <>
      <div className="bg-white p-4 shadow-sm border border-gray-200 border-b-0 border-t flex flex-wrap gap-3 items-end">
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Datum-Filter</label>
          <select
            value={dateFilter}
            onChange={(e) => {
              setOffset(0);
              setDateFilter(e.target.value);
            }}
            className="p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 min-w-[160px]"
          >
            <option value="date_bought">Kaufdatum</option>
            <option value="date_event">Termin / Event</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Von (optional)</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setOffset(0);
              setDateFrom(e.target.value);
            }}
            className="p-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bis (optional)</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setOffset(0);
              setDateTo(e.target.value);
            }}
            className="p-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <p className="text-xs text-gray-500 pb-2 max-w-md">
          Nutzt die Regiondo Supplier API <code className="bg-gray-100 px-1 rounded">GET /supplier/bookings</code>
          inkl. <strong>order_number</strong> für Folgeabfragen (z. B. Checkout Purchase).
        </p>
      </div>

      {error && (
        <div className="mx-0 mb-0 p-4 bg-red-50 border border-red-200 text-red-800 text-sm whitespace-pre-wrap rounded-none border-t-0">
          {error}
        </div>
      )}

      <div className="border border-gray-200 border-t-0 bg-white">
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-4 space-y-4">
          {loading && bookings.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Lade Regiondo Buchungen…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Keine Einträge.</p>
          ) : (
            filtered.map((b, idx) => {
              const pdf = receiptUrl(b);
              const bookingLabel = b.booking_status?.label || b.status || '—';
              const paymentLabel = b.payment_status?.label || '—';
              const productLine = [b.product_name || b.ticket_name, b.option_name, b.variation_name]
                .filter(Boolean)
                .join(' · ');
              const qtyLine = b.qty != null ? `${b.qty} ${b.qty === 1 ? 'Ticket' : 'Tickets'}` : '—';

              return (
                <article
                  key={bookingRowKey(b, idx)}
                  className="rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/40 shadow-sm hover:border-gray-300 transition-colors"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 gap-y-1">
                          <span className="text-lg font-heading font-semibold text-brand-primary">
                            {b.order_number ?? '—'}
                          </span>
                          {b.order_id && (
                            <span className="text-xs text-gray-500 font-mono">Order #{b.order_id}</span>
                          )}
                        </div>
                        {b.external_id && (
                          <p className="text-xs text-gray-500 mt-0.5 font-mono">Ext. ID: {b.external_id}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {bookingLabel}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-900 border border-sky-200">
                          {paymentLabel}
                        </span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <Package className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Produkt / Option</p>
                            <p className="text-gray-900 font-medium">{productLine || '—'}</p>
                            {b.variation_id && (
                              <p className="text-xs text-gray-500 mt-0.5">Variation {b.variation_id}</p>
                            )}
                            <p className="text-xs text-gray-600 mt-1">{qtyLine}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Termin</p>
                            <p className="text-gray-900">{formatDateTimeDe(b.event_date_time || b.date_applied_for)}</p>
                            {b.duration_value && b.duration_type && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Dauer: {b.duration_value} {b.duration_type === 'hour' ? 'Std.' : b.duration_type}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <User className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gast</p>
                            <p className="text-gray-900 font-medium">{guestDisplayName(b)}</p>
                            <p className="text-gray-600 truncate text-sm">{guestEmail(b)}</p>
                            {guestPhone(b) && <p className="text-xs text-gray-500 mt-0.5">{guestPhone(b)}</p>}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="w-5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Betrag</p>
                            <p className="text-xl font-bold text-gray-900 tabular-nums">{formatEuro(b.total_amount)}</p>
                            {b.distribution_channel_partner && (
                              <p className="text-xs text-gray-600 mt-1">
                                Vertrieb: <span className="font-medium">{b.distribution_channel_partner}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {(b.created_at || b.updated_at || b.product_comment) && (
                      <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600">
                        {(b.created_at || b.updated_at) && (
                          <span>
                            {b.created_at && <>Erstellt: {formatDateTimeDe(b.created_at)}</>}
                            {b.updated_at && b.updated_at !== b.created_at && (
                              <> · Aktualisiert: {formatDateTimeDe(b.updated_at)}</>
                            )}
                          </span>
                        )}
                        {b.product_comment && (
                          <p className="mt-1 text-gray-500 italic">Hinweis: {b.product_comment}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {pdf && (
                        <a
                          href={pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-primary text-white hover:bg-red-700 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Beleg / PDF
                        </a>
                      )}
                      {b.booking_key && (
                        <span className="text-[10px] text-gray-400 font-mono break-all max-w-full">
                          booking_key: {b.booking_key}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 border-t-0 rounded-b-lg text-sm text-gray-600">
        <span>
          {totalHint != null ? (
            <>
              {offset + 1}–{Math.min(offset + filtered.length, offset + limit)} von ca. {totalHint}
            </>
          ) : (
            <>
              Offset {offset}, bis zu {limit} pro Seite
            </>
          )}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canPrev || loading}
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40"
          >
            Zurück
          </button>
          <button
            type="button"
            disabled={!canNext || loading}
            onClick={() => setOffset((o) => o + limit)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40"
          >
            Weiter
          </button>
        </div>
      </div>
    </>
  );
}
