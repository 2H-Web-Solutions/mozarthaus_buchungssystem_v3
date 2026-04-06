/**
 * Hardcoded Regiondo checkout `option_id` per `variation_id` (Tarif / Kategorie).
 * Used for POST /checkout/totals and /checkout/purchase — overrides API `variations[].options[].option_id`
 * when an entry exists here.
 *
 * Keys: Regiondo `variation_id` as returned on the product (string).
 */
export const REGIONDO_CHECKOUT_OPTION_ID_BY_VARIATION_ID: Record<string, number> = {
  '31903': 60680,
  '559147': 1549178,
  '559148': 1549179,
};

export function getHardcodedRegiondoCheckoutOptionId(variationId: string): number | undefined {
  const k = String(variationId).trim();
  const n = REGIONDO_CHECKOUT_OPTION_ID_BY_VARIATION_ID[k];
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}
