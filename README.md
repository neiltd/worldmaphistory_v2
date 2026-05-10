# World Intelligence — Geopolitical Intelligence Platform

A professional geopolitical intelligence platform for long-term investment research. Visualizes country risk, active conflicts, global trade routes, and multi-perspective geopolitical analysis on an interactive world map.

**Live site:** https://neiltd.github.io/worldmaphistory_v2/

---

## Overview

World Intelligence is a static, client-side web application built for analysts and investors who need to understand the geopolitical landscape behind markets and economies. It provides a dense, Bloomberg/Palantir-style intelligence interface with real data on 214 countries, 30 active conflicts, 19 trade routes, and 18 strategic chokepoints.

### Use case

- Compare country risk and opportunity across regions
- Track active conflicts and their international dimensions
- Visualize global trade route dependencies and chokepoint risk
- Read multi-perspective narratives on any country (avoiding single-source bias)
- Build investment theses informed by geopolitical context

---

## Features

### Map
- **Vector tile map** via MapLibre GL JS + CARTO Dark Matter (no API key required)
- **Antimeridian-safe rendering** — all geometries normalized to prevent diagonal artifacts
- **Country fills** — color-coded by selection, relationships, or heatmap indicator
- **Conflict zone polygons** — translucent overlays showing active conflict areas
- **Conflict markers** — pulsing intensity-coded dots for 30 active conflicts
- **Trade routes** — 19 major shipping/rail/pipeline routes with volume styling
- **Chokepoints** — 18 strategic maritime chokepoints with hover tooltips

### Search
- **Fuse.js fuzzy search** — find any of 214 countries instantly with flag + region preview

### Heatmap Mode
- Color all 214 countries by any of 7 indicators:
  Political Stability · Economic Direction · Investment Attractiveness · Geopolitical Risk · Education Quality · Healthcare Quality · Technology Investment

### Country Intelligence Panel
- **Overview** — summary, demographics, religion breakdown, alliance memberships
- **Indicators** — radar chart + 7 scored indicators with trend and confidence
- **Relations** — all bilateral relationships with type and sentiment
- **Perspectives** — competing narratives from multiple ideological viewpoints
- **History** — historical summary with key events timeline
- **Investment** — strengths, risks, key sectors, and sources
- **Compare mode** — overlay any two countries on the radar chart

### Conflict Card
- Intensity, status, type, parties, current situation, casualties, international involvement

---

## Tech Stack

| Concern | Library / Version |
|---|---|
| Framework | React 19 + Vite 8 + TypeScript 6 |
| Map | react-map-gl 8 + MapLibre GL JS 5 |
| Tiles | CARTO Dark Matter (free, no API key) |
| State | Zustand 5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 3 |
| Animation | Framer Motion 12 |
| Search | Fuse.js 7 |
| Topology | topojson-client 3 |
| Deploy | GitHub Actions → GitHub Pages |

---

## Data

All data is static JSON — no backend, no API calls at runtime.

| Dataset | Count | Location |
|---|---|---|
| Country profiles | 214 | `src/data/countries/[ISO3].json` |
| Active conflicts | 30 | `src/data/conflicts.json` |
| Conflict zone polygons | 24 | `src/data/conflict-zones.json` |
| Trade routes | 19 | `src/data/trade-routes.json` |
| Chokepoints | 18 | `src/data/trade-routes.json` |
| Indicators index | 214 × 7 indicators | `src/data/indicators-index.json` |
| Country search index | 214 | `src/data/country-index.json` |

### Country profile schema

Each `[ISO3].json` contains:

```ts
{
  id: string                    // ISO 3166-1 alpha-3
  iso2: string
  name: string
  region: string
  subregion: string
  capital: string
  lastUpdated: string
  summary: string
  indicators: {
    [key]: { score: number, trend: string, confidence: string, note: string }
  }
  demographics: {
    population: number
    medianAge: number
    urbanizationRate: number
    religions: { name: string, percent: number }[]
  }
  alliances: string[]
  relationships: { countryId, countryName, type, sentiment, summary }[]
  perspectives: { source, bias, view }[]
  historicalContext: { summary, keyEvents: { year, event }[] }
  investmentNotes: { strengths, risks, sectors }
  sources: { name, url }[]
}
```

### Generating data with Gemini

Country profiles, conflicts, and trade routes are generated using Gemini with the schemas above.

Key instruction for country profiles:
> "Use the schema in `src/types/country.ts`. Include at least 4 competing perspectives from different ideological viewpoints. Return JSON only, no explanation."

---

## Project Structure

```
src/
├── components/
│   ├── Map/
│   │   ├── WorldMap.tsx          # Main map — MapLibre, country fills, events
│   │   ├── ConflictZoneLayer.tsx # Zone polygons + pulsing conflict markers
│   │   └── TradeRouteLayer.tsx   # Route lines + chokepoint markers + tooltips
│   ├── Panel/
│   │   ├── CountryPanel.tsx      # 6-tab intelligence panel
│   │   └── ConflictCard.tsx      # Floating conflict detail card
│   └── UI/
│       ├── SearchBar.tsx         # Fuse.js country search
│       ├── HeatmapSelector.tsx   # Indicator dropdown
│       ├── LayerToggle.tsx       # Layer visibility toggles
│       └── ScoreBar.tsx          # Indicator score bar component
├── data/
│   ├── countries/                # 214 × [ISO3].json
│   ├── conflicts.json
│   ├── conflict-zones.json
│   ├── trade-routes.json
│   ├── country-index.json
│   └── indicators-index.json
├── store/
│   └── useMapStore.ts            # Zustand global state
├── types/
│   ├── country.ts
│   ├── conflict.ts
│   └── traderoute.ts
├── utils/
│   └── geoUtils.ts               # Antimeridian-safe geometry utilities
└── App.tsx
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Install

```bash
git clone https://github.com/neiltd/worldmaphistory_v2.git
cd worldmaphistory_v2
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required due to a peer dependency conflict in `react-simple-maps` with React 19.

### Run locally

```bash
npm run dev
```

Open `http://localhost:5173/worldmaphistory_v2/`

### Build

```bash
npm run build
```

---

## Deployment

Push to `main` — GitHub Actions automatically builds and deploys to GitHub Pages in ~60 seconds.

```bash
git add .
git commit -m "your message"
git push
```

Live at: https://neiltd.github.io/worldmaphistory_v2/

---

## Workflow

This project uses a two-tool workflow:

| Tool | Role |
|---|---|
| **Claude Code** | Developer — all code, components, bug fixes |
| **Gemini** | Data researcher — generates JSON profiles from schemas |

New country data can be added without any code changes — drop a `[ISO3].json` file into `src/data/countries/`. The store lazy-imports by country ID on click.

---

## Roadmap

### Tier 2 — Core Features
- [ ] Mobile layout (bottom-sheet drawer, touch zoom)

### Tier 3 — Live Intelligence
- [ ] News feed tab per country (RSS — Reuters / BBC / Al Jazeera)
- [ ] URL news agent — paste article → highlights related countries on map
- [ ] Watchlist — save countries to monitor (localStorage)

### Tier 4 — Investment Analysis
- [ ] Investment screening table — all 214 countries sortable by indicator score
- [ ] Risk-opportunity matrix — scatter plot (geopolitical risk vs attractiveness)
- [ ] Historical timeline scrubber
- [ ] Export country profile as PDF
