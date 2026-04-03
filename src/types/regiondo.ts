/**
 * Regiondo REST API — List products response shapes.
 * @see https://sandbox-api.regiondo.com/docs/ — List products
 */

export interface RegiondoVariationOption {
  option_id: string;
}

export interface RegiondoVariation {
  variation_id: string;
  options: RegiondoVariationOption[];
}

export interface RegiondoTips {
  class?: string;
  title?: string;
}

/**
 * Single product row from `GET /v1/products` (list / search).
 */
export interface RegiondoProduct {
  product_id: string;
  name: string;
  sku?: string;
  short_description?: string;
  /** Often present on `GET /v1/products/{productId}` (detail). */
  description?: string;
  geo_lat?: string;
  geo_lon?: string;
  distance?: string | null;
  location_address?: string;
  city?: string;
  zipcode?: string;
  city_id?: string;
  region_id?: string;
  poi_ids?: string | null;
  country_id?: string;
  continent_id?: string;
  thumbnail?: string;
  appointment_types?: string;
  image?: string;
  image_label?: string | null;
  url_key?: string;
  url_path?: string;
  provider?: string;
  rating_summary?: string;
  reviews_count?: string;
  is_appointment_needed?: string;
  ticket_suitable_for?: string | null;
  top_things_to_do?: string;
  ticket_weather?: string | null;
  ticket_languages?: string;
  product_supplier_id?: string;
  original_price?: string;
  type_id?: string;
  as_gift?: string;
  covid_19?: string;
  in_stock?: string;
  is_expired?: string;
  regiondo_url?: string;
  wl_regiondo_url?: string;
  base_price?: string;
  ticket_view_params?: string;
  default_name?: string;
  disable_print_at_home?: string | null;
  duration_type?: string;
  duration_values?: string;
  variations?: RegiondoVariation[];
  /** API sometimes misspells "currency" */
  curency_code?: string;
  currency_code?: string;
  tips?: RegiondoTips;
}

export interface RegiondoPage {
  first: number;
  before: number;
  previous: number;
  current: number;
  last: number;
  next: number;
  total_pages: number;
  total_items: number;
  limit: number;
}

export interface RegiondoProductsListResponse {
  data: RegiondoProduct[];
  page: RegiondoPage;
}

/**
 * `GET /v1/products/availabilities/{variationId}?dt_from=&dt_to=`
 * Response `data` maps date (YYYY-MM-DD) to time slots (strings or nested arrays).
 */
export interface RegiondoAvailabilitiesResponse {
  data?: Record<string, RegiondoAvailabilitySlot[]>;
  [key: string]: unknown;
}

export type RegiondoAvailabilitySlot = string | string[] | Record<string, unknown>;
