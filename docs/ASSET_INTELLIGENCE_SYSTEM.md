# Asset Intelligence System
## World Intelligence Platform — Investment Layer Architecture

---

## Core Principle

**The map is the foundation. The investment layer connects geopolitical reality to financial assets.**

Every analysis in this system must answer:
> *"What happened geopolitically → how does it flow through infrastructure and supply chains → which assets are exposed → what is the evidence?"*

No investment thesis is valid without:
- Source attribution (real URL)
- Evidence chain (verbatim quotes from filings or news)
- Confidence scoring
- Invalidation conditions

---

## The 5-Layer Pipeline

```
Layer 1 — GEOPOLITICAL REALITY
  ├── Countries (214 profiles)
  ├── Active Conflicts (30 zones)
  ├── Trade Routes (19 corridors)
  ├── Chokepoints (18 strategic points)
  ├── Infrastructure (airports, ports, cables — from Gemini data)
  └── Intelligence Events (emerging events, scored by tier)

          ↓ "What happened?"

Layer 2 — INFRASTRUCTURE & SUPPLY CHAIN EXPOSURE
  ├── Which chokepoints are affected?
  ├── Which trade routes are disrupted?
  ├── Which ports / airports / cables are involved?
  └── What is the supply chain propagation path?

          ↓ "How does it spread through the economy?"

Layer 3 — SECTOR & COMPANY EXPOSURE
  ├── Which sectors are exposed? (SectorExposureProfile × 7 priority sectors)
  ├── Which companies have disclosed this risk? (CompanyFiling → FilingRiskFactor)
  ├── What is the revenue geography of affected companies?
  └── Who has concentration risk?

          ↓ "Who wins and who loses?"

Layer 4 — MARKET IMPACT
  ├── Beneficiaries (specific tickers with mechanism)
  ├── Losers (specific tickers with mechanism)
  ├── Commodity price effects
  └── Currency / macro effects

          ↓ "What should an investor do?"

Layer 5 — INVESTMENT THESIS + EVIDENCE CHAIN
  ├── Structured thesis (geopolitical → supply chain → sector → asset)
  ├── Evidence chain (verbatim filing quotes + news sources)
  ├── Confidence scoring
  ├── Risks to thesis
  ├── Catalysts
  └── Invalidation conditions
```

---

## Data Models (9 TypeScript schemas)

All schemas in `src/layers/investment/types/`

### 1. `shared.types.ts`
Foundation types used by all other schemas.

| Type | Purpose |
|---|---|
| `SourceRef` | A citable source with URL, type, accessedAt, verbatimQuote |
| `Attribution` | sources[] + confidence + lastVerified |
| `EvidenceItem` | One piece of evidence supporting a specific claim |
| `EvidenceChain` | A claim + its supporting evidence items |
| `Confidence` | `'high' \| 'medium' \| 'low'` |
| `Direction` | `'positive' \| 'negative' \| 'mixed' \| 'neutral'` |
| `Magnitude` | `'critical' \| 'high' \| 'medium' \| 'low'` |

### 2. `asset.types.ts`
The universe of investable assets.

| Type | Purpose |
|---|---|
| `Asset` | Stock, ETF, index, commodity, currency as unified entity |
| `AssetClass` | stock / etf / index / commodity / currency / bond / sector |
| `ExchangeId` | NYSE, NASDAQ, SET, LSE, TSE, HKEX... |
| `GICSSector` | 11 GICS sectors |
| `StockExchange` | Exchange metadata including regulatory body and filing standard |

### 3. `company.types.ts`
The richest entity — how a company connects to the geopolitical layer.

| Field | Why it matters |
|---|---|
| `revenueByGeography` | Shows which conflicts/sanctions directly hit revenue |
| `keySuppliers` | Maps supply chain concentration risk to countries |
| `commodityDependencies` | Connects to commodity exposure maps |
| `infrastructureDependencies` | Links to ports, cables, routes in infrastructure layer |
| `flags.taiwanSemiconductorDependent` | Fast query for Taiwan conflict exposure |
| `flags.redSeaTradeRouteDependent` | Fast query for Houthi attack exposure |
| `flags.exportControlSensitive` | Fast query for US-China tech war exposure |
| `secCik` | Direct link to SEC EDGAR for filing retrieval |

### 4. `exposure.types.ts`
Sector-level geopolitical exposure mapping.

| Type | Purpose |
|---|---|
| `SectorExposureProfile` | Complete geopolitical risk/opportunity profile for a sector |
| `CommodityExposureMap` | Who benefits/loses from commodity price moves |

