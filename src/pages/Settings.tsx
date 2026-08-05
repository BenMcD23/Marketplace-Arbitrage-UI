import { RotateCcw, Save } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useSettings, useSettingsMutations } from '../api/hooks'
import {
  Button,
  Card,
  ErrorNote,
  Input,
  SectionHeading,
  Skeleton,
  Toggle,
} from '../components/ui'

interface Field {
  key: string
  label: string
  help: string
  step?: string
}

/**
 * Only the fields the backend whitelists as tunable appear here. Credentials
 * are deliberately not on that list — they stay in the environment and are
 * never readable or writable through the API.
 */
const GROUPS: { title: string; hint: string; fields: Field[] }[] = [
  {
    title: 'Deal thresholds',
    hint: 'What has to be true before a listing is flagged. Start strict, then loosen.',
    fields: [
      { key: 'min_profit', label: 'Minimum profit (£)', help: 'Headline profit at the estimated resale price.' },
      { key: 'min_roi', label: 'Minimum ROI (%)', help: 'Profit as a percentage of what you paid.' },
      {
        key: 'min_expected_profit',
        label: 'Minimum expected profit (£)',
        help: 'After weighting by the chance of selling and the cost of held capital.',
      },
      {
        key: 'min_confidence',
        label: 'Minimum confidence (0–1)',
        help: 'How well-evidenced the valuation must be. Raising this is the single best way to cut false positives.',
        step: '0.05',
      },
      { key: 'min_score', label: 'Minimum score (0–100)', help: 'The composite ranking floor.' },
      {
        key: 'tgtbt_ratio',
        label: 'Scam floor (0–1)',
        help: 'Below this fraction of the resale price, a listing is flagged as implausible rather than treated as a buy.',
        step: '0.05',
      },
    ],
  },
  {
    title: 'Valuation model',
    hint: 'How resale prices are estimated from comparable listings.',
    fields: [
      { key: 'min_comps', label: 'Minimum comps', help: 'Comparable listings needed to price anything at all.' },
      {
        key: 'min_sold_comps',
        label: 'Minimum observed sales',
        help: 'Recorded sales needed before they replace asking prices as the basis.',
      },
      {
        key: 'min_comp_relevance',
        label: 'Comp relevance floor (0–1)',
        help: 'How much of the listing title a comp must match. Higher means stricter matching and fewer, better comps.',
        step: '0.05',
      },
      {
        key: 'active_to_sold_ratio',
        label: 'Asking → sold ratio',
        help: 'Default discount from asking price to realistic sale price. Auto-calibrated once enough paired data exists.',
        step: '0.01',
      },
      {
        key: 'used_to_new_ratio',
        label: 'Used → new ratio',
        help: 'Default used price as a fraction of new. Also auto-calibrated from observed sales.',
        step: '0.01',
      },
      { key: 'sold_window_days', label: 'Sold look-back (days)', help: 'How far back observed sales stay relevant.' },
      {
        key: 'valuation_ttl_hours',
        label: 'Valuation cache (hours)',
        help: 'How long before a product is re-valued. Lower is fresher but costs more API calls.',
      },
    ],
  },
  {
    title: 'Liquidity & risk',
    hint: 'How the engine prices the chance that something does not sell quickly.',
    fields: [
      {
        key: 'base_sell_probability',
        label: 'Base sell probability (0–1)',
        help: 'Assumed chance of selling before any real data exists for a product.',
        step: '0.05',
      },
      {
        key: 'default_days_to_sell',
        label: 'Default days to sell',
        help: 'Assumed selling time before any observed velocity exists.',
      },
      {
        key: 'capital_annual_cost_pct',
        label: 'Cost of capital (%/yr)',
        help: 'What money tied up in stock costs you annually.',
      },
    ],
  },
  {
    title: 'Selling fees',
    hint: 'The engine is only as honest as these. Check them against a real payout.',
    fields: [
      { key: 'ebay_fvf_pct', label: 'eBay final value fee (%)', help: 'Charged on the total the buyer pays, postage included.' },
      { key: 'ebay_fixed_fee', label: 'eBay fixed fee (£)', help: 'Per-order fixed charge.' },
      { key: 'ebay_payment_pct', label: 'Payment processing (%)', help: 'Any extra processing percentage.' },
      { key: 'ebay_ad_rate_pct', label: 'Promoted listings (%)', help: 'Your ad rate, if you run promoted listings.' },
      { key: 'postage_cost', label: 'Postage out (£)', help: 'What it costs you to post an item.' },
      { key: 'packaging_cost', label: 'Packaging (£)', help: 'Packaging cost per item.' },
    ],
  },
  {
    title: 'Scanning',
    hint: 'How much of the free API budget each run is allowed to spend.',
    fields: [
      { key: 'ebay_limit', label: 'Listings per search', help: 'How many results each watched search pulls back.' },
      { key: 'comp_search_limit', label: 'Comps per valuation', help: 'How many comparable listings are fetched to price a product.' },
      {
        key: 'sold_sweep_max_checks',
        label: 'Ended-listing checks per run',
        help: 'How many watched comps are checked for having ended. One API call each — this is what builds the sold-price history.',
      },
      {
        key: 'comp_stale_hours',
        label: 'Stale after (hours)',
        help: 'How long a comp must be missing from search results before it is checked.',
      },
      { key: 'ebay_daily_call_limit', label: 'Daily API call limit', help: "eBay's free tier allows 5,000." },
    ],
  },
]

