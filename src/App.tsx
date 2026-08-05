import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Deals } from './pages/Deals'
import { Runs } from './pages/Runs'
import { Settings } from './pages/Settings'
import { Watchlist } from './pages/Watchlist'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="deals" element={<Deals />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="runs" element={<Runs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
