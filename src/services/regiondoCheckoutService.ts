import { buildRegiondoProxyUrl } from '../lib/regiondoProxyUrl';
import { assertRegiondoCheckoutSuccess } from '../lib/regiondoCheckoutResponse';
import type {
  RegiondoCartItem,
  RegiondoHoldResponse,
  RegiondoPurchaseInput,
  RegiondoPurchaseResponse,
  RegiondoSimpleOk,
} from '../types/regiondoCheckout';

async function regiondoApiJson<T>(
  method: string,
  subPath: string,
  options?: { searchParams?: URLSearchParams; body?: unknown; assertCheckoutSuccess?: boolean }
): Promise<T> {
  const sp = options?.searchParams ?? new URLSearchParams();
  const url = buildRegiondoProxyUrl(subPath, sp);
  const hasBody =
    options?.body !== undefined &&
    method !== 'GET' &&
    method !== 'DELETE';

  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || `Regiondo API error (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(typeof data === 'object' && data !== null && 'message' in data
      ? String((data as { message: unknown }).message)
      : text || `HTTP ${res.status}`);
  }

  if (options?.assertCheckoutSuccess) {
    assertRegiondoCheckoutSuccess(data);
  }

  return data as T;
}

/** POST /checkout/hold — temporary reservation (stock hold). */
export async function createHold(
  item: RegiondoCartItem,
  opts?: { store_locale?: string; collect_totals?: boolean; currency?: string; reserve_minutes?: number }
): Promise<RegiondoHoldResponse> {
  const sp = new URLSearchParams();
  if (opts?.store_locale) sp.set('store_locale', opts.store_locale);
  if (opts?.collect_totals != null) sp.set('collect_totals', String(opts.collect_totals));
  if (opts?.currency) sp.set('currency', opts.currency);
  if (opts?.reserve_minutes != null) sp.set('reserve_minutes', String(opts.reserve_minutes));

  return regiondoApiJson<RegiondoHoldResponse>('POST', 'checkout/hold', {
    searchParams: sp,
    body: item,
  });
}

/** DELETE /checkout/hold?reservation_code= — release hold. */
export async function removeHold(reservationCode: string): Promise<RegiondoSimpleOk> {
  const sp = new URLSearchParams();
  sp.set('reservation_code', reservationCode);
  return regiondoApiJson<RegiondoSimpleOk>('DELETE', 'checkout/hold', { searchParams: sp });
}

/** GET /checkout/hold — list active holds. */
export async function listHolds(store_locale = 'de-AT'): Promise<unknown> {
  const sp = new URLSearchParams();
  sp.set('store_locale', store_locale);
  return regiondoApiJson('GET', 'checkout/hold', { searchParams: sp });
}

/** PUT /checkout/hold?reservation_code= — extend hold. */
export async function prolongHold(
  reservationCode: string,
  reserveMinutes?: number
): Promise<RegiondoHoldResponse> {
  const sp = new URLSearchParams();
  sp.set('reservation_code', reservationCode);
  if (reserveMinutes != null) sp.set('reserve_minutes', String(reserveMinutes));
  return regiondoApiJson<RegiondoHoldResponse>('PUT', 'checkout/hold', { searchParams: sp });
}

/**
 * POST /checkout/purchase — complete booking.
 * Use an **offline** payment `code` (e.g. `cashregister`) for admin / in-store sales without online payment;
 * use `api_external` only when integrating external payment capture.
 */
export async function purchase(
  body: RegiondoPurchaseInput,
  opts?: { store_locale?: string; sync_tickets_processing?: boolean; send_confirmation_email?: boolean; currency?: string }
): Promise<RegiondoPurchaseResponse> {
  const sp = new URLSearchParams();
  if (opts?.store_locale) sp.set('store_locale', opts.store_locale);
  if (opts?.sync_tickets_processing != null) {
    sp.set('sync_tickets_processing', String(opts.sync_tickets_processing));
  }
  if (opts?.send_confirmation_email != null) {
    sp.set('send_confirmation_email', String(opts.send_confirmation_email));
  }
  if (opts?.currency) sp.set('currency', opts.currency);

  return regiondoApiJson<RegiondoPurchaseResponse>('POST', 'checkout/purchase', {
    searchParams: sp,
    body,
    assertCheckoutSuccess: true,
  });
}

/** POST /checkout/totals — price / required fields before purchase. */
export async function getCheckoutTotals(
  body: { items: RegiondoCartItem[]; coupon_code?: string; source_type?: number; return_only_totals?: number },
  currency = 'default'
): Promise<unknown> {
  const sp = new URLSearchParams();
  sp.set('currency', currency);
  sp.set('store_locale', 'de-AT');
  return regiondoApiJson('POST', 'checkout/totals', { searchParams: sp, body });
}
