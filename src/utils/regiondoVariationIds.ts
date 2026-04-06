import { getHardcodedRegiondoCheckoutOptionId } from '../constants/regiondoCheckoutOptionIds';
import type { RegiondoVariation } from '../types/regiondo';

/**
 * Reads `option_id` from one entry of `variations[].options[]` (Regiondo product detail).
 * Never use `variation_id` as checkout `option_id` — they differ (e.g. variation 31903 → option 60680).
 */
function parseOptionEntryOptionId(entry: unknown): number | null {
  if (entry == null || typeof entry !== 'object') return null;
  const o = entry as Record<string, unknown>;
  const raw = o.option_id ?? o.product_option_id;
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;
  const n = Number(String(raw).trim());
  return Number.isFinite(n) ? n : null;
}

/**
 * Regiondo checkout (`POST /checkout/totals`, `POST /checkout/purchase`) expects `option_id`
 * to be the **product option id** from `variations[].options[].option_id`, not `variation_id`.
 */
export function regiondoCheckoutOptionId(v: RegiondoVariation): number {
  const hard = getHardcodedRegiondoCheckoutOptionId(v.variation_id);
  if (hard != null) return hard;

  const opts = v.options;
  if (Array.isArray(opts)) {
    for (const entry of opts) {
      const n = parseOptionEntryOptionId(entry);
      if (n != null) return n;
    }
  }
  throw new Error(
    `Regiondo: Variation ${v.variation_id} hat keine gültige options[].option_id im Produktdetail — ` +
      'Checkout erwartet die Option-IDs aus der API (nicht variation_id).'
  );
}

/** String form for Firestore / display (prefers option id from API). */
export function regiondoCheckoutOptionIdString(v: RegiondoVariation): string {
  return String(regiondoCheckoutOptionId(v));
}
