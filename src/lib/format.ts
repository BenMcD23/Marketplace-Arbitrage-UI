/** Formatting helpers. Currency follows the eBay marketplace the backend uses. */

const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
})

const gbpCompact = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

export function money(value: number | null | undefined, compact = false): string {
  if (value === null || value === undefined) return '—'
  return compact ? gbpCompact.format(value) : gbp.format(value)
}

export function percent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(digits)}%`
}

/** For 0–1 ratios such as confidence and p_sale. */
export function ratioPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined) return '—'
  return `${(value * 100).toFixed(digits)}%`
}

export function number(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return value.toLocaleString('en-GB')
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function dateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function duration(from: string, to: string | null): string {
  if (!to) return '—'
  const seconds = Math.max(0, (new Date(to).getTime() - new Date(from).getTime()) / 1000)
  if (seconds < 60) return `${seconds.toFixed(0)}s`
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
}

export const conditionLabel: Record<string, string> = {
  new: 'New',
  used: 'Used',
  for_parts: 'For parts',
  unknown: 'Unknown',
}

export const basisLabel: Record<string, string> = {
  sold: 'Observed sales',
  cex: 'CeX used price',
  active: 'Active listings',
  amazon: 'Amazon (Keepa)',
  none: 'No data',
}

export const basisHelp: Record<string, string> = {
  sold: 'Priced from listings we watched sell — the strongest evidence available.',
  cex: "Priced from what CeX charges for the same used product, discounted to a private-sale level.",
  active: 'Priced from current asking prices, discounted towards a realistic sale price.',
  amazon: 'Priced from Amazon data via Keepa.',
  none: 'Not enough comparable listings to price this.',
}

/** Rejection reasons are stored as machine keys; these are the human versions. */
export const rejectLabel: Record<string, string> = {
  accessory_or_lot: 'Accessory, spare part or multi-pack',
  capacity_mismatch: 'Different storage capacity',
  for_parts: 'Sold for parts',
  low_relevance: 'Not the same product',
  model_mismatch: 'A different model number',
  no_price: 'No usable price',
}
