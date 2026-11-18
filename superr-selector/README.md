# SupeRR Selector – Season 2

Frontend for a competition project that identifies the most reliable IPL and T20I batters and bowlers under pressure, using ball-by-ball data.

**Status: demo mode by default.** All players, teams and figures are synthetic. Nothing shown is a verified result, and the pressure index and rating formulas are unvalidated research choices (see the Methodology page).

Stack: React 19, Vite, JavaScript, Tailwind CSS 4, Recharts, Framer Motion, Lucide React, React Router, Axios.

## Setup

```bash
npm install
cp .env.example .env     # optional
npm run dev              # http://localhost:5173
npm run build            # production build into dist/
npm run preview          # serve the build
npm run lint
```

## Pages

Overview, Batting Analytics, Bowling Analytics, Player Rankings (two top-10 boards, podium, CSV export), Player Comparison (bars, radar, table), Pressure Analysis (configurable index, first/second innings), Methodology.
Global filters (competition, season, dates), global search (press `/`), a profile drawer from any player, loading/empty/error states, and a demo-only "Simulate API error" switch.

## Project structure

```
src/
  components/
    layout/   AppShell, Sidebar, Topbar, Breadcrumb, GlobalSearch, FilterBar, DemoBanner
    cards/    KpiCard, StatTile
    charts/   ChartContainer, chart components, theme, tooltip
    tables/   DataTable, TableToolbar, PlayerTablePage, Leaderboard, playerColumns
    profile/  ProfileDrawer
    ui/       Badge, Tabs, Controls, Tooltip, Skeleton, States, AsyncView, PageHeader
  context/    Filter, Profile, Toast, Demo providers
  data/       DEMO ONLY: synthetic generator and mockService
  hooks/      useApi, useDebouncedValue, useLocalStorage, useEscapeKey
  pages/      one file per route
  services/   api.js (switch), apiClient.js (Axios), httpApi.js (backend), contracts.js (data shapes)
  styles/     Tailwind theme tokens
  utils/      stats, pressure, csv, format, math
```

## Demo mode

`VITE_DEMO_MODE` (default `true`) selects the data source in `src/services/api.js`.
- `true`: `src/data/mockService.js` computes every response from seeded synthetic records. Every response carries `meta.isDemo = true`, which drives the demo banner, "Demo ranking" labels and a note in exported CSVs.
- `false`: `src/services/httpApi.js` calls the backend. Banner and labels disappear unless the backend returns `meta.isDemo = true`.

In demo mode the player data tags "pressure" balls by innings position, not by the Pressure Index, so the Pressure Analysis settings do not re-rate players. A real backend should tag pressure balls with the index.

## Backend integration (FastAPI)

1. Set `VITE_DEMO_MODE=false` and `VITE_API_BASE_URL=http://localhost:8000/api/v1`.
2. Enable CORS for the dev origin.
3. Implement the endpoints below. Response shapes are documented in `src/services/contracts.js`.

| Endpoint | Query |
|---|---|
| `GET /filters` | |
| `GET /players` | |
| `GET /overview` | `competition, season, date_from, date_to` |
| `GET /batting`, `GET /bowling` | same filters |
| `GET /rankings/{batting\|bowling}` | filters + `min_pressure_balls, confidence` |
| `GET /players/{type}/{id}` | filters |
| `GET /comparison/{type}` | filters + `a, b` |
| `GET /pressure/bins` | `competition` |
| `GET /methodology` | |

Every response needs a `meta` object: `{ isDemo, source, generatedAt, notice? }`. To replace the demo data, only `src/services` needs a real backend. The UI does not change.
