/** Mirrors the FastAPI response schemas in `api/schemas.py`. */

export type Condition = 'new' | 'used' | 'for_parts' | 'unknown'
export type SellChannel = 'ebay' | 'amazon'
export type PriceBasis = 'sold' | 'active' | 'amazon' | 'none'
export type RunStatus = 'running' | 'complete' | 'failed'

export interface Listing {
  id: string
  source: string
  title: string
  brand: string | null
  model_number: string | null
  price: number
  shipping: number
  buy_cost: number
  condition: Condition
  url: string
  image_url: string | null
  location: string | null
  seen_at: string
}

export interface CompRef {
  title: string
  price: number
  condition: Condition
  url: string | null
  sold: boolean
  relevance: number
}

export interface Valuation {
  product_key: string
  resale_price: number | null
  basis: PriceBasis
  comp_count: number
  comps_rejected: number
  dispersion_cv: number
  price_p10: number | null
  price_p90: number | null
  confidence: number
  sell_through_pct: number | null
  est_days_to_sell: number | null
  amazon_price: number | null
  amazon_rank: number | null
  sample: CompRef[]
  reject_reasons: Record<string, number>
  updated_at: string
}

export interface Deal {
  listing_id: string
  buy_cost: number
  est_resale: number
  est_fees: number
  est_profit: number
  margin_pct: number
  roi_pct: number
  sell_channel: SellChannel
  p_sale: number
  est_days_to_sell: number | null
  holding_cost: number
  expected_profit: number
  confidence: number
  score: number
  worst_case_profit: number
  is_scam_flag: boolean
  reasons: string[]
  flagged_at: string
  listing: Listing | null
}

export interface FeeBreakdown {
  final_value_fee: number
  fixed_fee: number
  payment_fee: number
  ad_fee: number
  referral_fee: number
  fulfilment_fee: number
  postage: number
  packaging: number
  total: number
}

export interface DealDetail extends Deal {
  valuation: Valuation | null
  fee_breakdown: FeeBreakdown | null
  breakeven_buy_price: number | null
}

export interface DealPage {
  items: Deal[]
  total: number
  limit: number
  offset: number
}

export interface Run {
  id: number | null
  status: RunStatus
  started_at: string
  finished_at: string | null
  listings_scanned: number
  new_listings: number
  valuations_fetched: number
  deals_found: number
  scam_flags: number
  sold_observed: number
  api_calls: number
  error: string | null
  by_source: Record<string, number>
}

export interface WatchQuery {
  id: number | null
  query: string
  category_id: string | null
  max_price: number | null
  min_price: number | null
  enabled: boolean
  created_at: string
  last_run_at: string | null
}

export interface Health {
  status: string
  ebay_configured: boolean
  keepa_configured: boolean
  insights_available: boolean
  marketplace: string
  api_calls_used: number
  api_calls_remaining: number
  daily_call_limit: number
  scan_running: boolean
  watched_queries: number
  sold_observations: number
  db_path: string
}

export interface DataHealth {
  sold_observations: number
  sold_product_keys: number
  comps_watched: number
  valuations: number
  valuations_from_sold: number
  listings: number
}

export interface Stats {
  window_days: number
  total_deals: number
  avg_roi: number | null
  avg_profit: number | null
  avg_expected_profit: number | null
  total_expected_profit: number | null
  avg_confidence: number | null
  avg_score: number | null
  scam_flags: number
  per_day: { date: string; deals: number; expected_profit: number | null }[]
  per_source: { source: string; deals: number; avg_roi: number | null }[]
  per_channel: { channel: string; deals: number; avg_profit: number | null }[]
  data_health: DataHealth
}

export interface SettingsPayload {
  values: Record<string, number | boolean>
  editable: string[]
}

/** Index signature so this can be passed straight to the query-string builder. */
export interface DealQuery {
  [key: string]: string | number | boolean | undefined
  limit?: number
  offset?: number
  sort?: string
  order?: 'asc' | 'desc'
  min_score?: number
  min_profit?: number
  min_confidence?: number
  channel?: string
  source?: string
  search?: string
  include_scams?: boolean
  days?: number
}
