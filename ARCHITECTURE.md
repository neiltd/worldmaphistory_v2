# World Intelligence — Architecture Boundary Document

**Status:** Accepted · Confirmed 2026-05-14
**Scope:** Defines the ownership boundary between the WorldMap frontend repository and the Data Hub backend system.

---

## System Overview

The platform is split across two distinct systems:

```
┌─────────────────────────────────┐      import contract       ┌────────────────────────────────┐
│       WORLDMAP (this repo)      │ ◄─── public/data/imports/ ─┤       DATA HUB (separate)      │
│                                 │                             │                                │
│  Static geospatial platform     │                             │  Dynamic intelligence engine   │
│  Visualization + interaction    │                             │  Ingestion + normalization     │
└─────────────────────────────────┘                             └────────────────────────────────┘
```

The WorldMap frontend never calls external APIs. It reads only from:
1. Its own bundled static datasets (infrastructure, routes, country profiles)
2. Hub-exported JSON files dropped into `public/data/imports/`

---

## 1. WorldMap Responsibilities

### Owns
- All static geospatial datasets
- Infrastructure geometry (airports, seaports, power plants, rail hubs, datacenters, submarine cables)
- Trade routes and chokepoints (geometry, waypoints, entity links)
- Country profiles (214 × ISO3.json)
- All spatial entity Zod schemas (`src/data/schemas/`)
- The import contract definition (`src/data/schemas/imports.ts`) — WorldMap dictates what it expects from the Hub
- All MapLibre rendering architecture (layers, paint expressions, GeoJSON conversion, antimeridian fix)
- Layer registry and visibility system
- Country panel and all UI components
- Performance and scaling decisions for map rendering

### Does NOT own
- Live API credentials (ACLED, EIA, NewsAPI, GDELT, World Bank)
- Any ingestion pipeline
- Normalization or confidence scoring logic
- Rate limit management
- Any real-time data stream

---

## 2. Data Hub Responsibilities

### Owns
- All live API ingestion (ACLED, EIA, NewsAPI, GDELT, World Bank)
- Credential management (stored in Hub `.env`, never in this repo)
- Normalization pipeline (raw → normalized → validated)
- Confidence scoring per event
- Deduplication across sources
- Production of files conforming to the WorldMap import contract
- Scheduling and quota management

### Does NOT own
- MapLibre rendering decisions
- Layer architecture
- GeoJSON geometry for static infrastructure
- Frontend component structure
- How data is visually displayed

---

## 3. Import Contract Philosophy

The contract is defined in `src/data/schemas/imports.ts` and is owned by **WorldMap**.

```
Hub produces → files conforming to the contract
WorldMap consumes → validates with Zod, rejects mismatches
```

**Versioning:** Every import file includes `schemaVersion: "1.0.0"`.
- Minor version bumps (new optional fields): backward-compatible, no frontend changes required.
- Major version bumps (renamed/removed fields): requires coordinated update of `imports.ts` first, then Hub deployment.

**The contract defines what WorldMap expects — not what the Hub finds convenient to produce.**

If the Hub changes its internal data model, it is responsible for normalizing its output to match the contract. WorldMap does not loosen its Zod schemas to accommodate Hub-side changes.

### Current contract files

| File | Schema | Owner of definition |
|---|---|---|
| `public/data/imports/events.json` | `EventsImportSchema` | WorldMap |
| `public/data/imports/energy-indicators.json` | `EnergyImportSchema` | WorldMap |
| `public/data/imports/macro-indicators.json` | `MacroImportSchema` | WorldMap |
| `public/data/imports/manifest.json` | `ManifestSchema` | WorldMap |

---

## 4. What Belongs Where — Examples

### Belongs in WorldMap

| Item | Reason |
|---|---|
| Trade route waypoints | Static geometry, rendered by MapLibre |
| Chokepoint coordinates and entity links | Static spatial reference data |
| Airport / seaport / cable layer JSON | Infrastructure geometry, visualization-native |
| Country profile JSON (ISO3.json) | Static narrative, loaded per-country selection |
| Zod schemas for spatial entities | WorldMap owns the shape of its own data |
| `INVERTED_INDICATORS` constant | Domain knowledge for heatmap rendering |
| `coordinateQuality` enum definition | Rendering contract, WorldMap defines it |
| MapLibre paint expression logic | GPU rendering architecture |

### Belongs in Hub

| Item | Reason |
|---|---|
| ACLED API client | Live API, requires credentials |
| NewsAPI/GDELT ingestion | Quota-managed, rate-limited |
| EIA energy price fetcher | External API |
| World Bank indicator pipeline | Periodic batch fetch |
| Confidence scoring algorithm | Intelligence analysis logic |
| Deduplication across sources | Normalization concern |
| RSS intelligence pipeline | Live content stream |
| `rss_intelligence` source handling | Ingestion-side concern |

### Belongs in neither (future shared concern)

