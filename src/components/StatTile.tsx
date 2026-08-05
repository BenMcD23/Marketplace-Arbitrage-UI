import type { ReactNode } from 'react'

import { cn } from '../lib/cn'

/**
 * A single headline figure.
 *
 * Not every number deserves a chart — when the data's job is "state one value",
 * a stat tile reads faster than any plot of it would. The value carries
 * proportional figures; only columns that must align vertically get tabular.
 */
export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'good' | 'warning'
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <p
        className={cn(
          'mt-2 text-2xl font-semibold tracking-tight',
          tone === 'good' && 'text-good-ink',
          tone === 'warning' && 'text-ink',
          tone === 'default' && 'text-ink',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

/**
 * A 0-100 composite score.
 *
 * The number is always shown, and the bar length carries the magnitude — colour
 * is a reinforcement, never the only channel, so the score stays readable for
 * colour-vision-deficient viewers and in forced-colours mode.
 */
export function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const clamped = Math.max(0, Math.min(100, score))
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'tabular font-semibold text-ink',
          size === 'sm' ? 'text-xs' : 'text-sm',
        )}
      >
        {clamped.toFixed(0)}
      </span>
      <span
        className={cn(
          'relative overflow-hidden rounded-full bg-surface-2',
          size === 'sm' ? 'h-1 w-10' : 'h-1.5 w-16',
        )}
        aria-hidden
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-series-1"
          style={{ width: `${clamped}%` }}
        />
      </span>
    </div>
  )
}

/** Valuation confidence, 0–1. Same rule: the percentage is always written out. */
export function ConfidenceMeter({
  confidence,
  showLabel = true,
}: {
  confidence: number
  showLabel?: boolean
}) {
  const pct = Math.max(0, Math.min(100, confidence * 100))
  const tone = pct >= 60 ? 'bg-series-3' : pct >= 35 ? 'bg-series-2' : 'bg-critical'

  return (
    <div className="flex items-center gap-2">
      <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <span
          className={cn('absolute inset-y-0 left-0 rounded-full', tone)}
          style={{ width: `${pct}%` }}
        />
      </span>
      {showLabel && <span className="tabular text-xs text-ink-2">{pct.toFixed(0)}%</span>}
    </div>
  )
}
