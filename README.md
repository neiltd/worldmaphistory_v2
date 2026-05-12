# World Intelligence — Geopolitical Intelligence Platform

A professional geopolitical intelligence platform for long-term investment research. Built with a Bloomberg/Palantir-style dark interface connecting countries, conflicts, infrastructure, energy systems, and financial asset exposure on an interactive world map.

**Live site:** https://neiltd.github.io/worldmaphistory_v2/

---

## Overview

World Intelligence is a static, client-side web application built for analysts and investors who need to understand the geopolitical landscape behind markets and economies. It provides dense, source-attributed intelligence across 214 countries, 1,500+ infrastructure data points, and 7 priority investment sectors.

### Use case

- Track active conflicts and their geographic footprint
- Visualize global trade route dependencies and chokepoint risk
- Map airport, seaport, power plant, rail hub, datacenter, and cable infrastructure
- Read multi-perspective geopolitical narratives for any country
- Analyze energy mix, food security, and AI adoption by country
- Connect geopolitical events to financial asset exposure (Semiconductors, Energy, Shipping, Defense, Banks, AI Infrastructure, Commodities)

---

## Features

### Map Layers (toggle via Layers button)

**Geopolitical**
- Active conflict markers — pulsing, intensity-coded (30 conflicts)
- Conflict zone polygons — geographic footprint overlays

**Economic**
- Trade routes — 19 major shipping/rail/pipeline corridors
- Strategic chokepoints — 18 maritime passages with hover details

**Infrastructure**
- Airports — 320 airports, plane icons, color by strategic importance
- Seaports — 264 ports, anchor icons, color by port type
- Power Plants — 397 facilities, bolt icons, size by capacity MW, color by fuel type
- Rail Hubs — 216 hubs, BRI indicator dot for Belt and Road nodes
- Submarine Cables — 12 cables as glowing lines, landing point markers
- Datacenters — 180 facilities, server icons, hyperscale vs colocation vs government

**Intelligence**
- Country Heatmap — color all 214 countries by any of 12 indicators (3 groups)

### Heatmap Indicators

| Group | Indicators |
|---|---|
| Geopolitical | Political Stability, Economic Direction, Investment Attractiveness, Geopolitical Risk, Education Quality, Healthcare Quality, Tech Investment |
| Energy | Renewable Energy %, Fossil Fuel % (inverted), Nuclear % |
| Food & Water | Food Security GFSI, Water Stress (inverted) |

### Country Intelligence Panel (7 tabs)

- **Overview** — summary, demographics, religion breakdown, alliance memberships
- **Indicators** — radar chart + 7 scored indicators with trend and confidence
- **Relations** — all bilateral relationships with type and sentiment
- **Perspectives** — competing narratives from multiple ideological viewpoints
- **History** — historical summary with key events timeline
- **Investment** — strengths, risks, key sectors, sources
- **Infrastructure** — country's airports, seaports, power plants, rail hubs, datacenters, energy mix, food security, AI readiness

### Search & UX
- **Fuse.js fuzzy search** — find any of 214 countries instantly
- **Compare mode** — overlay two countries on the radar chart
- **Escape key** — closes country panel or conflict card
- **Layer panel** — grouped layer toggles with SOON indicators for upcoming layers

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 19 + Vite 8 + TypeScript 6 |
| Map | react-map-gl 8 + MapLibre GL JS 5 |
| Tiles | CARTO Dark Matter (free, no API key) |
| State | Zustand 5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts 3 (radar chart) |
| Animation | Framer Motion 12 |
| Search | Fuse.js 7 |
| Validation | Zod 3 |
| Topology | topojson-client 3 |
| Deploy | GitHub Actions → GitHub Pages |

---

## Data

All data is static JSON — no backend, no runtime API calls. 1,510+ validated infrastructure records across 10 entity types, plus 214 country intelligence profiles.

### Infrastructure datasets (Gemini-researched, validated)

| Dataset | Records | Countries |
|---|---|---|
| Airports | 320 | 33 |
| Seaports | 264 | 37 |
| Power Plants | 412 | 33 |
| Rail Hubs | 216 | 27 |
| Datacenters | 180 | 18 |
| Submarine Cables | 12 | — |
| Utilities / Energy Mix | 34 | 34 |
| GDP Sector Composition | 34 | 34 |
| Food Security (GFSI) | 22 | 22 |
| AI Adoption | 16 | 16 |

### Geopolitical datasets (static)

| Dataset | Count |
|---|---|
| Country profiles | 214 |
| Active conflicts | 30 |
| Conflict zone polygons | 24 |
| Trade routes | 19 |
| Chokepoints | 18 |

---

## Architecture

### Layer system (`src/layers/`)

