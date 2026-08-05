/**
 * Dashboard charts.
 *
 * Two measures on different scales (a count of deals, and pounds of expected
 * profit) get two charts rather than one chart with two y-axes — a dual-axis
 * plot lets the author imply a correlation the data never showed.
 *
 * Each chart is a single series, so no legend is needed: the title names it.
 * Colours come from the validated categorical slots via CSS custom properties,
 * which means they re-step correctly in dark mode instead of being flipped.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { money, shortDate } from '../lib/format'
import { Card, EmptyState } from './ui'

interface DayPoint {
  date: string
  deals: number
  expected_profit: number | null
}

/** Recharts needs literal colours, so the CSS variables are read at render. */
function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name)
  return value.trim() || fallback
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  unitLabel,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  formatter: (value: number) => string
  unitLabel: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs text-muted">{label ? shortDate(label) : ''}</p>
      <p className="tabular mt-0.5 text-sm font-semibold text-ink">
        {formatter(payload[0].value)}
        <span className="ml-1 font-normal text-muted">{unitLabel}</span>
      </p>
    </div>
  )
}

const axisStyle = { fontSize: 11 }

function useChartColours() {
  return {
    series1: cssVar('--color-series-1', '#2a78d6'),
    series3: cssVar('--color-series-3', '#1baf7a'),
    grid: cssVar('--color-grid', '#ebebe7'),
    muted: cssVar('--color-muted', '#898781'),
  }
}

/**
 * Ascending by date, with empty days filled in.
 *
 * The API only returns days that had deals, so plotting it raw would draw a
 * straight line from one busy day to the next *through* the quiet ones — which
 * reads as steady activity when there was none. Zero-filling the gaps makes the
 * quiet days visible as the zeroes they are.
 */
function chronological(data: DayPoint[]): DayPoint[] {
  if (data.length === 0) return []

  const byDate = new Map(data.map((point) => [point.date, point]))
  const dates = [...byDate.keys()].sort()
  const cursor = new Date(`${dates[0]}T00:00:00Z`)
  const last = new Date(`${dates[dates.length - 1]}T00:00:00Z`)

  const filled: DayPoint[] = []
  while (cursor <= last) {
    const key = cursor.toISOString().slice(0, 10)
    filled.push(byDate.get(key) ?? { date: key, deals: 0, expected_profit: 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return filled
}

export function DealsPerDayChart({ data }: { data: DayPoint[] }) {
  const colours = useChartColours()
  const points = chronological(data)

  return (
    <Card className="min-w-0">
      <h2 className="text-sm font-semibold text-ink">Deals found per day</h2>
      <p className="mt-0.5 mb-4 text-xs text-muted">
        Listings that cleared every threshold, excluding scam flags.
      </p>
      {points.length === 0 ? (
        <EmptyState title="No deals yet">
          Run a scan to start collecting results.
        </EmptyState>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={colours.grid} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ ...axisStyle, fill: colours.muted }}
                axisLine={false}
                tickLine={false}
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ ...axisStyle, fill: colours.muted }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ fill: colours.grid, opacity: 0.5 }}
                content={
                  <ChartTooltip formatter={(value) => String(value)} unitLabel="deals" />
                }
              />
              {/* 4px rounded data-end, anchored square to the baseline. */}
              <Bar dataKey="deals" fill={colours.series1} radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

export function ExpectedProfitChart({ data }: { data: DayPoint[] }) {
  const colours = useChartColours()
  const points = chronological(data).map((point) => ({
    ...point,
    expected_profit: point.expected_profit ?? 0,
  }))

  return (
    <Card className="min-w-0">
      <h2 className="text-sm font-semibold text-ink">Expected profit per day</h2>
      <p className="mt-0.5 mb-4 text-xs text-muted">
        Risk-adjusted — weighted by the chance of selling, net of held capital.
      </p>
      {points.length === 0 ? (
        <EmptyState title="Nothing to plot yet">
          Expected profit appears once deals are flagged.
        </EmptyState>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colours.series3} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={colours.series3} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={colours.grid} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ ...axisStyle, fill: colours.muted }}
                axisLine={false}
                tickLine={false}
                minTickGap={20}
              />
              <YAxis
                tickFormatter={(value: number) => money(value, true)}
                tick={{ ...axisStyle, fill: colours.muted }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                cursor={{ stroke: colours.muted, strokeWidth: 1 }}
                content={
                  <ChartTooltip formatter={(value) => money(value)} unitLabel="expected" />
                }
              />
              <Area
                type="linear"
                dataKey="expected_profit"
                stroke={colours.series3}
                strokeWidth={2}
                fill="url(#profitFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
