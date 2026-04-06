import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRegiondoProducts } from '../services/regiondoProductsService';
import type { RegiondoPage, RegiondoProduct } from '../types/regiondo';
import { RegiondoScheduleModal } from '../components/events/RegiondoScheduleModal';
import { Calendar, ExternalLink, RefreshCw } from 'lucide-react';

function currencyLabel(p: RegiondoProduct): string {
  return p.currency_code || p.curency_code || 'EUR';
}

function formatPrice(p: RegiondoProduct): string {
  const price = p.base_price ?? p.original_price;
  if (!price) return '—';
  const cur = currencyLabel(p);
  return `${price} ${cur}`;
}

function formatDuration(p: RegiondoProduct): string {
  if (!p.duration_values) return '—';
  const unit = p.duration_type === 'hour' ? 'h' : p.duration_type || '';
  return unit ? `${p.duration_values} ${unit}` : String(p.duration_values);
}

function formatRating(p: RegiondoProduct): string {
  if (!p.rating_summary) return '—';
  const n = p.reviews_count ? ` (${p.reviews_count})` : '';
  return `${p.rating_summary}%${n}`;
}

function stockLabel(p: RegiondoProduct): { text: string; ok: boolean } {
  if (p.is_expired === '1') return { text: 'abgelaufen', ok: false };
  if (p.in_stock === '1') return { text: 'verfügbar', ok: true };
  if (p.in_stock === '0') return { text: 'nicht lagernd', ok: false };
  return { text: '—', ok: true };
}

function publicProductUrl(p: RegiondoProduct): string | undefined {
  return p.wl_regiondo_url || p.regiondo_url;
}

export function Events() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<RegiondoProduct[]>([]);
  const [pageInfo, setPageInfo] = useState<RegiondoPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleProduct, setScheduleProduct] = useState<RegiondoProduct | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { products: list, page } = await fetchRegiondoProducts({
        limit: 250,
        offset: 0,
        store_locale: 'de-AT',
      });
      setProducts(list);
      setPageInfo(page);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Produkte konnten nicht geladen werden.');
      setProducts([]);
      setPageInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading text-brand-primary">Events & Konzerte</h1>
          <p className="text-sm text-gray-500 mt-1">
            Produkte aus der Regiondo API
            {pageInfo != null && (
              <span className="ml-2">
                · {pageInfo.total_items} Eintrag{pageInfo.total_items === 1 ? '' : 'e'}
                {pageInfo.total_pages > 1 ? ` · Seite ${pageInfo.current} / ${pageInfo.total_pages}` : ''}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Laden…' : 'Aktualisieren'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="p-3 w-20"></th>
              <th className="p-3">Produkt</th>
              <th className="p-3 whitespace-nowrap">ID / SKU</th>
              <th className="p-3 whitespace-nowrap">Preis</th>
              <th className="p-3">Ort</th>
              <th className="p-3 whitespace-nowrap">Dauer</th>
              <th className="p-3 whitespace-nowrap">Bewertung</th>
              <th className="p-3 whitespace-nowrap">Bestand</th>
              <th className="p-3 whitespace-nowrap">Varianten</th>
              <th className="p-3 whitespace-nowrap">Termine</th>
              <th className="p-3 text-right whitespace-nowrap">Shop</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-gray-500">
                  Daten werden von Regiondo geladen…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-gray-500">
                  Keine Produkte gefunden.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const href = publicProductUrl(p);
                const stock = stockLabel(p);
                const vars = p.variations?.length ?? 0;
                return (
                  <tr
                    key={p.product_id}
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/events/regiondo/${p.product_id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/events/regiondo/${p.product_id}`);
                      }
                    }}
                    className="hover:bg-gray-50/90 transition-colors align-top cursor-pointer"
                  >
                    <td className="p-3">
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt=""
                          className="w-16 h-12 object-cover rounded border border-gray-100"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gray-100 rounded border border-gray-100" />
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-900 text-sm leading-snug">{p.name}</div>
                      {p.provider && (
                        <div className="text-xs text-gray-500 mt-0.5">{p.provider}</div>
                      )}
                      {p.type_id && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] uppercase tracking-wide bg-gray-100 text-gray-600 rounded">
                          {p.type_id}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs font-mono text-gray-700">
                      <div>{p.product_id}</div>
                      {p.sku && <div className="text-gray-500 mt-0.5">{p.sku}</div>}
                    </td>
                    <td className="p-3 text-sm whitespace-nowrap">{formatPrice(p)}</td>
                    <td className="p-3 text-sm text-gray-700 max-w-[200px]">
                      {[p.zipcode, p.city].filter(Boolean).join(' ') || '—'}
                      {p.location_address && (
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.location_address}</div>
                      )}
                    </td>
                    <td className="p-3 text-sm whitespace-nowrap">{formatDuration(p)}</td>
                    <td className="p-3 text-sm whitespace-nowrap">{formatRating(p)}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          stock.ok ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'
                        }`}
                      >
                        {stock.text}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-center tabular-nums">{vars}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setScheduleProduct(p);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-primary/30 text-brand-primary bg-white hover:bg-red-50 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        Termine anzeigen
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-brand-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          Öffnen
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <RegiondoScheduleModal
        isOpen={scheduleProduct !== null}
        product={scheduleProduct}
        onClose={() => setScheduleProduct(null)}
      />
    </div>
  );
}
