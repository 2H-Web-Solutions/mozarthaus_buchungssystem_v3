import { getCheckoutTotals, purchase } from './regiondoCheckoutService';
import type {
  RegiondoBuyerFieldValue,
  RegiondoCartItem,
  RegiondoPaymentBlock,
  RegiondoPurchaseInput,
  RegiondoPurchaseResponse,
} from '../types/regiondoCheckout';
import {
  REGIONDO_DEFAULT_OFFLINE_PAYMENT,
  buildRegiondoPurchasePayment,
  isExclusivePaymentSubOptions,
} from '../constants/regiondoOfflinePayments';
import { buildBuyerDataFromContact } from '../lib/regiondoPurchaseBuyerData';
import {
  parseCurrencyFromTotalsResponse,
  parseGrandTotalFromTotalsResponse,
  parsePaymentsAvailable,
} from '../lib/regiondoCheckoutResponse';
import type { ParsedPaymentMethod } from '../lib/regiondoCheckoutResponse';
import type { RegiondoProduct } from '../types/regiondo';
import { distributeTotalAcrossCategories } from '../utils/groupTicketDistribution';
import { regiondoCheckoutOptionId } from '../utils/regiondoVariationIds';

const REGIONDO_SOURCE_POS = 1;

/** Regiondo erwartet `Y-m-d H:i:s` (wie RegiondoCreateBookingPanel). */
export function toRegiondoDateTime(dateYmd: string, time: string): string {
  const t = (time || '00:00').trim();
  const [hh, mm] = t.split(':');
  const h = (hh || '00').padStart(2, '0');
  const m = (mm || '00').padStart(2, '0');
  return `${dateYmd} ${h}:${m}:00`;
}

export function splitNameForRegiondo(fullName: string): { firstname: string; lastname: string } {
  const t = fullName.trim();
  if (!t) return { firstname: '—', lastname: '—' };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0], lastname: '.' };
  return { firstname: parts[0], lastname: parts.slice(1).join(' ') };
}

interface TotalsSnapshot {
  payments: ParsedPaymentMethod[];
  grandTotal: number | undefined;
  currency: string | undefined;
  contactDataRequired: string[];
  buyerDataRequired: unknown[];
  raw: unknown;
}

function parseTotalsResponse(data: unknown): TotalsSnapshot | null {
  if (data === null || data === undefined) return null;
  const root = data as Record<string, unknown>;
  const inner =
    root?.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
  if (!inner || typeof inner !== 'object') return null;
  let parsed = parsePaymentsAvailable(inner);
  if (parsed.length === 0 && inner.totals != null && typeof inner.totals === 'object') {
    parsed = parsePaymentsAvailable(inner.totals);
  }
  return {
    payments: parsed,
    grandTotal: parseGrandTotalFromTotalsResponse(data),
    currency: parseCurrencyFromTotalsResponse(data),
    contactDataRequired: Array.isArray(inner.contact_data_required)
      ? (inner.contact_data_required as string[])
      : [],
    buyerDataRequired: Array.isArray(inner.buyer_data_required) ? inner.buyer_data_required : [],
    raw: data,
  };
}

/** From POST /checkout/totals — stored in Firebase only; not sent on minimal purchase. */
export interface RegiondoCheckoutTotalsForFirebase {
  grandTotal?: number;
  currency?: string;
  buyer_data?: RegiondoBuyerFieldValue[];
  /** What we would have sent as `payment` if using full checkout (audit / POS). */
  intendedPayment?: RegiondoPaymentBlock;
  totalsRaw?: unknown;
  comment?: string;
}

export type RegiondoBookingPurchaseResult = RegiondoPurchaseResponse & {
  checkoutTotalsForFirebase?: RegiondoCheckoutTotalsForFirebase;
};

/**
 * POST /checkout/totals (for validation + Firebase snapshot) → POST /checkout/purchase with **only**
 * `items` + `contact_data` (avoids wrong_payment_data when Regiondo expects this minimal shape).
 */
