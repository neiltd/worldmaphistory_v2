# World Intelligence — Architecture Guide

## Overview

World Intelligence is structured as a scalable geopolitical intelligence platform. The architecture is designed to support progressive enrichment: start with static JSON data, add richer datasets over time, and eventually migrate to a live backend — without rewriting any components.

---

## Layer System

All map layers are organized under `src/layers/` by analytical domain.

```
src/layers/
  _core/
    types.ts       — LayerMeta, LayerProps, LayerGroup interfaces
    registry.ts    — LAYER_REGISTRY: central catalog of all layers
  geopolitical/    — armed conflicts, conflict zones, territorial disputes
  economic/        — trade routes, chokepoints, sanctions corridors
  infrastructure/  — airports, seaports, submarine cables
  utilities/       — power plants, energy mix, water/food security
  intelligence/    — news articles, intelligence events
  environment/     — water stress, food security, climate vulnerability
  investment/      — investment signals, risk/opportunity matrix
  index.ts         — barrel export for all layers
```

### Layer registry

Every layer is registered in `src/layers/_core/registry.ts` with:

```typescript
{
  id: string               // unique ID used in store and toggles
  label: string            // display name
  description: string      // WHY this layer matters for geopolitical analysis
  group: LayerGroup        // which domain it belongs to
  defaultEnabled: boolean
  legend?: LegendEntry[]   // optional color legend
  placeholder?: boolean    // true = schema ready, data/render pending
}
```

### Adding a new layer (step-by-step)

1. **Add to registry** in `src/layers/_core/registry.ts`:
   ```typescript
   { id: 'sanctions', label: 'Sanctions Networks', group: 'geopolitical',
     description: 'Active sanctions regimes and their secondary effects on trade.',
     defaultEnabled: false }
   ```

2. **Define types** in `src/layers/geopolitical/types.ts` (or create a new domain folder)

3. **Create data file** in `src/layers/geopolitical/data/sanctions.json`

4. **Build the component** in `src/layers/geopolitical/SanctionsLayer.tsx`:
   ```tsx
   import type { LayerProps } from '../_core/types'
   export default function SanctionsLayer({ visible, labelLayerId }: LayerProps) {
     if (!visible) return null
     // render MapLibre Source + Layer
   }
   ```

5. **Export from** `src/layers/index.ts`

6. **Mount in** `src/components/Map/WorldMap.tsx`:
   ```tsx
   <SanctionsLayer visible={isLayerVisible('sanctions')} labelLayerId={labelLayerId} />
   ```

7. **Add toggle** to `src/components/UI/LayerToggle.tsx`

---

## State Management

State lives in `src/store/useMapStore.ts` (Zustand).

### Legacy layer toggles (backward-compatible)
```typescript
showConflicts: boolean      // toggle via toggleConflicts()
showTradeRoutes: boolean    // toggle via toggleTradeRoutes()
showChokepoints: boolean    // toggle via toggleChokepoints()
```

### Extensible layer visibility (new layers)
```typescript
layerVisibility: Record<string, boolean>
setLayerVisible(id, visible)
toggleLayerById(id)
isLayerVisible(id)          // also delegates to legacy booleans
```

New layers use `isLayerVisible(id)` — it bridges both systems.

---

## Intelligence Event Pipeline (Phase 4 — design only)

The news intelligence system is designed but not yet built. When implemented:

```
News sources (RSS/API)
  → Ingestion service (Node.js / Python worker)
  → Article parsing + entity extraction (LLM)
  → NewsArticle stored (Supabase / JSON)
  → Event clustering (group articles by theme)
  → IntelligenceEvent scored (LLM with source attribution)
  → Event stored + pushed to client via WebSocket or polling
  → Map highlights directCountries + indirectCountries
  → IntelligenceEventLayer renders tier-coded markers
```

**Schema files:** `src/layers/intelligence/types.ts`

