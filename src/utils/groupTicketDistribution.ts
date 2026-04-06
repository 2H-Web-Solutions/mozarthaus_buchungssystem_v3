/**
 * Split `total` tickets across `categoryIds` in order: base = floor(total/k),
 * first `remainder` categories get base+1, the rest get base.
 * Example: 7 across [A,B,C] → 3+2+2; 6 across [A,B,C] → 2+2+2.
 */
export function distributeTotalAcrossCategories(
  total: number,
  categoryIds: string[]
): Record<string, number> {
  const k = categoryIds.length;
  const out: Record<string, number> = {};
  if (k === 0 || total < 0) return out;
  const n = Math.floor(total);
  if (n === 0) {
    for (const id of categoryIds) out[id] = 0;
    return out;
  }
  const base = Math.floor(n / k);
  const remainder = n % k;
  for (let i = 0; i < k; i++) {
    out[categoryIds[i]] = base + (i < remainder ? 1 : 0);
  }
  return out;
}