export async function purchaseWithRegiondoCheckout(params: {
  bookingType: 'einzel' | 'gruppe';
  productId: string;
  productDetail: RegiondoProduct;
  selectedSlot: { dateYmd: string; time: string };
  quantities: Record<string, number>;
  groupPersons?: number;
  /** Gruppe: Reihenfolge der Tarife für die Aufteilung (z. B. nur Varianten mit Slot). */
  groupVariationIds?: string[];
  contactFullName: string;
  email: string;
  telephone: string;
  comment?: string;
}): Promise<RegiondoBookingPurchaseResult> {
  const dateTime = toRegiondoDateTime(params.selectedSlot.dateYmd, params.selectedSlot.time);
  const items: RegiondoCartItem[] = [];

  if (params.bookingType === 'einzel') {
    for (const v of params.productDetail.variations ?? []) {
      const q = params.quantities[v.variation_id] || 0;
      if (q <= 0) continue;
      const pid = Number(params.productId);
      let oid: number;
      try {
        oid = regiondoCheckoutOptionId(v);
      } catch {
        throw new Error(
          `Regiondo: für „${v.name ?? v.variation_id}“ fehlt options[].option_id im Produktdetail — Checkout nicht möglich.`
        );
      }
      if (!Number.isFinite(pid)) {
        throw new Error('Ungültige Produkt-ID für Regiondo.');
      }
      items.push({
        product_id: pid,
        option_id: oid,
        date_time: dateTime,
        qty: q,
      });
    }
    if (items.length === 0) throw new Error('Keine Tickets für Regiondo-Checkout ausgewählt.');
  } else {
    const total = Math.max(1, params.groupPersons ?? 1);
    const ids =
      params.groupVariationIds && params.groupVariationIds.length > 0
        ? params.groupVariationIds
        : (params.productDetail.variations ?? []).map((v) => v.variation_id);
    if (ids.length === 0) throw new Error('Keine Regiondo-Variante — Gruppenbuchung nicht möglich.');
    const dist = distributeTotalAcrossCategories(total, ids);
    const pid = Number(params.productId);
    if (!Number.isFinite(pid)) {
      throw new Error('Ungültige Produkt-ID für Regiondo.');
    }
    for (const v of params.productDetail.variations ?? []) {
      const q = dist[v.variation_id] ?? 0;
      if (q <= 0) continue;
      let oid: number;
      try {
        oid = regiondoCheckoutOptionId(v);
      } catch {
        throw new Error(
          `Regiondo: für „${v.name ?? v.variation_id}“ fehlt options[].option_id — Gruppen-Checkout nicht möglich.`
        );
      }
      items.push({
        product_id: pid,
        option_id: oid,
        date_time: dateTime,
        qty: q,
      });
    }
    if (items.length === 0) {
      throw new Error(
        'Gruppenbuchung: keine Tickets nach Aufteilung — Tarife / Termin in Regiondo prüfen.'
      );
    }
  }

  const totalsRaw = await getCheckoutTotals(
    { items, source_type: REGIONDO_SOURCE_POS },
    'default'
  );
  const snap = parseTotalsResponse(totalsRaw);
  if (!snap) throw new Error('Regiondo /checkout/totals — ungültige Antwort.');

  let paymentCode: string = REGIONDO_DEFAULT_OFFLINE_PAYMENT;
  if (snap.payments.length && !snap.payments.some((p) => p.code === paymentCode)) {
    paymentCode = snap.payments[0].code;
  }
  const selectedPayment = snap.payments.find((p) => p.code === paymentCode);

  let subOption = '';
  if (selectedPayment?.payment_options && isExclusivePaymentSubOptions(selectedPayment.payment_options)) {
    const opts = selectedPayment.payment_options;
    subOption = opts.find((o) => o.name === 'paid_cash')?.name ?? opts[0]?.name ?? '';
  }

  const phoneRequired = snap.contactDataRequired.includes('telephone');
  if (phoneRequired && !params.telephone.trim()) {
    throw new Error('Telefon ist für dieses Produkt bei Regiondo erforderlich.');
  }

  const { firstname, lastname } = splitNameForRegiondo(params.contactFullName);
  const buyer_data = buildBuyerDataFromContact(snap.buyerDataRequired, {
    firstname,
    lastname,
    email: params.email.trim(),
    telephone: params.telephone.trim(),
  });

  const intendedPayment = buildRegiondoPurchasePayment(paymentCode, {
    paymentMethodFromTotals: selectedPayment,
    grandTotal: snap.grandTotal,
    paymentSubOptionName: subOption || undefined,
  });

  /** Regiondo purchase: only `items` + `contact_data` (no payment, buyer_data, source_type). */
  const purchaseBody: RegiondoPurchaseInput = {
    items,
    contact_data: {
      email: params.email.trim(),
      firstname,
      lastname,
      telephone: params.telephone.trim(),
    },
  };

  const res = await purchase(purchaseBody, {
    store_locale: 'de-AT',
    sync_tickets_processing: false,
    send_confirmation_email: true,
    currency: snap.currency,
  });

  return {
    ...res,
    checkoutTotalsForFirebase: {
      grandTotal: snap.grandTotal,
      currency: snap.currency,
      buyer_data: buyer_data.length > 0 ? buyer_data : undefined,
      intendedPayment,
      totalsRaw: totalsRaw,
      ...(params.comment?.trim() ? { comment: params.comment.trim() } : {}),
    },
  };
}
