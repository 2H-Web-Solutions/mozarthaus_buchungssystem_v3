import { buildRegiondoProxyUrl } from '../lib/regiondoProxyUrl';
import type {
  RegiondoAvailabilitiesResponse,
  RegiondoPage,
  RegiondoProduct,
  RegiondoProductsListResponse,
} from '../types/regiondo';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function parseListBody(body: unknown): { products: RegiondoProduct[]; page: RegiondoPage | null } {
  if (isRecord(body) && Array.isArray(body.data)) {
    const page = isRecord(body.page) ? (body.page as unknown as RegiondoPage) : null;
    return { products: body.data as RegiondoProduct[], page };
  }
  if (Array.isArray(body)) {
    return { products: body as RegiondoProduct[], page: null };
  }
  if (isRecord(body)) {
    if (Array.isArray(body.products)) {
      return { products: body.products as RegiondoProduct[], page: null };
    }
    if (Array.isArray(body.items)) {
      return { products: body.items as RegiondoProduct[], page: null };
    }
  }
  return { products: [], page: null };
}

function parseProductDetail(body: unknown): RegiondoProduct {
  if (isRecord(body) && body.data != null && isRecord(body.data)) {
    return body.data as unknown as RegiondoProduct;
  }
  if (isRecord(body) && typeof body.product_id === 'string') {
    return body as unknown as RegiondoProduct;
  }
  throw new Error('Unexpected product detail response shape');
}

export interface FetchRegiondoProductsOptions {
  limit?: number;
  offset?: number;
  store_locale?: string;
  /**
   * `false` = include inactive (non-bookable / hidden) products; `true` = active only.
   * @see Regiondo GET /v1/products — `active_only`
   */
  active_only?: boolean;
  /**
   * Follow `page` until all items are loaded (uses `limit` per request, max 250).
   */
  fetchAllPages?: boolean;
}

export interface FetchRegiondoProductsResult {
  products: RegiondoProduct[];
  page: RegiondoPage | null;
  raw?: RegiondoProductsListResponse;
}

async function fetchRegiondoProductsPage(
  params: FetchRegiondoProductsOptions
): Promise<FetchRegiondoProductsResult> {
  const searchParams = new URLSearchParams();
  const limit = Math.min(params.limit ?? 250, 250);
  searchParams.set('limit', String(limit));
  if (params.offset != null) searchParams.set('offset', String(params.offset));
  if (params.store_locale) searchParams.set('store_locale', params.store_locale);
  if (params.active_only === true) searchParams.set('active_only', 'true');
  if (params.active_only === false) searchParams.set('active_only', 'false');

  const url = buildRegiondoProxyUrl('products', searchParams);

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Regiondo products request failed (${res.status})`);
  }

  const json = (await res.json()) as unknown;
  const { products, page } = parseListBody(json);
  const raw =
    isRecord(json) && Array.isArray(json.data) && isRecord(json.page)
      ? (json as unknown as RegiondoProductsListResponse)
      : undefined;

  return { products, page, raw };
}

/**
 * Fetches Regiondo products. In development (and `vite preview`), uses the Vite middleware
 * at `/api/regiondo/products` (HMAC signed). In production static hosting, set
 * `VITE_REGIONDO_PRODUCTS_API_URL` to your own HTTPS proxy that calls Regiondo.
 */
export async function fetchRegiondoProducts(
  params: FetchRegiondoProductsOptions = {}
): Promise<FetchRegiondoProductsResult> {
  if (!params.fetchAllPages) {
    return fetchRegiondoProductsPage(params);
  }

  const limit = Math.min(params.limit ?? 250, 250);
  const startOffset = params.offset ?? 0;
  const all: RegiondoProduct[] = [];
  let lastPage: RegiondoPage | null = null;
  let rawLast: RegiondoProductsListResponse | undefined;
  let offset = startOffset;

  for (;;) {
    const chunk = await fetchRegiondoProductsPage({ ...params, limit, offset, fetchAllPages: false });
    all.push(...chunk.products);
    lastPage = chunk.page;
    rawLast = chunk.raw;
    if (chunk.products.length === 0) break;
    if (chunk.products.length < limit) break;
    if (lastPage && all.length >= lastPage.total_items) break;
    if (!lastPage) break;
    offset += limit;
  }

  return { products: all, page: lastPage, raw: rawLast };
}

export interface FetchRegiondoProductByIdOptions {
  store_locale?: string;
  /** `default`, `EUR`, … — see Regiondo docs */
  currency?: string;
}

/**
 * `GET /v1/products/{productId}` — full product detail (single product).
 */
export async function fetchRegiondoProductById(
  productId: string,
  params: FetchRegiondoProductByIdOptions = {}
): Promise<RegiondoProduct> {
  const searchParams = new URLSearchParams();
  if (params.store_locale) searchParams.set('store_locale', params.store_locale);
  if (params.currency) searchParams.set('currency', params.currency);

  const url = buildRegiondoProxyUrl(`products/${encodeURIComponent(productId)}`, searchParams);

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Regiondo product ${productId} request failed (${res.status})`);
  }

  const json = (await res.json()) as unknown;
  return parseProductDetail(json);
}

export interface FetchRegiondoAvailabilitiesOptions {
  dt_from: string;
  dt_to: string;
  store_locale?: string;
}

/**
 * `GET /v1/products/availabilities/{variationId}` — requires a **variation** ID (not product_id).
 */
export async function fetchRegiondoAvailabilities(
  variationId: string,
  params: FetchRegiondoAvailabilitiesOptions
): Promise<RegiondoAvailabilitiesResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('dt_from', params.dt_from);
  searchParams.set('dt_to', params.dt_to);
  if (params.store_locale) searchParams.set('store_locale', params.store_locale);

  const url = buildRegiondoProxyUrl(`products/availabilities/${encodeURIComponent(variationId)}`, searchParams);

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Regiondo availabilities request failed (${res.status})`);
  }

  return (await res.json()) as RegiondoAvailabilitiesResponse;
}

/** Local calendar date YYYY-MM-DD (avoids UTC shift vs. toISOString). */
function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Default schedule window: today through end of the next 7 days (inclusive). */
export function defaultAvailabilityDateRange(): { dt_from: string; dt_to: string } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  return {
    dt_from: toYmdLocal(from),
    dt_to: toYmdLocal(to),
  };
}

/** Single calendar day (local): today as both `dt_from` and `dt_to` (inclusive). */
export function todayAvailabilityDateRange(): { dt_from: string; dt_to: string } {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const ymd = toYmdLocal(d);
  return { dt_from: ymd, dt_to: ymd };
}

/**
 * Request window for one on-screen week (Mon–Sun).
 * `dt_from` is the **Sunday before** that Monday: some Regiondo deployments behave as if the first day
 * after `dt_from` is the first returned date, which would skip Monday if `dt_from` were Monday.
 * The booking UI still **filters** rows to Mon–Sun only.
 */
export function weekAvailabilityDateRange(weekStartMonday: Date): { dt_from: string; dt_to: string } {
  const monday = new Date(weekStartMonday);
  monday.setHours(0, 0, 0, 0);
  const from = new Date(monday);
  from.setDate(from.getDate() - 1);
  const to = new Date(monday);
  to.setDate(to.getDate() + 6);
  return {
    dt_from: toYmdLocal(from),
    dt_to: toYmdLocal(to),
  };
}