const BOOLEAN_FIELDS: Field[] = [
  {
    key: 'allow_for_parts',
    label: 'Allow "for parts / not working" listings',
    help: 'Off by default — parts listings describe a different market and are hard to value.',
  },
]

export function Settings() {
  const { data, isLoading, isError, error } = useSettings()
  const { save, reset } = useSettingsMutations()
  const [draft, setDraft] = useState<Record<string, string | boolean>>({})

  // Seed the form once the server values arrive, and after a reset.
  useEffect(() => {
    if (!data) return
    const seeded: Record<string, string | boolean> = {}
    for (const [key, value] of Object.entries(data.values)) {
      seeded[key] = typeof value === 'boolean' ? value : String(value)
    }
    setDraft(seeded)
  }, [data])

  const dirty =
    data &&
    Object.entries(draft).some(([key, value]) => {
      const original = data.values[key]
      if (typeof original === 'boolean') return value !== original
      return value !== String(original)
    })

  const submit = () => {
    if (!data) return
    const payload: Record<string, number | boolean> = {}
    for (const [key, value] of Object.entries(draft)) {
      const original = data.values[key]
      if (typeof original === 'boolean') {
        if (value !== original) payload[key] = Boolean(value)
      } else {
        const parsed = Number(value)
        if (!Number.isNaN(parsed) && value !== String(original)) payload[key] = parsed
      }
    }
    if (Object.keys(payload).length) save.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    )
  }

  if (isError) return <ErrorNote error={error} />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Settings</h1>
          <p className="text-sm text-muted">
            Changes apply immediately and persist. They affect how future scans are
            evaluated, not deals already recorded.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => reset.mutate()}
            disabled={reset.isPending}
            title="Revert everything to the values in the backend's .env"
          >
            <RotateCcw size={14} />
            Reset
          </Button>
          <Button variant="primary" onClick={submit} disabled={!dirty || save.isPending}>
            <Save size={14} />
            {save.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {save.isError && <ErrorNote error={save.error} />}

      {GROUPS.map((group) => (
        <Card key={group.title}>
          <SectionHeading title={group.title} hint={group.hint} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.fields.map((field) => (
              <label key={field.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-ink-2">{field.label}</span>
                <Input
                  type="number"
                  step={field.step ?? 'any'}
                  value={(draft[field.key] as string) ?? ''}
                  onChange={(value) => setDraft({ ...draft, [field.key]: value })}
                  ariaLabel={field.label}
                />
                <span className="text-xs text-muted">{field.help}</span>
              </label>
            ))}
          </div>
        </Card>
      ))}

      <Card>
        <SectionHeading title="Behaviour" hint="On/off switches." />
        {BOOLEAN_FIELDS.map((field) => (
          <div key={field.key} className="flex items-start gap-3">
            <div className="pt-0.5">
              <Toggle
                checked={Boolean(draft[field.key])}
                onChange={(checked) => setDraft({ ...draft, [field.key]: checked })}
                label={field.label}
              />
            </div>
            <div>
              <p className="text-sm text-ink">{field.label}</p>
              <p className="text-xs text-muted">{field.help}</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
