# Marketplace Arbitrage — dashboard

React front end for [Marketplace-Arbitrage](https://github.com/BenMcD23/Marketplace-Arbitrage):
browse the deals the scanner found, see exactly how each one was valued, manage
the searches it runs, and tune the thresholds without a redeploy.

```
Vite · React 19 · TypeScript · Tailwind v4 · TanStack Query · Recharts
```

## Running it

The backend must be up first — it serves all the data.

```bash
# 1. terminal one: the API
cd ../Marketplace-Arbitrage
uv run arb serve                  # http://127.0.0.1:8000

# 2. terminal two: this app
npm install
npm run dev                       # http://localhost:5173
```

Vite proxies `/api` through to `127.0.0.1:8000`, so the app only ever uses
same-origin relative URLs. Point it somewhere else with `VITE_API_TARGET`:

```bash
VITE_API_TARGET=http://192.168.1.20:8000 npm run dev
```

For a production build, `npm run build` emits a static `dist/` — serve it behind
the same host as the API and no CORS configuration is needed. If you serve it
from a different origin, add that origin to `API_CORS_ORIGINS` in the backend's
`.env`.

## The pages

| Page | What it is for |
|---|---|
| **Overview** | Headline figures, deals and expected profit per day, and how much of its own sold-price history the system has accumulated. |
| **Deals** | Every flagged listing, sorted by score. Click a row for the full justification. |
| **Watchlist** | The searches the scanner runs. This is the highest-leverage control in the system. |
| **Runs** | Scan history — what each run scanned, valued, found and spent. |
| **Settings** | Live-tunable thresholds, fee rates and model parameters. |

## The deal detail panel

The point of the whole UI. For any deal it shows:

- **The money** — buy price, every fee line itemised, profit, ROI, margin, and
  the break-even buy price.
- **The risk** — chance of selling, expected days to sell, cost of the capital
  tied up, and what the profit becomes if the item sells at the pessimistic end
  of its range.
- **The guaranteed floor** — where CeX will buy the item, the cash they'll pay
  and the profit that locks in. Deals already in profit at that price carry a
  `floor` badge in the table and a banner in the panel, because they don't
  depend on any prediction being right. Filter the list to just those with
  **Guaranteed only**.
- **How it was valued** — whether the price came from observed sales or from
  discounted asking prices, the comps that set it, how much they disagreed, and
  a count of what was thrown out and why (accessories, wrong capacity, wrong
  product).

A deal you cannot audit is a deal you should not act on, so nothing the pipeline
did is hidden behind a single number.

## Conventions worth knowing

- **Deals sort by score, not profit.** A £900 paper profit from four disagreeing
  comps is not a better lead than a well-evidenced £120, and the default
  ordering does not pretend otherwise.
- **Colour never carries meaning alone.** Scores and confidence always show
  their number next to the bar, so the UI stays readable with colour-vision
  deficiency and in forced-colours mode.
- **The charts do not share an axis.** Deal counts and pounds are two different
  scales, so they are two charts — a dual-axis plot would imply a correlation
  the data never showed. Days with no deals are drawn as zeroes rather than
  skipped, so a quiet week looks quiet.
- **Light and dark are both designed.** The dark palette is the same hues
  re-stepped for the dark surface and validated for contrast and colour-vision
  separation against it — not an automatic inversion.

## Layout

```
src/
  api/          client, typed schemas mirroring the backend, TanStack Query hooks
  components/   layout shell, shared primitives, charts, the deal detail panel
  pages/        one file per route
  lib/          formatting helpers
```
