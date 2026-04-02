import { useState, useEffect, useCallback } from 'react';
import type { RegiondoProduct, RegiondoVariation } from '../../types/regiondo';
import {
  defaultAvailabilityDateRange,
  fetchRegiondoAvailabilities,
} from '../../services/regiondoProductsService';
import { parseAvailabilitySchedule, type AvailabilityDayRow } from '../../utils/regiondoAvailability';
import { Calendar, Loader2, X } from 'lucide-react';

interface RegiondoScheduleModalProps {
  isOpen: boolean;
  product: RegiondoProduct | null;
  onClose: () => void;
}

export function RegiondoScheduleModal({ isOpen, product, onClose }: RegiondoScheduleModalProps) {
  const variations: RegiondoVariation[] = product?.variations ?? [];
  const [variationId, setVariationId] = useState('');
  const [dtFrom, setDtFrom] = useState('');
  const [dtTo, setDtTo] = useState('');
  const [rows, setRows] = useState<AvailabilityDayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !product) return;
    const r = defaultAvailabilityDateRange();
    setDtFrom(r.dt_from);
    setDtTo(r.dt_to);
    setVariationId(product.variations?.[0]?.variation_id ?? '');
    setRows([]);
    setError(null);
  }, [isOpen, product?.product_id]);

  const load = useCallback(async () => {
    if (!variationId || !dtFrom || !dtTo) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRegiondoAvailabilities(variationId, {
        dt_from: dtFrom,
        dt_to: dtTo,
        store_locale: 'de-AT',
      });
      setRows(parseAvailabilitySchedule(res));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Termine konnten nicht geladen werden.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [variationId, dtFrom, dtTo]);

  useEffect(() => {
    if (!isOpen || !variationId || !dtFrom || !dtTo) return;
    void load();
  }, [isOpen, variationId, dtFrom, dtTo, load]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200">
        <div className="flex items-start justify-between gap-4 p-4 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-lg font-heading text-brand-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 shrink-0" />
              Termine &amp; Zeiten
            </h2>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 space-y-3">
          {variations.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Variante (Variation-ID)</label>
              <select
                value={variationId}
                onChange={(e) => setVariationId(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              >
                {variations.map((v) => (
                  <option key={v.variation_id} value={v.variation_id}>
                    {v.variation_id}
                    {v.options?.length ? ` (${v.options.map((o) => o.option_id).join(', ')})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {variations.length <= 1 && variationId && (
            <p className="text-xs text-gray-500">
              Variation-ID: <span className="font-mono">{variationId}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Von</label>
              <input
                type="date"
                value={dtFrom}
                onChange={(e) => setDtFrom(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Bis</label>
              <input
                type="date"
                value={dtTo}
                onChange={(e) => setDtTo(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg"
              />
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading || !variationId}
              className="px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Laden
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Standardzeitraum: die nächsten 7 Tage (heute bis einschließlich +6 Tage). Sie können den Zeitraum anpassen und erneut laden.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!variationId && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Für dieses Produkt ist keine Variation-ID hinterlegt — Regiondo liefert Termine pro Variante.
            </p>
          )}

          {error && (
            <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3 mb-3 whitespace-pre-wrap">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-gray-600 py-8 justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Termine werden geladen…</span>
            </div>
          )}

          {!loading && variationId && !error && rows.length === 0 && (
            <p className="text-sm text-gray-500 py-6 text-center">Keine Termine im gewählten Zeitraum.</p>
          )}

          {!loading && rows.length > 0 && (
            <ul className="space-y-3">
              {rows.map((row) => (
                <li
                  key={row.date}
                  className="border border-gray-100 rounded-lg p-3 bg-gray-50/80"
                >
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    {new Date(row.date + 'T12:00:00').toLocaleDateString('de-AT', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {row.times.map((t) => (
                      <span
                        key={t}
                        className="inline-flex px-2 py-0.5 text-xs font-medium rounded-md bg-white border border-gray-200 text-gray-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
