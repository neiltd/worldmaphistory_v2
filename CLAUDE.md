# World Intelligence — Claude Code Working Guide

This file is auto-loaded by Claude Code at session start.
For the full architecture document see `ARCHITECTURE.md`.

---

## What this repo is

A static React + MapLibre frontend that visualizes geopolitical intelligence.
It is a **read-only consumer** of data — it does not own any ingestion pipeline.

**Live site:** https://neiltd.github.io/worldmaphistory_v2/
**Local dev:** `npm run dev` (opens on `/worldmaphistory_v2/`)
**Deploy:** `git push` → GitHub Actions → GitHub Pages in ~60s

---

## Current phase — intelligence usefulness (rendering work is closed)

**Rendering foundation is stable and complete as of 2026-05-14. Do not reopen it.**

Do NOT initiate any of the following without explicit instruction:
- PMTiles migration
- Render registry implementation
- Advanced clustering systems
- Additional GPU migration (the ~48 remaining Markers are accepted as-is)
- Major layer architecture redesigns

**Next work priority order** (wait for semantic data readiness before starting):
1. Zoom-aware filter activation — uncomment filter expressions in layer files when `strategicImportance` data from Gemini is validated and imported
2. Lightweight thematic analyst workflows — `themes[]` already tagged in registry; one store field + one UI change
3. Intelligence event display improvements — when hub provides coordinates
4. Investment screening table — `indicators-index.json` is ready; needs UI only
5. Company profile UI — after company validation pipeline passes

**Current semantic data gap** (blocks items 1–2):
- Power plants: 0/412 records have `strategicImportance` — awaiting Gemini classification
- Datacenters: 0/180 records have `strategicImportance` — awaiting Gemini classification
- Submarine cables: 0/12 records have `strategicImportance` — awaiting Gemini classification

---

## Hard rules

**Before every commit:** run `npm run build` locally.
The CI build uses `tsc -b` which enforces `noUnusedLocals`. A passing `tsc --noEmit` does not guarantee a passing build. Unused imports fail CI.

**No API clients in this repo.** This project never calls ACLED, EIA, NewsAPI, GDELT, or World Bank directly. If asked to add one, redirect to the Hub project.

**No credentials in this repo.** `.env` is gitignored. `.env.example` documents that no credentials are needed here.

**Architecture wins over Gemini output.** When Gemini generates data or schema ideas that conflict with existing contracts, adapt the Gemini output — never weaken the Zod schema.

---

## Repo boundary (see ARCHITECTURE.md for full details)

| This repo owns | Hub owns |
|---|---|
| Static geospatial datasets | Live API ingestion |
| Infrastructure geometry (ports, airports, cables…) | Normalization + confidence scoring |
| Trade routes + chokepoints | API credentials |
| Country profiles (214 × ISO3.json) | Events / energy / macro pipelines |
| Spatial entity Zod schemas | Production of import contract files |
| Import contract definition (`src/data/schemas/imports.ts`) | |
| All MapLibre rendering architecture | |
| All frontend components | |

## Where hub data enters the frontend

Hub drops files to `public/data/imports/`. The adapter (`src/lib/adapters/imports.ts`) fetches them at runtime using `${import.meta.env.BASE_URL}data/imports/{file}`. Falls back to `*.example.json` for local dev.

The import contract (`src/data/schemas/imports.ts`, schemaVersion `1.0.0`) is **owned by WorldMap**. The Hub conforms to it.

---

## Key file locations

```
src/
  store/useMapStore.ts           # Map interaction state (layers, selection, heatmap)
  store/useIntelligenceStore.ts  # Hub import state (events, indicators, manifest)
  hooks/useGeoData.ts            # Topology fetch lifecycle
  hooks/useCountryColors.ts      # Per-country fill color (reads both stores)
  hooks/useMapInteraction.ts     # Hover / tooltip / click — all three tooltip kinds
  lib/geo/indicators.ts          # allIndicators, IndicatorKey, INVERTED_INDICATORS
  lib/adapters/imports.ts        # Hub import loader
  layers/_core/registry.ts       # LAYER_REGISTRY — single source of truth for all 14 layers
  layers/intelligence/EventsLayer.tsx  # GPU circle layer for hub events
  data/schemas/imports.ts        # Hub import contract (Zod)
  data/schemas/traderoute.ts     # Trade route + chokepoint Zod schemas
  layers/economic/types.ts       # EconomicTradeRoute + StrategicChokepoint types

public/data/imports/
  events.json            # Hub-produced (gitignored)
  *.example.json         # Committed — used for local dev fallback
```

---

## Architecture patterns

**Layer registry:** All 14 layers registered in `layers/_core/registry.ts`. `layerVisibility` in the store is initialized from `LAYER_REGISTRY.defaultEnabled`. To add a layer: add to registry only — store, UI, and visibility auto-update.

**EventsLayer:** Uses MapLibre `Source + Layer` (GPU circle), not React Marker components. Two layers per source: `intelligence-events-halo` (exact-only) and `intelligence-events-points` (interactive). All tooltip data baked into GeoJSON feature properties — no store lookup on hover.

**Trade routes:** Multi-segment `waypoints` array replaces the old `[from.coords, to.coords]` straight line. `fixGeometry` in `lib/geo/antimeridian.ts` handles antimeridian crossings. Entity links: `chokepointIds[]` and `bypassRouteId`.

**Hooks boundary:**
```
lib/geo/        → pure computation, no React, no store
lib/adapters/   → fetch + validation, no React
hooks/          → React UI orchestration, may read store
components/     → rendering only, no business logic
store/          → state only, no computation
```

**Zod schemas:** Use `.nullish()` not `.optional()` on Gemini-sourced JSON — Gemini returns `null` for unknowns, not `undefined`.

---

## Coordinate quality (hub contract, PM-confirmed 2026-05-14)

| Value | Visual |
|---|---|
| `source_exact` | Full opacity, 2px stroke, halo |
| `source_approx` | Reduced opacity |
| `country_centroid` | Flat 5px, low opacity |
| `missing` | Omitted from map |

---

## Anti-patterns to avoid

- `fetch()` to external APIs from frontend code
- Adding `.optional()` to Zod schemas to accommodate bad Hub output
- Inferring or geocoding coordinates client-side
- Enriching events or modifying `coordinateQuality` in the browser
- Loosening enums to match Gemini-generated content
- Committing API credentials (`.env` is gitignored)
- Committing hub-generated data files (gitignored in `public/data/imports/`)
- Skipping `npm run build` before committing

---

## Gemini / Claude division

Gemini generates: intelligence content, country narratives, bulk datasets, taxonomy ideas.
Claude owns: architecture, schemas, Zod contracts, rendering, validation, normalization, frontend integration.

When Gemini output conflicts with existing architecture → architecture wins, Gemini output gets normalized.

---

## Start of session checklist

1. Read this file (done automatically)
2. Check `ARCHITECTURE.md` if working near repo boundaries
3. Run `npm run build` before committing
4. Never stage `ruvector.db`, `public/data/imports/*.json` (real hub files), or `.env`
