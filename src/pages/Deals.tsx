import { ArrowDown, ArrowUp, ExternalLink, Search, ShieldCheck, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useDeals } from '../api/hooks'
import type { Deal, DealQuery } from '../api/types'
import { DealDetail } from '../components/DealDetail'
import { ConfidenceMeter, ScoreBadge } from '../components/StatTile'
import { Badge, Button, Card, EmptyState, ErrorNote, Input, Select, Skeleton, Toggle } from '../components/ui'
import { cn } from '../lib/cn'
import { conditionLabel, money, number, percent, relativeTime } from '../lib/format'

const PAGE_SIZE = 25

const SORTS = [
  { value: 'score', label: 'Score' },
  { value: 'expected_profit', label: 'Expected profit' },
  { value: 'profit', label: 'Profit' },
  { value: 'roi', label: 'ROI' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'flagged_at', label: 'Newest' },
  { value: 'buy_cost', label: 'Buy cost' },
  { value: 'floor_profit', label: 'Guaranteed floor' },
]

const COLUMNS: { key: string; label: string; sort?: string; align?: 'right' }[] = [
  { key: 'item', label: 'Item' },
  { key: 'buy', label: 'Buy', sort: 'buy_cost', align: 'right' },
  { key: 'resale', label: 'Resale', align: 'right' },
  { key: 'profit', label: 'Profit', sort: 'profit', align: 'right' },
  { key: 'expected', label: 'Expected', sort: 'expected_profit', align: 'right' },
  { key: 'roi', label: 'ROI', sort: 'roi', align: 'right' },
  { key: 'confidence', label: 'Confidence', sort: 'confidence' },
  { key: 'score', label: 'Score', sort: 'score' },
]

export function Deals() {
  const [params, setParams] = useSearchParams()
  const selected = params.get('deal')

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('score')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [minProfit, setMinProfit] = useState('')
  const [includeScams, setIncludeScams] = useState(false)
  const [guaranteedOnly, setGuaranteedOnly] = useState(false)
  const [page, setPage] = useState(0)

  const query: DealQuery = useMemo(
    () => ({
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      sort,
      order,
      search: search || undefined,
      min_profit: minProfit ? Number(minProfit) : undefined,
      include_scams: includeScams,
      guaranteed_only: guaranteedOnly,
    }),
    [page, sort, order, search, minProfit, includeScams, guaranteedOnly],
  )

  const { data, isLoading, isError, error, isPlaceholderData } = useDeals(query)

  const open = (id: string) => setParams({ deal: id })
  const close = () => setParams({})

  const toggleSort = (column: string) => {
    setPage(0)
    if (sort === column) {
      setOrder(order === 'desc' ? 'asc' : 'desc')
    } else {
      setSort(column)
      setOrder('desc')
    }
  }

  const total = data?.total ?? 0
  const pages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Deals</h1>
        <p className="text-sm text-muted">
          {isLoading ? 'Loading…' : `${number(total)} matching ${total === 1 ? 'deal' : 'deals'}`}
        </p>
      </div>

      {/* Filters sit in one row above the table, never inside it. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          />
          <Input
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(0)
            }}
            placeholder="Search titles…"
            ariaLabel="Search deal titles"
            className="w-56 pl-8"
          />
        </div>
        <Input
          value={minProfit}
          onChange={(value) => {
            setMinProfit(value)
            setPage(0)
          }}
          type="number"
          placeholder="Min profit £"
          ariaLabel="Minimum profit"
          className="w-32"
        />
        <Select
          value={sort}
          onChange={(value) => {
            setSort(value)
            setPage(0)
          }}
          options={SORTS}
          ariaLabel="Sort by"
        />
        <label
          className="flex items-center gap-2 text-sm text-ink-2"
          title="Only deals already in profit at CeX's guaranteed cash price"
        >
          <Toggle
            checked={guaranteedOnly}
            onChange={(value) => {
              setGuaranteedOnly(value)
              setPage(0)
            }}
            label="Guaranteed profit only"
          />
          Guaranteed only
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <Toggle checked={includeScams} onChange={setIncludeScams} label="Show scam flags" />
          Show scam flags
        </label>
      </div>

      {isError && <ErrorNote error={error} />}

      <Card padded={false} className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-1 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table
              className={cn(
                'w-full min-w-[900px] text-sm transition-opacity',
                isPlaceholderData && 'opacity-60',
              )}
            >
              <thead>
                <tr className="border-b border-hairline text-xs text-muted">
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        'px-3 py-2.5 font-medium whitespace-nowrap',
                        column.key === 'item' && 'w-full',
                        column.align === 'right' ? 'text-right' : 'text-left',
                      )}
                    >
                      {column.sort ? (
                        <button
                          onClick={() => toggleSort(column.sort!)}
                          className={cn(
                            'inline-flex items-center gap-1 transition hover:text-ink',
                            sort === column.sort && 'text-ink',
                          )}
                        >
                          {column.label}
                          {sort === column.sort &&
                            (order === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {data.items.map((deal) => (
                  <DealRow key={deal.listing_id} deal={deal} onOpen={() => open(deal.listing_id)} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Tag size={22} />} title="No deals match these filters">
            Try loosening the filters, or lower the thresholds on the Settings page.
          </EmptyState>
        )}
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Page {page + 1} of {pages}
          </p>
          <div className="flex gap-2">
            <Button size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button size="sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {selected && <DealDetail id={selected} onClose={close} />}
    </div>
  )
}

function DealRow({ deal, onOpen }: { deal: Deal; onOpen: () => void }) {
  const listing = deal.listing

  return (
    <tr className="cursor-pointer transition hover:bg-surface-2" onClick={onOpen}>
      <td className="w-full max-w-0 px-3 py-2.5">
        <div className="flex items-center gap-2">
          {deal.is_scam_flag && <Badge tone="critical">flag</Badge>}
          {deal.floor_profit !== null && deal.floor_profit > 0 && (
            <Badge tone="good">
              <ShieldCheck size={10} />
              floor
            </Badge>
          )}
          <div className="min-w-0">
            <p className="truncate text-ink">{listing?.title ?? deal.listing_id}</p>
            <p className="truncate text-xs text-muted">
              {listing ? conditionLabel[listing.condition] : ''} · {deal.sell_channel} ·{' '}
              {relativeTime(deal.flagged_at)}
              {deal.est_days_to_sell ? ` · ~${deal.est_days_to_sell}d to sell` : ''}
            </p>
          </div>
        </div>
      </td>
      <td className="tabular px-3 py-2.5 text-right whitespace-nowrap text-ink-2">{money(deal.buy_cost)}</td>
      <td className="tabular px-3 py-2.5 text-right whitespace-nowrap text-ink-2">{money(deal.est_resale)}</td>
      <td className="tabular px-3 py-2.5 text-right font-medium whitespace-nowrap text-ink">
        {money(deal.est_profit)}
      </td>
      <td className="tabular px-3 py-2.5 text-right font-semibold whitespace-nowrap text-good-ink">
        {money(deal.expected_profit)}
      </td>
      <td className="tabular px-3 py-2.5 text-right whitespace-nowrap text-ink-2">{percent(deal.roi_pct)}</td>
      <td className="px-3 py-2.5">
        <ConfidenceMeter confidence={deal.confidence} />
      </td>
      <td className="px-3 py-2.5">
        <ScoreBadge score={deal.score} size="sm" />
      </td>
      <td className="px-3 py-2.5">
        {listing && (
          <a
            href={listing.url}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="text-muted transition hover:text-accent"
            title="Open the listing"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </td>
    </tr>
  )
}
