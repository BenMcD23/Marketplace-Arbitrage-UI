import { ExternalLink, X } from 'lucide-react'

import { useDeal } from '../api/hooks'
import type { CompRef, DealDetail as DealDetailData, FeeBreakdown, Valuation } from '../api/types'
import {
  basisHelp,
  basisLabel,
  conditionLabel,
  money,
  number,
  percent,
  ratioPercent,
  rejectLabel,
} from '../lib/format'
import { ConfidenceMeter, ScoreBadge } from './StatTile'
import { cn } from '../lib/cn'
import { Badge, Button, ErrorNote, Skeleton } from './ui'

/**
 * The panel that answers "why is this a deal, and what could go wrong".
 *
 * Every number the engine produced is traceable here: which comps set the
 * resale price, which were thrown out and why, where the fees went, and what
 * happens if the item sells at the pessimistic end of its range. A deal you
 * cannot audit is a deal you should not act on.
 */
export function DealDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: deal, isLoading, isError, error } = useDeal(id)

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close details"
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-hairline bg-surface shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-hairline bg-surface px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink">
              {deal?.listing?.title ?? 'Deal'}
            </h2>
            {deal?.listing && (
              <p className="mt-0.5 text-xs text-muted">
                {conditionLabel[deal.listing.condition]}
                {deal.listing.location ? ` · ${deal.listing.location}` : ''}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </header>

        <div className="space-y-6 px-5 py-5">
          {isLoading && <Skeleton className="h-64" />}
          {isError && <ErrorNote error={error} />}

          {deal && (
            <>
              {deal.is_scam_flag && (
                <div className="rounded-lg border border-critical/25 bg-critical/10 px-3 py-2.5 text-sm text-critical">
                  <strong className="font-semibold">Flagged as implausible.</strong> This is
                  priced far below what the item is worth, which usually means a scam, a
                  mis-listing, or something not as described.
                </div>
              )}

              <Headline deal={deal} />

              {deal.floor_profit !== null && deal.floor_profit > 0 && (
                <div className="rounded-lg border border-good/25 bg-good/10 px-3 py-2.5 text-sm">
                  <p className="font-semibold text-good-ink">
                    Guaranteed profit of {money(deal.floor_profit)}
                  </p>
                  <p className="mt-0.5 text-ink-2">
                    CeX will pay {money(deal.valuation?.cex_cash_price)} cash for this
                    {deal.valuation?.cex_match ? ` (${deal.valuation.cex_match})` : ''}. You
                    clear that much without it having to sell on {deal.sell_channel} at all —
                    everything above is upside.
                  </p>
                </div>
              )}

              <Section title="The money">
                <Row label="Buy price" value={money(deal.listing?.price)} />
                <Row label="Postage in" value={money(deal.listing?.shipping)} />
                <Row label="Total cost" value={money(deal.buy_cost)} strong />
                <Divider />
                <Row label="Estimated resale" value={money(deal.est_resale)} />
                {deal.fee_breakdown && <FeeLines fees={deal.fee_breakdown} />}
                <Divider />
                <Row label="Profit" value={money(deal.est_profit)} strong tone="good" />
                <Row label="ROI" value={percent(deal.roi_pct, 1)} />
                <Row label="Margin" value={percent(deal.margin_pct, 1)} />
                {deal.breakeven_buy_price !== null && (
                  <Row
                    label="Break-even buy price"
                    value={money(deal.breakeven_buy_price)}
                    hint="the most you could pay and still not lose"
                  />
                )}
              </Section>

              <Section title="The risk">
                <Row
                  label="Chance of selling"
                  value={ratioPercent(deal.p_sale)}
                  hint="from observed sell-through, shrunk towards the base rate"
                />
                <Row
                  label="Expected days to sell"
                  value={deal.est_days_to_sell ? `${deal.est_days_to_sell} days` : '—'}
                />
                <Row label="Cost of held capital" value={money(deal.holding_cost)} />
                <Divider />
                <Row
                  label="Expected profit"
                  value={money(deal.expected_profit)}
                  strong
                  tone="good"
                  hint="what to rank on — profit weighted by the chance of selling"
                />
                {deal.floor_profit !== null && (
                  <Row
                    label="Guaranteed floor (CeX cash)"
                    value={money(deal.floor_profit)}
                    tone={deal.floor_profit > 0 ? 'good' : 'bad'}
                    hint="not an estimate — what CeX will pay you today"
                  />
                )}
                <Row
                  label="If it sells badly"
                  value={money(deal.worst_case_profit)}
                  tone={deal.worst_case_profit < 0 ? 'bad' : undefined}
                  hint={
                    deal.floor_profit !== null && deal.floor_profit > deal.worst_case_profit
                      ? 'the better of the pessimistic resale and the CeX floor'
                      : 'profit at the pessimistic end of the resale range'
                  }
                />
              </Section>

              {deal.valuation && <ValuationPanel valuation={deal.valuation} />}

              <Section title="In plain English">
                <ul className="space-y-2">
                  {deal.reasons.map((reason, index) => (
                    <li key={index} className="flex gap-2 text-sm text-ink-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </Section>

              {deal.listing && (
                <a
                  href={deal.listing.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  View on {deal.listing.source}
                  <ExternalLink size={14} />
                </a>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

function Headline({ deal }: { deal: DealDetailData }) {
  return (
    <div className="grid grid-cols-3 gap-3 rounded-xl border border-hairline bg-surface-2 p-4">
      <div>
        <p className="text-xs text-muted">Expected profit</p>
        <p className="mt-1 text-xl font-semibold text-good-ink">{money(deal.expected_profit)}</p>
      </div>
      <div>
        <p className="text-xs text-muted">Score</p>
        <div className="mt-2">
          <ScoreBadge score={deal.score} />
        </div>
      </div>
      <div>
        <p className="text-xs text-muted">Confidence</p>
        <div className="mt-2">
          <ConfidenceMeter confidence={deal.confidence} />
        </div>
      </div>
    </div>
  )
}

function ValuationPanel({ valuation }: { valuation: Valuation }) {
  // `note:` entries are internal breadcrumbs about which pricing path ran, not
  // reasons a comp was thrown out.
  const rejects = Object.entries(valuation.reject_reasons).filter(
    ([key]) => !key.startsWith('note:'),
  )

  return (
    <Section title="How it was valued">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone={valuation.basis === 'sold' ? 'good' : 'accent'}>
          {basisLabel[valuation.basis]}
        </Badge>
        <span className="text-xs text-muted">{basisHelp[valuation.basis]}</span>
      </div>

      <Row label="Comps used" value={number(valuation.comp_count)} />
      <Row
        label="Realistic range"
        value={
          valuation.price_p10 && valuation.price_p90
            ? `${money(valuation.price_p10)} – ${money(valuation.price_p90)}`
            : '—'
        }
      />
      <Row
        label="Comp disagreement"
        value={percent(valuation.dispersion_cv * 100)}
        hint={valuation.dispersion_cv > 0.3 ? 'high — the estimate is soft' : undefined}
      />
      {valuation.sell_through_pct !== null && (
        <Row label="Sell-through" value={percent(valuation.sell_through_pct, 1)} />
      )}
      {valuation.cex_sell_price !== null && (
        <>
          <Row
            label="CeX sells it for"
            value={money(valuation.cex_sell_price)}
            hint={valuation.cex_match ?? undefined}
          />
          <Row label="CeX pays you" value={money(valuation.cex_cash_price)} />
        </>
      )}

      {valuation.sample?.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-ink-2">Comparable listings used</p>
          <ul className="space-y-1.5">
            {valuation.sample.map((comp: CompRef, index: number) => (
              <li key={index} className="flex items-center gap-2 text-xs">
                <span className="tabular w-16 shrink-0 font-medium text-ink">
                  {money(comp.price)}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted">{comp.title}</span>
                {comp.sold && <Badge tone="good">sold</Badge>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rejects.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-ink-2">
            Discarded before pricing ({number(valuation.comps_rejected)})
          </p>
          <ul className="space-y-1">
            {rejects.map(([reason, count]) => (
              <li key={reason} className="flex justify-between text-xs text-muted">
                <span>{rejectLabel[reason] ?? reason}</span>
                <span className="tabular">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  )
}

function FeeLines({ fees }: { fees: FeeBreakdown }) {
  const LINES: [keyof FeeBreakdown, string][] = [
    ['final_value_fee', 'Final value fee'],
    ['fixed_fee', 'Fixed order fee'],
    ['payment_fee', 'Payment processing'],
    ['ad_fee', 'Promoted listing'],
    ['referral_fee', 'Referral fee'],
    ['fulfilment_fee', 'Fulfilment'],
    ['postage', 'Postage out'],
    ['packaging', 'Packaging'],
  ]
  return (
    <>
      {LINES.filter(([key]) => fees[key] > 0).map(([key, label]) => (
        <Row key={key} label={label} value={`− ${money(fees[key])}`} muted />
      ))}
      <Row label="Total costs" value={`− ${money(fees.total)}`} />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h3>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

function Row({
  label,
  value,
  hint,
  strong,
  muted,
  tone,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  strong?: boolean
  muted?: boolean
  tone?: 'good' | 'bad'
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <div className="min-w-0">
        <span className={cn('text-sm', muted ? 'text-muted' : 'text-ink-2')}>{label}</span>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <span
        className={cn(
          'tabular shrink-0 text-sm',
          strong ? 'font-semibold' : '',
          tone === 'good' ? 'text-good-ink' : tone === 'bad' ? 'text-critical' : 'text-ink',
        )}
      >
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="my-1.5 border-t border-hairline" />
}
