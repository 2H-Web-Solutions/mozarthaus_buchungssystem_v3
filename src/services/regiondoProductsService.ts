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
}

export interface FetchRegiondoProductsResult {
  products: RegiondoProduct[];
  page: RegiondoPage | null;
  raw?: RegiondoProductsListResponse;
}

/**
 * Fetches Regiondo products. In development (and `vite preview`), uses the Vite middleware
 * at `/api/regiondo/products` (HMAC signed). In production static hosting, set
 * `VITE_REGIONDO_PRODUCTS_API_URL` to your own HTTPS proxy that calls Regiondo.
 */
export async function fetchRegiondoProducts(
  params: FetchRegiondoProductsOptions = {}
): Promise<FetchRegiondoProductsResult> {
  const searchParams = new URLSearchParams();
  if (params.limit != null) searchParams.set('limit', String(params.limit));
  if (params.offset != null) searchParams.set('offset', String(params.offset));
  if (params.store_locale) searchParams.set('store_locale', params.store_locale);

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
