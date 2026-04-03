/**
 * Regiondo often returns HTTP 200 with errors in JSON, e.g. `{ data: { result: "wrong_payment_data" } }`.
 */
export function assertRegiondoCheckoutSuccess(data: unknown): void {
  if (data === null || data === undefined || typeof data !== 'object') return;
  const root = data as Record<string, unknown>;
  const nested = root.data;
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) return;
  const d = nested as Record<string, unknown>;
  if (typeof d.result !== 'string') return;
  if (d.result === 'ok' || d.result === 'success') return;

  if (d.result === 'wrong_payment_data') {
    throw new Error(
      'Regiondo: wrong_payment_data — Zahlungsmethode oder payment.options passen nicht. ' +
        'Unter POST /checkout/totals → payments_available: für die gewählte Methode `payment_options` (Namen) beachten ' +
        'und bei Betragsfeldern `grand_total` mitsenden. Generisches `{ name: \"value\" }` ohne Totals-Daten reicht oft nicht.'
    );
  }
  throw new Error(`Regiondo: ${d.result}`);
}

export interface RegiondoPaymentOptionSpec {
  name: string;
  title?: string;
  required?: boolean;
}

export interface ParsedPaymentMethod {
  code: string;
  title?: string;
  /** Shapes `payment.options` on purchase — must match Regiondo, not a guessed `{ name: \"value\" }` stub. */
  payment_options?: RegiondoPaymentOptionSpec[];
}

/** Extracts payment methods (+ payment_options) from POST /checkout/totals response. */
export function parsePaymentsAvailable(totals: unknown): ParsedPaymentMethod[] {
  if (!totals || typeof totals !== 'object') return [];
  const t = totals as Record<string, unknown>;
  const arr = t.payments_available;
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p: Record<string, unknown>) => {
      const rawOpts = p.payment_options;
      const payment_options = Array.isArray(rawOpts)
        ? rawOpts
            .map((o: Record<string, unknown>) => ({
              name: o.name != null ? String(o.name) : '',
              title: o.title != null ? String(o.title) : undefined,
              required: o.required === true || o.required === 'true' || o.required === 1,
            }))
            .filter((o) => o.name.length > 0)
        : undefined;
      return {
        code: p.code != null ? String(p.code) : '',
        title: p.title != null ? String(p.title) : undefined,
        payment_options,
      };
    })
    .filter((p) => p.code.length > 0);
}

function readGrandTotalFromObject(obj: Record<string, unknown>): number | undefined {
  const gt = obj.grand_total;
  if (typeof gt === 'number' && !Number.isNaN(gt)) return gt;
  if (typeof gt === 'string') {
    const n = parseFloat(gt.replace(',', '.'));
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

/** Reads `grand_total` from a POST /checkout/totals JSON body (with or without `data` wrapper). */
export function parseGrandTotalFromTotalsResponse(data: unknown): number | undefined {
  if (data === null || data === undefined || typeof data !== 'object') return undefined;
  const root = data as Record<string, unknown>;
  const inner =
    root.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;

  const fromTotals = inner.totals && typeof inner.totals === 'object' ? readGrandTotalFromObject(inner.totals as Record<string, unknown>) : undefined;
  if (fromTotals != null) return fromTotals;

  const direct = readGrandTotalFromObject(inner);
  if (direct != null) return direct;

  return undefined;
}

/** Currency code from totals (for purchase query param). */
export function parseCurrencyFromTotalsResponse(data: unknown): string | undefined {
  if (data === null || data === undefined || typeof data !== 'object') return undefined;
  const root = data as Record<string, unknown>;
  const inner =
    root.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  const totals = inner.totals;
  if (totals && typeof totals === 'object') {
    const c = (totals as Record<string, unknown>).currency;
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return undefined;
}
