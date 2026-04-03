import type { RegiondoBuyerFieldValue } from '../types/regiondoCheckout';

/** Maps totals `buyer_data_required` rows to filled `buyer_data` using contact fields (same pattern as Regiondo dashboard). */
export function buildBuyerDataFromContact(
  buyerDataRequired: unknown[] | undefined,
  c: { firstname: string; lastname: string; email: string; telephone: string }
): RegiondoBuyerFieldValue[] {
  if (!Array.isArray(buyerDataRequired) || buyerDataRequired.length === 0) return [];
  return buyerDataRequired.map((row) => {
    const r = row as Record<string, unknown>;
    const title = String(r.title ?? '');
    const fid = r.field_id;
    const idStr = String(fid ?? '');
    let value = '';
    if (idStr === '1' || /vorname/i.test(title)) value = c.firstname;
    else if (idStr === '2' || /nachname/i.test(title)) value = c.lastname;
    else if (idStr === '3' || /e-mail|email/i.test(title)) value = c.email;
    else if (idStr === '4' || /telefon|phone/i.test(title)) value = c.telephone;
    return {
      title,
      field_id: fid as RegiondoBuyerFieldValue['field_id'],
      type: String(r.type ?? 'text'),
      required: r.required === true,
      value,
    };
  });
}