**Pre-populated for 7 priority sectors:**
- Semiconductors ← Taiwan/TSMC, ASML, export controls
- Energy ← Hormuz, Bab-el-Mandeb, Russia/OPEC
- Shipping & Logistics ← all chokepoints, Houthi
- AI Infrastructure & Datacenters ← Taiwan chips, power grid, cables
- Defense ← geopolitical escalation → budget increases
- Commodities ← Oil (Brent) + Gold with full exposure maps
- Banks & Financial System ← SWIFT, sanctions, China credit

### 5. `impact.types.ts`
The event-to-asset impact analysis.

| Type | Purpose |
|---|---|
| `AssetImpact` | One asset's exposure to one event — direction, magnitude, mechanism |
| `SupplyChainImpactPath` | Step-by-step propagation from event to market |
| `NewsToAssetImpact` | Full impact analysis: event → sectors → assets → commodities |

### 6. `filing.types.ts`
Company filings as the evidence layer.

| Type | Purpose |
|---|---|
| `FilingRiskFactor` | Single risk factor with VERBATIM TEXT — never paraphrase |
| `CompanyFiling` | Full 10-K extraction with risk factors, revenue, year-over-year changes |
| `FilingType` | SEC-10K / SET-56-1 / earnings-call etc. |

**Filing ingestion flow:**
```
SEC EDGAR → Download 10-K PDF/HTML
→ Extract Item 1A (Risk Factors)
→ Parse each risk factor as FilingRiskFactor (verbatim)
→ Tag: countries, commodities, infrastructure, regulations mentioned
→ Store as CompanyFiling
→ Link to CompanyProfile.latestFilingId
→ Use as evidence in InvestmentThesis
```

### 7. `thesis.types.ts`
The terminal output — structured investment reasoning.

```typescript
InvestmentThesis = {
  geopoliticalLayer:  { event, countries, conflicts, infrastructure }
  supplyChainLayer:   { chokepoints, ports, routes, propagationPath }
  exposureLayer:      { sectors, companies, commodities }
  marketImpactLayer:  { beneficiaries, losers, hedges }
  thesis:             string  // 3-5 sentences
  evidenceChains:     EvidenceChain[]  // REQUIRED — minimum 1
  risks:              string[]
  catalysts:          string[]
  invalidationConditions: string[]
}
```

### 8. `reasoning.types.ts`
The pipeline orchestration layer.

| Type | Purpose |
|---|---|
| `ImpactPipeline` | Full event-to-market trace with step-by-step reasoning |
| `SectorGeopoliticalReasoning` | Always-on structural analysis per sector |
| `InvestmentSignal` | Actionable signal for a specific ticker |

---

## Priority Sectors (Pre-populated)

Files in `src/layers/investment/data/sectors/`

| File | Sector | Key Geopolitical Connection |
|---|---|---|
| `semiconductors.ts` | Semiconductors | Taiwan/TSMC, ASML, US export controls |
| `energy.ts` | Energy | Hormuz, Bab-el-Mandeb, Russia, OPEC |
| `shipping.ts` | Shipping & Logistics | All chokepoints, Houthi, Panama Canal drought |
| `ai-infrastructure.ts` | AI Infrastructure | Taiwan chips, power grid constraint, submarine cables |
| `defense.ts` | Defense | NATO spending surge, Ukraine/Taiwan/Israel demand |
| `commodities.ts` | Commodities | Oil (Brent) + Gold exposure maps |
| `banks.ts` | Banks & Financial | SWIFT, sanctions, China credit, de-dollarization |

---

## Example: Full Pipeline — Red Sea Houthi Crisis