| Item | Guidance |
|---|---|
| PMTiles / vector tiles | If infrastructure grows to 100k+ features, WorldMap serves tiles from a CDN. Hub does not produce tiles. |
| Company exposure mapping | Company profiles live in WorldMap as static JSON (like country profiles). Hub produces events *about* companies. |
| AI investment thesis generation | Hub logic, output conforms to WorldMap's import contract when ready. |

---

## 5. Future Scaling Guidance

### WorldMap scaling path

**Infrastructure data growth (100 → 10,000+ features per layer):**
- Switch from Vite-bundled JSON imports to runtime fetch from `public/data/`
- If features exceed 100k, introduce PMTiles served from a CDN
- Use MapLibre's `cluster: true` on Source when event density requires it
- Switch country profile loading to a pre-built index if 214 countries becomes 2,000+ regions

**Intelligence events growth (16 → 10,000+ events):**
- EventsLayer already uses GPU-rendered circle layers (not React Markers) — scales to thousands
- When events exceed ~1,000 per viewport, add `cluster: true` to the EventsLayer Source
- MapLibre handles cluster GeoJSON natively — no frontend logic change

**Indicator updates (static → hub-driven):**
- The `indicators-index.json` file is currently static (Gemini-generated)
- When Hub produces `macro-indicators.json`, the `useIntelligenceStore` overlay pattern handles it
- Hub indicators take precedence per country; static indicators fill the rest
- No file system conflict — two sources, one merged view in the store

### Hub scaling path

- Add new source clients without touching WorldMap
- Upgrade normalization logic without changing the import contract (schema version unchanged)
- Major version bump required only when field shapes change — coordinate with WorldMap first

---

## 6. Anti-Patterns to Avoid

### Hub anti-patterns

❌ **Hub owns rendering concerns**
The Hub should not dictate how events are displayed (marker shape, color, clustering). It produces structured data; WorldMap decides visualization.

❌ **Hub modifies the import contract unilaterally**
The Hub cannot rename or remove fields without first updating `src/data/schemas/imports.ts` and getting WorldMap to deploy. The contract is WorldMap's interface, not the Hub's.

❌ **Hub serves spatial infrastructure geometry**
Ports, airports, trade routes are not Hub data. They are static, change rarely, and belong near the rendering layer. Routing them through the Hub adds latency and coupling with no benefit.

❌ **Hub stores API credentials in the WorldMap repo**
`.env` files in this repo are gitignored and should remain empty. All credentials stay in the Hub environment.

### WorldMap anti-patterns

❌ **WorldMap calls external APIs directly**
No `fetch()` to ACLED, EIA, NewsAPI, GDELT, or World Bank from the frontend. Only `fetch()` to `${BASE_URL}data/imports/` and `${BASE_URL}countries-110m.json`.

❌ **WorldMap performs coordinate inference or geocoding**
The frontend renders coordinates provided by the Hub. It does not infer, geocode, or modify `coordinateQuality`. If coordinates are missing, the event is omitted from the map.

❌ **WorldMap enriches events client-side**
No NLP, no confidence recalculation, no cross-referencing of sources in the browser. The frontend is a display terminal.

❌ **WorldMap loosens Zod schemas to accommodate Hub output**
If the Hub produces non-conforming data, the Hub normalizes its output. WorldMap does not add `.optional()` or broaden enums to paper over Hub-side issues.

❌ **WorldMap bundles large dynamic datasets at build time**
Intelligence events change frequently and should never be bundled into the Vite build. They live in `public/data/imports/` and are fetched at runtime. Only static infrastructure (which changes rarely) is bundled.

---

## 7. Coordinate Quality Contract

The coordinate quality enum is defined by WorldMap and the Hub must conform to it.

**Canonical values (PM-confirmed 2026-05-14):**

| Value | Meaning | Visual treatment |
|---|---|---|
| `source_exact` | Confirmed GPS/field point | Full opacity, 2px stroke, halo behind |
| `source_approx` | Geocoded estimate (city/district) | Reduced opacity, no stroke |
| `country_centroid` | Country centroid only | Flat 5px, low opacity |
| `missing` | No coordinates available | Omitted from map entirely |

WorldMap schema: `src/data/schemas/imports.ts`
WorldMap rendering: `src/layers/intelligence/EventsLayer.tsx`

---

## 8. Gemini / Claude Division of Labor

Within the WorldMap repo:

| Concern | Owner |
|---|---|
| Architecture decisions | Claude |
| Schema implementation and Zod contracts | Claude |
| Validation and normalization logic | Claude |
| MapLibre rendering architecture | Claude |
| Frontend integration | Claude |
| Geopolitical intelligence content | Gemini |
| Company/relationship modeling | Gemini |
| Bulk dataset generation (country profiles, infrastructure data) | Gemini |
| Semantic taxonomy proposals | Gemini |

**When Gemini proposes schema changes or field names that conflict with existing contracts:**
Preserve the contract. Adapt Gemini's output with a normalization/mapping step. Never weaken a Zod schema to accommodate Gemini-generated content.