**Key design principles:**
- Every `IntelligenceEvent` requires `sources[]` — no unsourced analysis
- `tier` (1/2/3) controls visual prominence on map
- `hiddenInfluencers` captures non-obvious country connections
- `opportunityScore` makes this investment-relevant, not just news

---

## Investment Intelligence Framework (Phase 5 — design only)

```
InvestmentSignal
  → backed by IntelligenceEvent IDs
  → scored 0–10 per sector per country
  → aggregated into CountryInvestmentProfile
  → rendered as RiskOpportunityMatrix scatter plot
  → filterable by sector, region, timeHorizon
```

**Schema file:** `src/layers/investment/types.ts`

**Key types:**
- `InvestmentSignal` — single sector signal for a country
- `CountryInvestmentProfile` — composite scores + all signals
- `InvestmentThesis` — user-created thesis backed by signals
- `RiskOpportunityMatrix` — x/y coordinates for scatter plot

---

## Data Pipeline

### Current (static JSON)
```
Gemini (data research) → JSON files in src/data/ or src/layers/*/data/
→ imported directly by layer components
→ no runtime API calls
```

### Future (live backend)
The static import pattern is easy to swap:
```typescript
// Current
import airportsData from './data/airports.sample.json'

// Future (minimal change)
const airportsData = await fetch('/api/layers/airports').then(r => r.json())
```

No component logic changes — only the data source changes.

### Data files by layer

| Layer | File | Status |
|---|---|---|
| Country profiles | `src/data/countries/[ISO3].json` | ✅ 214 countries |
| Conflicts | `src/data/conflicts.json` | ✅ 30 conflicts |
| Conflict zones | `src/data/conflict-zones.json` | ✅ 24 zones |
| Trade routes | `src/data/trade-routes.json` | ✅ 19 routes |
| Chokepoints | `src/data/trade-routes.json` | ✅ 18 points |
| Airports | `src/layers/infrastructure/data/airports.sample.json` | 📋 6 samples |
| Seaports | `src/layers/infrastructure/data/ports.sample.json` | 📋 6 samples |
| Submarine cables | `src/layers/infrastructure/data/cables.sample.json` | 📋 4 samples |
| Utility profiles | `src/layers/utilities/data/utilities.sample.json` | 📋 4 samples |

---

## Geopolitical Reasoning Principles

Every layer should answer: **"Why does this matter for investment-grade geopolitical analysis?"**

| Layer | The answer |
|---|---|
| Conflicts | Instability → capital flight, supply chain disruption |
| Trade routes | Disruption risk → commodity prices, logistics costs |
| Chokepoints | Bottleneck risk → energy prices, shipping insurance |
| Airports | Logistics capability + power projection capability |
| Seaports | Manufacturing supply chain entry/exit points |
| Submarine cables | Digital infrastructure vulnerability, sovereignty risk |
| Power plants | Energy security → industrial capacity and geopolitical leverage |
| Water stress | Primary driver of migration, food price shocks, regional conflict |
| Food security | Social stability indicator; import dependency = leverage point |
| Intelligence events | Connects news to map → from headline to country-level impact |
| Investment signals | Converts geopolitical analysis into actionable investment thesis |

---

## Backend Migration Readiness

The app is currently 100% client-side static. When a backend is needed:

1. **API layer**: Add `src/api/` with typed fetch functions
2. **Replace imports**: Static JSON → `useQuery()` hooks (React Query / TanStack)
3. **Auth**: Add Supabase Auth or similar — store already uses Zustand, easy to add auth slice
4. **Real-time**: Add WebSocket for live intelligence events — `useMapStore` can receive pushes
5. **No component rewrites needed**: Components consume typed data, don't care about source

---

## File Conventions

| Pattern | Meaning |
|---|---|
| `src/layers/[domain]/types.ts` | TypeScript schemas for that domain |
| `src/layers/[domain]/[Name]Layer.tsx` | React component that renders the layer |
| `src/layers/[domain]/data/*.json` | Static data (sample or production) |
| `src/layers/_core/` | Shared layer infrastructure |
| `placeholder?: true` in registry | Schema ready, component renders null |