```
GEOPOLITICAL EVENT (Layer 1)
  IntelligenceEvent: "Houthi attacks on Red Sea shipping" — Tier 1
  Countries: YEM (source), EGY (Suez Canal revenue), SAU (adjacent)
  Conflicts: Yemen Civil War (active)
  Infrastructure: Bab-el-Mandeb chokepoint, Suez Canal, Red Sea trade route

          ↓

SUPPLY CHAIN PROPAGATION (Layer 2)
  Step 1: Bab-el-Mandeb → shipping cannot safely transit
  Step 2: Carriers reroute via Cape of Good Hope
  Step 3: +10-14 days transit time, +$2,000-4,000/container freight
  Step 4: European retailers face inventory shortfall risk
  Step 5: Egyptian Suez Canal revenue falls 40%+

          ↓

SECTOR & COMPANY EXPOSURE (Layer 3)
  Losers: shipping (route disruption), European retail (higher COGS),
          chemicals (feedstock delays), Egypt (Suez revenue)
  Evidence: Maersk 10-K "Red Sea operations suspended"
            CMA CGM earnings call Q4 2023 (verbatim)

          ↓

MARKET IMPACT (Layer 4)
  Beneficiaries: Cape route ports (ZAF, OMN), air freight (FDX, UPS),
                 suezmax tankers (larger ships fit Cape route)
  Losers: European retail (ZARA/Inditex, H&M), container lines
          (volume down, costs up), Egypt (macroeconomic)

          ↓

INVESTMENT THESIS (Layer 5)
  Title: "Red Sea Disruption Reshapes Asia-Europe Logistics"
  Thesis: "Sustained Houthi attacks are fundamentally repricing
           Asia-Europe freight, with Cape of Good Hope rerouting
           adding 10-14 days and $2,000-4,000/container. Air freight
           operators (FedEx, UPS) benefit from time-sensitive cargo
           diversion. European fast-fashion retailers face margin
           compression from extended lead times."
  Evidence: Maersk 10-K verbatim risk factor, Freightos Baltic Index data
  Confidence: high
  Invalidation: Houthi ceasefire, Western military operation resolves threat
```

---

## Filing Ingestion Process

### SEC 10-K (US companies)

1. Find company on SEC EDGAR: `https://www.sec.gov/cgi-bin/browse-edgar?company=[NAME]&CIK=&type=10-K`
2. Note the CIK (Central Index Key) — store in `CompanyProfile.secCik`
3. Download most recent 10-K
4. Navigate to **Item 1A — Risk Factors**
5. Extract each risk factor as a `FilingRiskFactor`:
   - Copy VERBATIM text — never paraphrase
   - Note the section reference (e.g. "Item 1A, p.24")
   - Tag: countries, commodities, chokepoints mentioned
   - Assign severity: `material` / `notable` / `mentioned`
6. Store as `CompanyFiling` with direct SEC EDGAR URL

### Gemini prompt for 10-K extraction

```
Task: Extract geopolitical risk factors from [COMPANY] 10-K filing.

Source: [SEC EDGAR URL or filing text]

Instructions:
- Find Item 1A (Risk Factors) in the filing
- Extract ONLY risk factors mentioning:
  • specific countries or regions
  • trade routes, shipping, chokepoints
  • commodities (oil, rare earths, chips)
  • sanctions, export controls, tariffs
  • geopolitical events or conflicts
- For each risk factor, copy the VERBATIM text
- Do NOT paraphrase — exact wording only
- Identify which countries, commodities, and chokepoints are mentioned
- Rate severity: "material" (could significantly affect business) /
                 "notable" (clearly relevant) / "mentioned" (passing reference)

Return as JSON array matching FilingRiskFactor schema.
Include direct URL reference to the specific section.
```

---

## Roadmap

### Phase 1 (Current)
- [x] 8 TypeScript schemas designed
- [x] 7 sector exposure profiles populated
- [x] Architecture documented
- [ ] Company profiles: 20-30 key companies across 7 sectors
- [ ] 10-K extractions for key companies

### Phase 2
- [ ] Filing ingestion pipeline (Gemini-assisted extraction)
- [ ] NewsToAssetImpact: connect IntelligenceEvents to assets
- [ ] ImpactPipeline: trace full event → market paths

### Phase 3
- [ ] UI: Investment Intelligence panel (not a screener)
- [ ] UI: Sector exposure map overlay on the geopolitical map
- [ ] UI: Company filing viewer with verbatim risk factors

### Phase 4 (Thai stocks + global expansion)
- [ ] SET 56-1 filing ingestion schema
- [ ] Thai company profiles for SET-listed companies
- [ ] Cross-market exposure (Thai companies exposed to US/China/ASEAN geopolitics)

---

## Hard Rules

1. **No thesis without evidence** — `evidenceChains` must have at least 1 item
2. **No paraphrase** — `verbatimText` in `FilingRiskFactor` is exact text from filing
3. **No invented numbers** — all `priceImpactEstimatePct` fields require low confidence
4. **Source URL required** — every `SourceRef` must have a real, accessible URL
5. **Confidence must match evidence** — `high` requires 2+ independent sources
6. **AI-generated analysis must be flagged** — `generatedBy: "ai-assisted"` always set
7. **Invalidation conditions required** — every thesis must have conditions that would make it wrong
