import { Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { useWatchlist, useWatchlistMutations } from '../api/hooks'
import {
  Button,
  Card,
  EmptyState,
  ErrorNote,
  Input,
  Skeleton,
  Toggle,
} from '../components/ui'
import { money, relativeTime } from '../lib/format'

/**
 * The watch list is the highest-leverage control in the system: change what you
 * search for and everything downstream changes with it. It lives in the
 * database rather than in `.env` precisely so it can be edited here.
 */
export function Watchlist() {
  const { data, isLoading, isError, error } = useWatchlist()
  const { add, update, remove } = useWatchlistMutations()

  const [query, setQuery] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const submit = () => {
    const term = query.trim()
    if (!term) return
    add.mutate(
      {
        query: term,
        max_price: maxPrice ? Number(maxPrice) : null,
        category_id: categoryId.trim() || null,
      },
      {
        onSuccess: () => {
          setQuery('')
          setMaxPrice('')
          setCategoryId('')
        },
      },
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Watchlist</h1>
        <p className="text-sm text-muted">
          Every enabled search is scanned on each run. Each one costs roughly one API call
          per scan, plus one per product valued.
        </p>
      </div>

      <Card>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-2">Search term</span>
            <Input
              value={query}
              onChange={setQuery}
              placeholder="e.g. sony wh-1000xm4"
              ariaLabel="Search term"
              className="w-64"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-2">Max buy price</span>
            <Input
              value={maxPrice}
              onChange={setMaxPrice}
              type="number"
              placeholder="optional"
              ariaLabel="Max buy price"
              className="w-32"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-2">Category id</span>
            <Input
              value={categoryId}
              onChange={setCategoryId}
              placeholder="optional"
              ariaLabel="eBay category id"
              className="w-32"
            />
          </label>
          <Button type="submit" variant="primary" disabled={!query.trim() || add.isPending}>
            <Plus size={15} />
            Add search
          </Button>
        </form>
        {add.isError && (
          <div className="mt-3">
            <ErrorNote error={add.error} />
          </div>
        )}
      </Card>

      {isError && <ErrorNote error={error} />}

      <Card padded={false}>
        {isLoading ? (
          <div className="space-y-1 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <ul className="divide-y divide-hairline">
            {data.map((watch) => (
              <li key={watch.id} className="flex items-center gap-4 px-4 py-3">
                <Toggle
                  checked={watch.enabled}
                  onChange={(enabled) => update.mutate({ id: watch.id!, enabled })}
                  label={`Enable ${watch.query}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{watch.query}</p>
                  <p className="text-xs text-muted">
                    {watch.max_price ? `up to ${money(watch.max_price)}` : 'any price'}
                    {watch.category_id ? ` · category ${watch.category_id}` : ''}
                    {' · last run '}
                    {relativeTime(watch.last_run_at)}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  title="Remove this search"
                  onClick={() => remove.mutate(watch.id!)}
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<Search size={22} />} title="No searches yet">
            Add a search above — start narrow and specific (&quot;sony wh-1000xm4&quot;
            beats &quot;headphones&quot;), because a vague term returns comps that are
            harder to value.
          </EmptyState>
        )}
      </Card>
    </div>
  )
}
