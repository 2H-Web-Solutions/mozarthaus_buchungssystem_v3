import type { RegiondoProduct, RegiondoVariation } from '../types/regiondo';

function variationLabel(v: RegiondoVariation): string {
  const n = v.name?.trim();
  if (n) return n;
  return v.title || v.variation_name || `Variation ${v.variation_id}`;
}

/**
 * Fixed EUR unit prices for known Mozart Ensemble tariff names when labels match.
 * Order matters: Kategorie A/B before generic "student" patterns if labels overlap.
 */
const LABEL_UNIT_PRICE_EUR: { pattern: RegExp; eur: number }[] = [
  { pattern: /kategorie\s*a|category\s*a\b/i, eur: 69 },
  { pattern: /kategorie\s*b|category\s*b\b/i, eur: 59 },
  { pattern: /student|studenten|studierende/i, eur: 42 },
];

function unitPriceOverrideEuroForLabel(label: string): number | null {
  const t = label.trim();
  if (!t) return null;
  for (const { pattern, eur } of LABEL_UNIT_PRICE_EUR) {
    if (pattern.test(t)) return eur;
  }
  return null;
}

/**
 * Parses Regiondo price values: numbers, strings like "19.99", "19,99", "1.234,56", "€ 12,50".
 */
export function parseRegiondoMoney(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  let s = String(value).replace(/[\s\u00a0]/g, '').replace(/[€£$]/g, '').trim();
  if (!s) return null;

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');

  // European: thousands with dot, decimals with comma (e.g. 1.234,56 or 12,50)
  if (lastComma > lastDot && /,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && /\.\d{2}$/.test(s) && /,\d{3}/.test(s)) {
    // US: 1,234.56
    s = s.replace(/,/g, '');
  } else {
    // Single separator or ambiguous: prefer last comma as decimal if two digits follow
    if (lastComma !== -1 && s.length - lastComma - 1 <= 2 && lastComma > 0) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

type LooseVar = RegiondoVariation & Record<string, unknown>;

/**
 * Resolves the per-ticket unit price for a variation from product detail / list payloads.
 * Tries all common Regiondo keys; avoids using only product base price when a variation-specific value exists.
 */
export function getVariationUnitPriceEuro(v: RegiondoVariation, product: RegiondoProduct | null): number {
  const fromLabel = unitPriceOverrideEuroForLabel(variationLabel(v));
  if (fromLabel != null) return fromLabel;

  const x = v as LooseVar;
  const candidates: unknown[] = [
    x.price,
    x.final_price,
    x.sales_price,
    x.base_price,
    x.original_price,
    x.sale_price,
    x.customer_price,
    x.gross_price,
    x.net_price,
  ];

  for (const c of candidates) {
    const n = parseRegiondoMoney(c);
    if (n != null && n > 0) return n;
  }

  if (product) {
    const p = product as RegiondoProduct & Record<string, unknown>;
    for (const c of [p.base_price, p.original_price, p.final_price]) {
      const n = parseRegiondoMoney(c);
      if (n != null && n > 0) return n;
    }
  }

  return 0;
}
