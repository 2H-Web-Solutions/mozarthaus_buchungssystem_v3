import { useState, useEffect } from 'react';
import type { RegiondoProduct, RegiondoVariation } from '../../types/regiondo';
import { fetchRegiondoProductById } from '../../services/regiondoProductsService';
import { Info, Loader2, X, ExternalLink } from 'lucide-react';

interface RegiondoProductDetailModalProps {
  isOpen: boolean;
  /** Row from list (used for title while loading); `product_id` required. */
  listProduct: RegiondoProduct | null;
  onClose: () => void;
}

function currencyLabel(p: RegiondoProduct): string {
  return p.currency_code || p.curency_code || 'EUR';
}

function publicProductUrl(p: RegiondoProduct): string | undefined {
  return p.wl_regiondo_url || p.regiondo_url;
}

export function RegiondoProductDetailModal({ isOpen, listProduct, onClose }: RegiondoProductDetailModalProps) {
  const [detail, setDetail] = useState<RegiondoProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    if (!isOpen || !listProduct?.product_id) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    void (async () => {
      try {
        const d = await fetchRegiondoProductById(listProduct.product_id, {
          store_locale: 'de-AT',
          currency: 'default',
        });
        if (!cancelled) setDetail(d);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Produkt konnte nicht geladen werden.');
          setDetail(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, listProduct?.product_id]);

  if (!isOpen || !listProduct) return null;

  const p = detail ?? listProduct;
  const href = publicProductUrl(p);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="regiondo-product-detail-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200">
        <div className="flex items-start justify-between gap-4 p-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0 flex gap-3">
            {p.thumbnail ? (
              <img
                src={p.thumbnail}
                alt=""
                className="w-20 h-14 object-cover rounded border border-gray-100 shrink-0"
              />
            ) : (
              <div className="w-20 h-14 bg-gray-100 rounded border border-gray-100 shrink-0" />
            )}
            <div className="min-w-0">
              <h2
                id="regiondo-product-detail-title"
                className="text-lg font-heading text-brand-primary flex items-center gap-2"
              >
                <Info className="w-5 h-5 shrink-0" />
                Produktdetails
              </h2>
              <p className="text-sm text-gray-900 font-medium mt-1 line-clamp-2">{p.name}</p>
              <p className="text-xs font-mono text-gray-500 mt-0.5">ID {p.product_id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 shrink-0"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4 text-sm">
          {loading && (
            <div className="flex items-center gap-2 text-gray-600 py-4">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              Lädt Details von Regiondo (GET /products/{listProduct.product_id})…
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm whitespace-pre-wrap">
              {error}
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {(detail.short_description || detail.description) && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Beschreibung</h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {detail.description || detail.short_description}
                  </p>
                </div>
              )}

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {detail.sku && (
                  <>
                    <dt className="text-gray-500">SKU</dt>
                    <dd className="font-mono text-gray-900">{detail.sku}</dd>
                  </>
                )}
                {(detail.base_price ?? detail.original_price) && (
                  <>
                    <dt className="text-gray-500">Preis</dt>
                    <dd className="text-gray-900">
                      {detail.base_price ?? detail.original_price} {currencyLabel(detail)}
                    </dd>
                  </>
                )}
                {detail.duration_values && (
                  <>
                    <dt className="text-gray-500">Dauer</dt>
                    <dd className="text-gray-900">
                      {detail.duration_values} {detail.duration_type || ''}
                    </dd>
                  </>
                )}
                {(detail.city || detail.zipcode || detail.location_address) && (
                  <>
                    <dt className="text-gray-500">Ort</dt>
                    <dd className="text-gray-900">
                      {[detail.zipcode, detail.city].filter(Boolean).join(' ')}
                      {detail.location_address && (
                        <span className="block text-xs text-gray-600 mt-0.5">{detail.location_address}</span>
                      )}
                    </dd>
                  </>
                )}
                {detail.provider && (
                  <>
                    <dt className="text-gray-500">Anbieter</dt>
                    <dd className="text-gray-900">{detail.provider}</dd>
                  </>
                )}
                {detail.type_id && (
                  <>
                    <dt className="text-gray-500">Typ</dt>
                    <dd className="text-gray-900">{detail.type_id}</dd>
                  </>
                )}
                {detail.rating_summary && (
                  <>
                    <dt className="text-gray-500">Bewertung</dt>
                    <dd className="text-gray-900">
                      {detail.rating_summary}%
                      {detail.reviews_count ? ` (${detail.reviews_count} Reviews)` : ''}
                    </dd>
                  </>
                )}
              </dl>

              {detail.variations && detail.variations.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Varianten</h3>
                  <ul className="space-y-1 text-sm">
                    {detail.variations.map((v: RegiondoVariation) => (
                      <li key={v.variation_id} className="font-mono text-xs text-gray-800">
                        variation_id {v.variation_id}
                        {v.options?.length
                          ? ` · Optionen: ${v.options.map((o) => o.option_id).join(', ')}`
                          : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brand-primary hover:underline font-medium"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  Im Ticketshop öffnen
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowRaw((s) => !s)}
                className="text-xs text-gray-600 hover:text-gray-900 underline"
              >
                {showRaw ? 'Rohdaten ausblenden' : 'API-Antwort (JSON) anzeigen'}
              </button>
              {showRaw && (
                <pre className="text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-56 text-gray-800">
                  {JSON.stringify(detail, null, 2)}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
