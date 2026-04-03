import type { ParsedPaymentMethod, RegiondoPaymentOptionSpec } from '../lib/regiondoCheckoutResponse';
import type { RegiondoPaymentBlock, RegiondoPaymentOptionEntry } from '../types/regiondoCheckout';

/**
 * Offline / in-store payment codes for POST /checkout/purchase.
 * Exact codes depend on your Regiondo account (see GET /checkout/totals → payments_available).
 *
 * Default `cashregister` matches Regiondo POS / Kasse flow: booking confirmed, stock reduced,
 * customer can receive tickets without online payment (Regiondo fee may still apply).
 */
export const REGIONDO_DEFAULT_OFFLINE_PAYMENT = 'cashregister' as const;

export const REGIONDO_PURCHASE_PAYMENT_OPTIONS = [
  {
    code: 'cashregister',
    label: 'Kasse / Ladentisch (cashregister)',
    description: 'Offline-Zahlung am POS — empfohlen für Buchungen ohne Online-Zahlung',
  },
  {
    code: 'cash',
    label: 'Bar (cash)',
    description: 'Falls in eurem Konto aktiviert',
  },
  {
    code: 'invoice',
    label: 'Rechnung (invoice)',
    description: 'Falls in eurem Konto aktiviert',
  },
  {
    code: 'api_external',
    label: 'Externe API-Zahlung (api_external)',
    description: 'Nur wenn ihr eine extern abgewickelte Zahlung meldet — nicht für reinen Ladenverkauf',
  },
] as const;

export type RegiondoPurchasePaymentCode = (typeof REGIONDO_PURCHASE_PAYMENT_OPTIONS)[number]['code'];

function formatRegiondoAmount(n: number): string {
  if (Number.isNaN(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function isLikelyAmountOptionName(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n === 'value' ||
    n === 'amount' ||
    n === 'grand_total' ||
    n.includes('amount') ||
    n.includes('total') ||
    n.includes('betrag')
  );
}

/**
 * Cash register style: several mutually exclusive options (`paid_cash`, `paid_cc`, `unpaid_offline`, …).
 * Purchase must send **one** `payment.options` entry with that `name` and usually `grand_total` as `value`.
 */
export function isExclusivePaymentSubOptions(paymentOptions: RegiondoPaymentOptionSpec[] | undefined): boolean {
  if (!paymentOptions || paymentOptions.length <= 1) return false;
  if (paymentOptions.some((o) => o.required === true)) return false;
  return paymentOptions.every((o) => {
    const n = o.name.toLowerCase();
    return n.startsWith('paid_') || n.startsWith('unpaid_');
  });
}

function isInvoiceStylePaymentOptions(paymentOptions: RegiondoPaymentOptionSpec[] | undefined): boolean {
  return !!paymentOptions?.some((o) => o.required === true);
}

/**
 * Builds `payment` for POST /checkout/purchase.
 * Offline methods must match `payments_available[].payment_options` from POST /checkout/totals; for
 * amount-style option names, pass `grandTotal` from that totals response. A guessed `{ name: "value" }`
 * without account metadata often yields `wrong_payment_data`.
 */
export function buildRegiondoPurchasePayment(
  code: string,
  opts?: {
    omitValueOption?: boolean;
    paymentMethodFromTotals?: ParsedPaymentMethod;
    grandTotal?: number;
    /** For cashregister-style exclusive options: exactly one of `paid_cash`, `unpaid_offline`, … */
    paymentSubOptionName?: string;
    /** For invoice-style methods: values keyed by option `name` from totals. */
    invoiceOptionValues?: Record<string, string>;
  }
): RegiondoPaymentBlock {
  if (code === 'api_external') {
    return { code: 'api_external', options: [{ name: 'value' }] };
  }

  const spec = opts?.paymentMethodFromTotals;
  const paymentOptions = spec?.payment_options;
  const grand = opts?.grandTotal;

  if (paymentOptions && paymentOptions.length > 0) {
    if (isExclusivePaymentSubOptions(paymentOptions)) {
      const names = new Set(paymentOptions.map((p) => p.name));
      const preferred =
        (opts?.paymentSubOptionName && names.has(opts.paymentSubOptionName)
          ? opts.paymentSubOptionName
          : undefined) ??
        (names.has('paid_cash') ? 'paid_cash' : undefined) ??
        paymentOptions[0]?.name;
      if (!preferred) {
        return { code };
      }
      const val = grand != null && !Number.isNaN(grand) ? formatRegiondoAmount(grand) : undefined;
      return { code, options: [{ name: preferred, value: val }] };
    }

    if (isInvoiceStylePaymentOptions(paymentOptions) && opts?.invoiceOptionValues) {
      const iv = opts.invoiceOptionValues;
      const options: RegiondoPaymentOptionEntry[] = paymentOptions.map((po) => ({
        name: po.name,
        value: iv[po.name] ?? '',
      }));
      return { code, options };
    }

    const options: RegiondoPaymentOptionEntry[] = paymentOptions.map((po) => {
      const name = po.name;
      if (paymentOptions.length === 1 && grand != null && !Number.isNaN(grand)) {
        return { name, value: formatRegiondoAmount(grand) };
      }
      if (isLikelyAmountOptionName(name) && grand != null && !Number.isNaN(grand)) {
        return { name, value: formatRegiondoAmount(grand) };
      }
      return { name };
    });
    return { code, options };
  }

  /** Many shops expect the api_external-shaped option plus paid amount; bare `{ code }` often → wrong_payment_data. */
  if (grand != null && !Number.isNaN(grand)) {
    return { code, options: [{ name: 'value', value: formatRegiondoAmount(grand) }] };
  }

  if (opts?.omitValueOption) {
    return { code };
  }
  return { code };
}
