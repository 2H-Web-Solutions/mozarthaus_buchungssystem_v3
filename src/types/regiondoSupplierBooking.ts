import type { RegiondoPage } from './regiondo';

/**
 * GET /v1/supplier/bookings — `data[]` row (Regiondo Supplier API).
 */

export interface RegiondoBookingStatus {
  code?: string;
  label?: string;
}

export interface RegiondoPaymentStatus {
  code?: string;
  label?: string;
}

export interface RegiondoBookingOptionLine {
  option_id?: string;
  option_name?: string;
  ticket_description?: string;
  qty?: string;
  qty_cancelled?: string;
}

export interface RegiondoBuyerDataField {
  title?: string;
  field_id?: string;
  required?: boolean | null;
  type?: string;
  value?: string;
}

export interface RegiondoContactData {
  firstname?: string;
  lastname?: string;
  email?: string;
  telephone?: string;
  is_subscribed?: string;
  subscribed_by_email?: string;
  subscribed_by_ip?: string;
  subscribe_date?: string;
  comment?: string;
}

export interface RegiondoBookingDocument {
  type?: string;
  url?: string;
}

export interface RegiondoSupplierBooking {
  booking_key?: string;
  order_number?: string;
  order_id?: string;
  product_id?: string;
  option_id?: string;
  product_supplier_id?: string;
  event_date_time?: string;
  date_applied_for?: string;
  opened_till?: string | null;
  type?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  ticket_name?: string;
  product_name?: string;
  option_name?: string;
  variation_id?: string;
  variation_name?: string;
  qty?: number;
  qty_cancelled?: number;
  external_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  timezone?: string;
  booking_status?: RegiondoBookingStatus;
  payment_status?: RegiondoPaymentStatus;
  total_amount?: string;
  comment?: string | null;
  sub_id?: string | null;
  coupon_codes?: unknown[];
  giftcert_codes?: unknown[];
  duration_type?: string;
  duration_value?: string;
  product_comment?: string;
  options?: RegiondoBookingOptionLine[];
  resources?: unknown[];
  buyer_data?: RegiondoBuyerDataField[];
  attendee_data?: unknown[];
  distribution_channel_partner?: string;
  contact_data?: RegiondoContactData;
  documents?: RegiondoBookingDocument[];
}

export interface RegiondoSupplierBookingsResponse {
  data?: RegiondoSupplierBooking[];
  page?: RegiondoPage;
  [key: string]: unknown;
}
