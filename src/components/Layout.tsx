import {
  Activity,
  AlertTriangle,
  Gauge,
  History,
  LayoutDashboard,
  Moon,
  Play,
  Search,
  Settings as SettingsIcon,
  Sun,
  Tag,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { useHealth, useTriggerScan } from '../api/hooks'
import { number } from '../lib/format'
import { cn } from '../lib/cn'
import { Button } from './ui'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/deals', label: 'Deals', icon: Tag },
  { to: '/watchlist', label: 'Watchlist', icon: Search },
  { to: '/runs', label: 'Runs', icon: History },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

type Theme = 'light' | 'dark'

function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  return [theme, setTheme]
}

function ThemeToggle() {
  const [theme, setTheme] = useTheme()
  return (
    <Button
      variant="ghost"
      size="sm"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </Button>
  )
}

/**
 * The API budget is the binding constraint on how much of the market can be
 * watched, so it is always on screen rather than buried in a settings page.
 */
function BudgetMeter() {
  const { data } = useHealth()
  if (!data) return null

  const used = data.api_calls_used
  const limit = data.daily_call_limit
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  return (
    <div className="hidden items-center gap-2 md:flex" title="eBay API calls used today">
      <span className="text-xs text-muted">API</span>
      <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
        <span
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            pct > 90 ? 'bg-critical' : 'bg-series-1',
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="tabular text-xs text-ink-2">
        {number(used)}/{number(limit)}
      </span>
    </div>
  )
}

function ScanButton() {
  const { data: health } = useHealth()
  const trigger = useTriggerScan()
  const running = health?.scan_running || trigger.isPending

  return (
    <Button
      variant="primary"
      size="sm"
      disabled={running || !health?.ebay_configured}
      onClick={() => trigger.mutate()}
      title={
        !health?.ebay_configured
          ? 'Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to enable scanning'
          : 'Scan every watched search now'
      }
    >
      {running ? (
        <>
          <Activity size={14} className="animate-spin-slow" />
          Scanning…
        </>
      ) : (
        <>
          <Play size={14} />
          Run scan
        </>
      )}
    </Button>
  )
}

/** A setup problem the user must fix before anything works at all. */
function ConfigBanner() {
  const { data } = useHealth()
  if (!data || data.ebay_configured) return null

  return (
    <div className="flex items-start gap-2 border-b border-warning/30 bg-warning/10 px-6 py-2.5 text-sm text-ink">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
      <p>
        No eBay credentials configured. Set <code className="text-xs">EBAY_CLIENT_ID</code> and{' '}
        <code className="text-xs">EBAY_CLIENT_SECRET</code> in the backend&apos;s{' '}
        <code className="text-xs">.env</code> — they are free from{' '}
        <a
          className="underline underline-offset-2"
          href="https://developer.ebay.com"
          target="_blank"
          rel="noreferrer"
        >
          developer.ebay.com
        </a>
        .
      </p>
    </div>
  )
}

export function Layout() {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-hairline bg-surface lg:min-h-screen lg:w-56 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2 px-5 py-4">
          <Gauge size={18} className="text-accent" />
          <span className="text-sm font-semibold tracking-tight text-ink">Arbitrage</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-hairline bg-surface px-6 py-3">
          <BudgetMeter />
          <ThemeToggle />
          <ScanButton />
        </header>
        <ConfigBanner />
        <main className="min-w-0 flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
