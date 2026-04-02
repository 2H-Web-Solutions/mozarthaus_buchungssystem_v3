import { buildRegiondoProxyUrl } from '../lib/regiondoProxyUrl';
import type { RegiondoPage } from '../types/regiondo';
import type {
  RegiondoSupplierBooking,
  RegiondoSupplierBookingsResponse,
} from '../types/regiondoSupplierBooking';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function parseBookingsBody(body: unknown): { bookings: RegiondoSupplierBooking[]; page: RegiondoPage | null } {
  if (isRecord(body)) {
    if (Array.isArray(body.data)) {
      return {
        bookings: body.data as RegiondoSupplierBooking[],
        page: isRecord(body.page) ? (body.page as unknown as RegiondoPage) : null,
      };
    }
    if (Array.isArray(body.bookings)) {
      return { bookings: body.bookings as RegiondoSupplierBooking[], page: null };
    }
    if (Array.isArray(body.items)) {
      return { bookings: body.items as RegiondoSupplierBooking[], page: null };
    }
  }
  if (Array.isArray(body)) {
    return { bookings: body as RegiondoSupplierBooking[], page: null };
  }
  return { bookings: [], page: null };
}

/** Query params for GET /v1/supplier/bookings */
export interface FetchSupplierBookingsParams {
  limit?: number;
  offset?: number;
  /** e.g. date_bought (default) — filter dimension used with date_range */
  date_filter?: string;
  /** DATE_FROM,DATE_TO e.g. 2015-01-01,2015-02-01 */
  date_range?: string;
  product_id?: string;
  order_id?: string;
  booking_key?: string;
  resource_id?: string;
  status?: string;
  booking_type?: string;
  payment_method?: string;
  channel?: string;
  created_from?: string;
  created_to?: string;
  updated_from?: string;
  updated_to?: string;
  suppress_response_code?: boolean | string;
  debug?: boolean | string;
  /** Sandbox only */
  sandboxauth?: boolean | string;
  store_locale?: string;
}

export interface FetchSupplierBookingsResult {
  bookings: RegiondoSupplierBooking[];
  page: RegiondoPage | null;
  raw?: RegiondoSupplierBookingsResponse;
}

function appendParam(sp: URLSearchParams, key: string, value: string | number | boolean | undefined) {
  if (value === undefined || value === '') return;
  sp.set(key, typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value));
}

/**
 * GET /v1/supplier/bookings — supplier booking list (includes order_number for purchase lookup).
 */
export async function fetchSupplierBookings(
  params: FetchSupplierBookingsParams = {}
): Promise<FetchSupplierBookingsResult> {
  const sp = new URLSearchParams();
  appendParam(sp, 'limit', params.limit ?? 10);
  appendParam(sp, 'offset', params.offset ?? 0);
  appendParam(sp, 'date_filter', params.date_filter);
  appendParam(sp, 'date_range', params.date_range);
  appendParam(sp, 'product_id', params.product_id);
  appendParam(sp, 'order_id', params.order_id);
  appendParam(sp, 'booking_key', params.booking_key);
  appendParam(sp, 'resource_id', params.resource_id);
  appendParam(sp, 'status', params.status);
  appendParam(sp, 'booking_type', params.booking_type);
  appendParam(sp, 'payment_method', params.payment_method);
  appendParam(sp, 'channel', params.channel);
  appendParam(sp, 'created_from', params.created_from);
  appendParam(sp, 'created_to', params.created_to);
  appendParam(sp, 'updated_from', params.updated_from);
  appendParam(sp, 'updated_to', params.updated_to);
  appendParam(sp, 'suppress_response_code', params.suppress_response_code);
  appendParam(sp, 'debug', params.debug);
  appendParam(sp, 'sandboxauth', params.sandboxauth);
  if (params.store_locale) sp.set('store_locale', params.store_locale);

  const url = buildRegiondoProxyUrl('supplier/bookings', sp);

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Regiondo supplier bookings failed (${res.status})`);
  }

  const json = (await res.json()) as unknown;
  const { bookings, page } = parseBookingsBody(json);
  const raw =
    isRecord(json) && (Array.isArray(json.data) || Array.isArray(json.bookings))
      ? (json as unknown as RegiondoSupplierBookingsResponse)
      : undefined;

  return { bookings, page, raw };
}
