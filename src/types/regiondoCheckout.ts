/**
 * Regiondo Checkout API — subset used for hold / purchase flows.
 * @see https://sandbox-api.regiondo.com/docs/
 */

export interface RegiondoCartItem {
  product_id: number;
  option_id?: number;
  value?: number;
  value_from?: number;
  value_to?: number;
  value_message?: number;
  /** Y-m-d H:i:s */
  date_time?: string;
  qty: number;
  reservation_code?: string;
  external_item_id?: string;
  source_type?: number;
  as_gift?: number;
}

export interface RegiondoContactDataPurchase {
  firstname?: string;
  lastname?: string;
  email?: string;
  telephone?: string;
  comment?: string;
}

export interface RegiondoBuyerFieldValue {
  title?: string;
  /** Regiondo may return string IDs from totals; both are accepted on purchase. */
  field_id?: number | string;
  required?: boolean;
  type?: string;
  view_type?: string;
  value?: string;
  available_value_ids?: { id: number; title: string }[];
}

/**
 * Payment for POST /checkout/purchase.
 * - **Offline / in-store:** use codes such as `cashregister`, `cash`, `invoice` (must exist in your shop’s `payments_available`).
 * - **api_external:** external payment capture; uses `options: [{ name: 'value' }]` per Regiondo samples.
 */
export interface RegiondoPaymentOptionEntry {
  name: string;
  /** Often required when `payments_available[].payment_options` names an amount field (use grand_total from totals). */
  value?: string | number;
}

export interface RegiondoPaymentBlock {
  code: string;
  options?: RegiondoPaymentOptionEntry[];
}

/** POST /checkout/purchase body (minimal fields; extend as needed). */
export interface RegiondoPurchaseInput {
  items: RegiondoCartItem[];
  contact_data: RegiondoContactDataPurchase;
  buyer_data?: RegiondoBuyerFieldValue[];
  attendee_data?: unknown[];
  assignees?: number[];
  skip_customer_validation?: boolean;
  sub_id?: string;
  source_type?: number;
  coupon_code?: string;
  printer_html?: string;
  payment: RegiondoPaymentBlock;
}

export interface RegiondoHoldResponse {
  reservation_data?: Array<{
    reservation_code?: string;
    product_id?: number;
    option_id?: number;
    qty?: number;
    reservation_end?: string;
    date_time?: string;
    opened_till?: string;
    timezone?: string;
  }>;
  date_time?: string;
  opened_till?: string;
  totals?: unknown;
  contact_data_required?: string[];
  buyer_data_required?: unknown[];
  attendee_data_required?: unknown[];
  [key: string]: unknown;
}

export interface RegiondoPurchaseResponse {
  order_number?: string;
  order_id?: string;
  purchased_at?: string;
  info_generated_at?: string;
  grand_total?: number;
  currency?: string;
  message?: string;
  items?: unknown[];
  [key: string]: unknown;
}

export interface RegiondoSimpleOk {
  result?: string;
  [key: string]: unknown;
}
