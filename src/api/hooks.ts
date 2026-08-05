import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'

import { api } from './client'
import type {
  DealDetail,
  DealPage,
  DealQuery,
  Health,
  Run,
  SettingsPayload,
  Stats,
  WatchQuery,
} from './types'

export const keys = {
  health: ['health'] as const,
  stats: (days: number) => ['stats', days] as const,
  deals: (query: DealQuery) => ['deals', query] as const,
  deal: (id: string) => ['deal', id] as const,
  runs: ['runs'] as const,
  watchlist: ['watchlist'] as const,
  settings: ['settings'] as const,
}

/** Health drives the "scan running" indicator, so it polls on a short cycle. */
export function useHealth() {
  return useQuery({
    queryKey: keys.health,
    queryFn: () => api.get<Health>('/api/health'),
    refetchInterval: 5000,
  })
}

export function useStats(days = 30) {
  return useQuery({
    queryKey: keys.stats(days),
    queryFn: () => api.get<Stats>('/api/stats', { days }),
  })
}

export function useDeals(query: DealQuery) {
  return useQuery({
    queryKey: keys.deals(query),
    queryFn: () => api.get<DealPage>('/api/deals', query),
    placeholderData: (previous) => previous, // keeps the table stable while filtering
  })
}

export function useDeal(id: string | null) {
  return useQuery({
    queryKey: keys.deal(id ?? ''),
    queryFn: () => api.get<DealDetail>(`/api/deals/${id}`),
    enabled: Boolean(id),
  } satisfies UseQueryOptions<DealDetail>)
}

export function useRuns(pollWhileRunning: boolean) {
  return useQuery({
    queryKey: keys.runs,
    queryFn: () => api.get<Run[]>('/api/runs', { limit: 25 }),
    // Only poll while something is actually in flight.
    refetchInterval: pollWhileRunning ? 3000 : false,
  })
}

export function useTriggerScan() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<Run>('/api/runs'),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: keys.runs })
      client.invalidateQueries({ queryKey: keys.health })
    },
  })
}

export function useWatchlist() {
  return useQuery({
    queryKey: keys.watchlist,
    queryFn: () => api.get<WatchQuery[]>('/api/watchlist'),
  })
}

export function useWatchlistMutations() {
  const client = useQueryClient()
  const invalidate = () => client.invalidateQueries({ queryKey: keys.watchlist })

  return {
    add: useMutation({
      mutationFn: (payload: Partial<WatchQuery> & { query: string }) =>
        api.post<WatchQuery>('/api/watchlist', payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, ...payload }: Partial<WatchQuery> & { id: number }) =>
        api.patch<WatchQuery>(`/api/watchlist/${id}`, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.del<void>(`/api/watchlist/${id}`),
      onSuccess: invalidate,
    }),
  }
}

export function useSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn: () => api.get<SettingsPayload>('/api/settings'),
  })
}

export function useSettingsMutations() {
  const client = useQueryClient()
  const invalidate = () => {
    client.invalidateQueries({ queryKey: keys.settings })
    // Thresholds change which listings qualify, so anything derived is stale.
    client.invalidateQueries({ queryKey: ['deals'] })
    client.invalidateQueries({ queryKey: ['stats'] })
  }

  return {
    save: useMutation({
      mutationFn: (values: Record<string, number | boolean>) =>
        api.patch<SettingsPayload>('/api/settings', values),
      onSuccess: invalidate,
    }),
    reset: useMutation({
      mutationFn: () => api.post<SettingsPayload>('/api/settings/reset'),
      onSuccess: invalidate,
    }),
  }
}