All map layers are organized by analytical domain. Each layer has a registered entry in `src/layers/_core/registry.ts` explaining *why* it matters geopolitically.

```
src/layers/
  _core/           registry.ts, types.ts
  geopolitical/    ConflictZoneLayer
  economic/        TradeRouteLayer
  infrastructure/  AirportLayer, PortLayer, RailHubLayer,
                   SubmarineCableLayer, DatacenterLayer
  utilities/       PowerLayer
  intelligence/    (types — NewsArticle, IntelligenceEvent)
  investment/      (types — CompanyProfile, InvestmentThesis, EvidenceChain)
```

### Data pipeline (`src/data/schemas/`, `scripts/`)

```bash
# Generate Gemini research prompts
npm run generate:prompts          # geopolitical/infrastructure data
npm run generate:company-prompts  # company intelligence profiles

# Validate Gemini output
npm run validate:data             # all types
npm run validate:data -- --type airports  # single type

# Import validated records
npm run import:data
```

### Asset Intelligence system (`src/layers/investment/`)

7 TypeScript schemas modelling the pipeline:
> Geopolitical Event → Infrastructure Exposure → Company Exposure → Market Impact → Investment Thesis → Evidence Chain

Pre-populated sector profiles for: Semiconductors, Energy, Shipping, AI Infrastructure, Defense, Banks, Commodities.

Full documentation: `docs/ASSET_INTELLIGENCE_SYSTEM.md`  
Data pipeline documentation: `docs/DATA_PIPELINE.md`  
Layer architecture: `docs/ARCHITECTURE.md`

---

## Project Structure

```
src/
├── components/
│   ├── Map/WorldMap.tsx            # Main map — MapLibre, country fills, all layers
│   ├── Panel/
│   │   ├── CountryPanel.tsx        # 7-tab intelligence panel (incl. Infrastructure tab)
│   │   └── ConflictCard.tsx        # Floating conflict detail card
│   └── UI/
│       ├── SearchBar.tsx           # Fuse.js search
│       ├── HeatmapSelector.tsx     # Grouped heatmap dropdown
│       ├── LayerToggle.tsx         # Full layer registry panel
│       └── ScoreBar.tsx            # Indicator score bar
├── data/
│   ├── countries/                  # 214 × [ISO3].json
│   ├── validated/                  # 10 × validated infrastructure datasets
│   ├── raw/                        # Gemini output (pre-validation)
│   ├── schemas/                    # Zod validation schemas (10 entity types)
│   ├── config/
│   │   ├── data-generation-targets.json   # 36 country/region targets
│   │   └── company-targets.json           # 35 companies × 7 sectors
│   └── templates/                  # JSON templates for Gemini
├── layers/                         # All map layer components (see Architecture)
├── store/useMapStore.ts            # Zustand global state
├── utils/geoUtils.ts               # Antimeridian-safe geometry utilities
├── scripts/                        # Data pipeline CLI tools
└── prompts/                        # Generated Gemini research prompts
    ├── generated/                  # Ready-to-paste prompts (264 + 8 company)
    └── templates/                  # Prompt templates with {{variables}}
```

---

## Getting Started

### Install

```bash
git clone https://github.com/neiltd/worldmaphistory_v2.git
cd worldmaphistory_v2
npm install --legacy-peer-deps
```

### Run locally

```bash
npm run dev
# Open http://localhost:5173/worldmaphistory_v2/
```

### Build

```bash
npm run build
```

### Deploy

```bash
git add . && git commit -m "message" && git push
# GitHub Actions deploys to GitHub Pages in ~60 seconds
```

---

## Workflow

| Tool | Role |
|---|---|
| **Claude Code** | Developer — architecture, components, data pipeline, validation |
| **Gemini** | Researcher — generates sourced JSON from structured prompts |

### Adding new country data
Drop a `[ISO3].json` into `src/data/countries/` — no code changes needed.

### Adding new infrastructure data
1. `npm run generate:prompts -- --target [COUNTRY]`
2. Paste generated prompt into Gemini
3. Save output to `src/data/raw/[type]/[target].raw.json`
4. `npm run validate:data && npm run import:data`

---

## Roadmap

### In Progress
- [ ] Company profile validation (8 raw files from Gemini)
- [ ] Wire company profiles to investment intelligence layer

### Next
- [ ] Investment screening view — 214 countries sortable by indicator
- [ ] Risk-opportunity matrix — scatter plot (risk vs attractiveness)
- [ ] Watchlist — pin countries to monitor (localStorage)
- [ ] News intelligence pipeline — event → exposure → thesis

### Later
- [ ] Thai SET stock integration
- [ ] Mobile layout
- [ ] Export country profile as PDF
