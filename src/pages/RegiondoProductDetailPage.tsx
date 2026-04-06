import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { RegiondoProduct, RegiondoVariation } from '../types/regiondo';
import { fetchRegiondoProductById, todayAvailabilityDateRange } from '../services/regiondoProductsService';
import { formatSlotCapacityLabel, slotsForDateInVariation } from '../utils/regiondoAvailability';
import { RegiondoScheduleModal } from '../components/events/RegiondoScheduleModal';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Star,
  Store,
  Tag,
} from 'lucide-react';

function currencyLabel(p: RegiondoProduct): string {
  return p.currency_code || p.curency_code || 'EUR';
}

function publicProductUrl(p: RegiondoProduct): string | undefined {
  return p.wl_regiondo_url || p.regiondo_url;
}

function variationLabel(v: RegiondoVariation): string {
  const n = v.name?.trim();
  if (n) return n;
  return v.title || v.variation_name || `Variation ${v.variation_id}`;
}

export function RegiondoProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<RegiondoProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    if (!productId) {
      setError('Keine Produkt-ID.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    void (async () => {
      try {
        const d = await fetchRegiondoProductById(productId, {
          store_locale: 'de-AT',
          currency: 'default',
        });
        if (!cancelled) setDetail(d);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Produkt konnte nicht geladen werden.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const todayYmd = todayAvailabilityDateRange().dt_from;
  const todayDateLabel = new Date(`${todayYmd}T12:00:00`).toLocaleDateString('de-AT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const heroImage = detail?.image || detail?.thumbnail;
  const href = detail ? publicProductUrl(detail) : undefined;

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-8">
      {/* Top bar */}
      <div className="border-b border-gray-200/80 bg-white/90 backdrop-blur-sm sticky top-0 z-10 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-brand-primary transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Zur Übersicht
          </button>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <nav className="flex items-center gap-1 text-gray-500 min-w-0">
            <Link to="/events" className="hover:text-brand-primary transition-colors shrink-0">
              Events &amp; Konzerte
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
            <span className="text-gray-900 font-medium truncate">
              {detail?.name ?? (loading ? '…' : 'Produkt')}
            </span>
          </nav>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-600">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
          <p className="text-sm">Produktdaten werden geladen…</p>
        </div>
      )}

      {error && !loading && (
        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-12">
          <div className="rounded-2xl border border-red-200 bg-red-50/90 p-6 text-red-900">
            <p className="font-medium">Fehler beim Laden</p>
            <p className="text-sm mt-2 whitespace-pre-wrap opacity-90">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-red-200 text-sm font-medium hover:bg-red-50"
            >
              Zurück zur Übersicht
            </button>
          </div>
        </div>
      )}

      {!loading && !error && detail && (
        <>
          {/* Hero */}
          <div className="relative">
            <div className="h-[min(52vh,420px)] w-full bg-gradient-to-br from-gray-900 via-gray-800 to-brand-primary/40">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-5xl mx-auto">
                {detail.type_id && (
                  <span className="inline-block mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/95 bg-white/15 backdrop-blur rounded-full border border-white/20">
                    {detail.type_id}
                  </span>
                )}
                <h1 className="text-3xl sm:text-4xl font-heading text-white drop-shadow-sm leading-tight max-w-4xl">
                  {detail.name}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {(detail.base_price ?? detail.original_price) && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-gray-900 text-lg font-semibold shadow-lg">
                      <Tag className="w-4 h-4 text-brand-primary shrink-0" />
                      {detail.base_price ?? detail.original_price} {currencyLabel(detail)}
                    </span>
                  )}
                  {detail.rating_summary && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 backdrop-blur text-white text-sm border border-white/15">
                      <Star className="w-4 h-4 text-amber-300 fill-amber-300/30 shrink-0" />
                      {detail.rating_summary}%
                      {detail.reviews_count ? ` · ${detail.reviews_count} Bewertungen` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 space-y-10">
            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setScheduleOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium shadow-md shadow-brand-primary/25 hover:opacity-95 transition-opacity"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                Termine &amp; Zeiten
              </button>
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  Im Ticketshop öffnen
                </a>
              )}
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(detail.city || detail.zipcode || detail.location_address) && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 text-brand-primary mb-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ort</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {[detail.zipcode, detail.city].filter(Boolean).join(' ') || '—'}
                  </p>
                  {detail.location_address && (
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{detail.location_address}</p>
                  )}
                </div>
              )}
              {detail.duration_values && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 text-brand-primary mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dauer</span>
                  </div>
                  <p className="text-gray-900 font-medium text-lg">
                    {detail.duration_values} {detail.duration_type || ''}
                  </p>
                </div>
              )}
              {detail.sku && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 text-brand-primary mb-2">
                    <Tag className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">SKU</span>
                  </div>
                  <p className="font-mono text-gray-900">{detail.sku}</p>
                </div>
              )}
              {detail.provider && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 text-brand-primary mb-2">
                    <Store className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Anbieter</span>
                  </div>
                  <p className="text-gray-900 font-medium">{detail.provider}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {(detail.short_description || detail.description) && (
              <section className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-heading text-brand-primary mb-4">Beschreibung</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {detail.description || detail.short_description}
                </div>
              </section>
            )}

            {/* Variations */}
            {detail.variations && detail.variations.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-heading text-brand-primary">Kategorien &amp; Tarife</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Verfügbarkeit für heute ({todayDateLabel}) — aus{' '}
                    <span className="font-mono text-xs">available_dates</span> im Produktdetail.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {detail.variations.map((v) => {
                    const price = v.price ?? v.base_price;
                    const todaySlots = slotsForDateInVariation(v.available_dates, todayYmd);
                    return (
                      <div
                        key={v.variation_id}
                        className="group rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/80 p-6 shadow-sm hover:shadow-md hover:border-brand-primary/20 transition-all"
                      >
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary/80 mb-1">
                          Kategorie
                        </p>
                        <h3 className="text-xl font-heading text-gray-900 leading-snug">{variationLabel(v)}</h3>
                        <p className="text-xs font-mono text-gray-400 mt-2">ID {v.variation_id}</p>
                        {(v.from || v.to) && (
                          <p className="text-sm text-gray-600 mt-3">
                            <span className="text-gray-500">Gültigkeit:</span>{' '}
                            <span className="tabular-nums font-medium text-gray-800">
                              {v.from ?? '…'} — {v.to ?? '…'}
                            </span>
                          </p>
                        )}
                        {v.appointment_type && (
                          <p className="text-sm text-gray-600 mt-1">
                            Terminart: <span className="text-gray-900">{v.appointment_type}</span>
                          </p>
                        )}
                        {v.options && v.options.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Optionen: {v.options.map((o) => o.option_id).join(', ')}
                          </p>
                        )}
                        {(v.sku || price) && (
                          <p className="text-sm text-gray-700 mt-2">
                            {[v.sku && `SKU ${v.sku}`, price && `${price}`].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <div className="mt-5 pt-5 border-t border-gray-200/80">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                            Termine heute
                          </p>
                          {todaySlots.length === 0 && (
                            <p className="text-sm text-gray-500">Keine Termine für heute.</p>
                          )}
                          {todaySlots.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {todaySlots.map((s) => {
                                const cap = formatSlotCapacityLabel(s);
                                return (
                                  <span
                                    key={s.time}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl bg-white border border-gray-200 text-gray-900 shadow-sm"
                                  >
                                    {s.time}
                                    {cap && (
                                      <span className="text-gray-500 font-normal tabular-nums text-xs">· {cap}</span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <RegiondoScheduleModal
            isOpen={scheduleOpen}
            product={detail}
            onClose={() => setScheduleOpen(false)}
          />
        </>
      )}
    </div>
  );
}
