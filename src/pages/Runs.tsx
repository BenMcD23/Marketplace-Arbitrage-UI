import { CheckCircle2, CircleDashed, History, XCircle } from 'lucide-react'

import { useHealth, useRuns } from '../api/hooks'
import type { Run } from '../api/types'
import { Badge, Card, EmptyState, ErrorNote, Skeleton } from '../components/ui'
import { dateTime, duration, number } from '../lib/format'

export function Runs() {
  const { data: health } = useHealth()
  const { data, isLoading, isError, error } = useRuns(Boolean(health?.scan_running))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Runs</h1>
        <p className="text-sm text-muted">
          Each run scans every enabled search, values what it finds, then spends whatever
          API budget is left checking which watched listings have ended.
        </p>
      </div>

      {isError && <ErrorNote error={error} />}

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={<History size={22} />} title="No runs yet">
            Hit &quot;Run scan&quot; in the header to start one.
          </EmptyState>
        </Card>
      )}
    </div>
  )
}

function RunCard({ run }: { run: Run }) {
  const status = {
    running: {
      icon: <CircleDashed size={15} className="animate-spin-slow text-accent" />,
      badge: <Badge tone="accent">running</Badge>,
    },
    complete: {
      icon: <CheckCircle2 size={15} className="text-good" />,
      badge: <Badge tone="good">complete</Badge>,
    },
    failed: {
      icon: <XCircle size={15} className="text-critical" />,
      badge: <Badge tone="critical">failed</Badge>,
    },
  }[run.status]

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {status.icon}
          <div>
            <p className="text-sm font-medium text-ink">Run #{run.id}</p>
            <p className="text-xs text-muted">
              {dateTime(run.started_at)}
              {run.finished_at && ` · took ${duration(run.started_at, run.finished_at)}`}
            </p>
          </div>
        </div>
        {status.badge}
      </div>

      {run.error && (
        <p className="mt-3 rounded-lg border border-critical/25 bg-critical/10 px-3 py-2 text-xs text-critical">
          {run.error}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Scanned" value={number(run.listings_scanned)} />
        <Metric label="New" value={number(run.new_listings)} />
        <Metric label="Valued" value={number(run.valuations_fetched)} />
        <Metric label="Deals" value={number(run.deals_found)} highlight />
        <Metric label="Sales observed" value={number(run.sold_observed)} />
        <Metric label="API calls" value={number(run.api_calls)} />
      </dl>
    </Card>
  )
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className={
          highlight
            ? 'tabular mt-0.5 text-sm font-semibold text-good-ink'
            : 'tabular mt-0.5 text-sm text-ink'
        }
      >
        {value}
      </dd>
    </div>
  )
}
