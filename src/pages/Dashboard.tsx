import { Database, Eye, Gauge, PoundSterling, ShieldAlert, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useDeals, useHealth, useStats } from '../api/hooks'
import { DealsPerDayChart, ExpectedProfitChart } from '../components/charts'
import { ScoreBadge, StatTile } from '../components/StatTile'
import { Card, EmptyState, ErrorNote, SectionHeading, Select, Skeleton } from '../components/ui'
import { money, number, percent, ratioPercent } from '../lib/format'

const WINDOWS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

export function Dashboard() {
  const [days, setDays] = useState('30')
  const stats = useStats(Number(days))
  const health = useHealth()
  const topDeals = useDeals({ limit: 5, sort: 'score', order: 'desc' })

  if (stats.isError) return <ErrorNote error={stats.error} />

  const data = stats.data
  const health_ = data?.data_health

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Overview</h1>
          <p className="text-sm text-muted">
            {health.data?.marketplace ?? 'eBay'} · {number(health.data?.watched_queries)} watched
            searches
          </p>
        </div>
        <Select value={days} onChange={setDays} options={WINDOWS} ariaLabel="Time window" />
      </div>

      {stats.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Deals found"
            value={number(data?.total_deals)}
            hint={`in the last ${data?.window_days} days`}
            icon={<TrendingUp size={15} />}
          />
          <StatTile
            label="Expected profit"
            value={money(data?.total_expected_profit ?? 0)}
            hint="risk-adjusted across all deals"
            icon={<PoundSterling size={15} />}
            tone="good"
          />
          <StatTile
            label="Average ROI"
            value={percent(data?.avg_roi, 1)}
            hint={`avg profit ${money(data?.avg_profit)}`}
            icon={<Gauge size={15} />}
          />
          <StatTile
            label="Average confidence"
            value={ratioPercent(data?.avg_confidence)}
            hint="how much to trust the valuations"
            icon={<Eye size={15} />}
          />
        </div>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <DealsPerDayChart data={data?.per_day ?? []} />
        <ExpectedProfitChart data={data?.per_day ?? []} />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <SectionHeading
            title="Top deals"
            hint="Ranked by score, not raw profit — evidence counts."
            action={
              <Link
                to="/deals"
                className="text-xs font-medium text-accent underline-offset-2 hover:underline"
              >
                View all
              </Link>
            }
          />
          {topDeals.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : topDeals.data?.items.length ? (
            <ul className="divide-y divide-hairline">
              {topDeals.data.items.map((deal) => (
                <li key={deal.listing_id}>
                  <Link
                    to={`/deals?deal=${deal.listing_id}`}
                    className="flex items-center gap-3 py-2.5 transition hover:opacity-80"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">
                        {deal.listing?.title ?? deal.listing_id}
                      </p>
                      <p className="tabular text-xs text-muted">
                        Buy {money(deal.buy_cost)} · sell {money(deal.est_resale)} ·{' '}
                        {percent(deal.roi_pct)} ROI
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-sm font-semibold text-good-ink">
                      {money(deal.expected_profit)}
                    </span>
                    <div className="hidden shrink-0 sm:block">
                      <ScoreBadge score={deal.score} size="sm" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No deals yet">
              Add a search on the <Link to="/watchlist" className="text-accent">Watchlist</Link>{' '}
              page, then run a scan.
            </EmptyState>
          )}
        </Card>

        <Card>
          <SectionHeading
            title="Data health"
            hint="How much of its own sold history the system has built."
          />
          <dl className="space-y-3 text-sm">
            <HealthRow
              icon={<Database size={14} />}
              label="Observed sales"
              value={number(health_?.sold_observations)}
              hint={`across ${number(health_?.sold_product_keys)} products`}
            />
            <HealthRow
              icon={<Eye size={14} />}
              label="Comps watched"
              value={number(health_?.comps_watched)}
              hint="tracked for their endings"
            />
            <HealthRow
              icon={<Gauge size={14} />}
              label="Valuations"
              value={number(health_?.valuations)}
              hint={`${number(health_?.valuations_from_sold)} priced from real sales`}
            />
            <HealthRow
              icon={<ShieldAlert size={14} />}
              label="Scam flags"
              value={number(data?.scam_flags)}
              hint="too cheap to be real"
            />
          </dl>
          {health_ && health_.sold_observations === 0 && (
            <p className="mt-4 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
              Sold-price history builds up over repeated scans. Until then, valuations
              use active asking prices discounted towards a realistic sale price.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}

function HealthRow({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-muted">{icon}</span>
        <div>
          <dt className="text-ink">{label}</dt>
          <dd className="text-xs text-muted">{hint}</dd>
        </div>
      </div>
      <span className="tabular shrink-0 font-semibold text-ink">{value}</span>
    </div>
  )
}
