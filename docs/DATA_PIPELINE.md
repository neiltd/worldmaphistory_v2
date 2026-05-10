# World Intelligence — Data Pipeline Guide

## Architecture Principle

```
Claude defines structure.
Gemini gathers data.
Claude validates and integrates.
```

No AI-generated analysis appears in the platform without source attribution.
Every data point must have a real, accessible URL as its source.

---

## Folder Structure

```
src/data/
  schemas/                    ← Zod validation schemas (TypeScript)
    _shared.ts                  shared primitives (coords, confidence, source)
    airport.ts
    port.ts
    cable.ts
    powerplant.ts
    utility.ts
    gdp.ts
    foodsecurity.ts
    aiadoption.ts
    datacenter.ts
    railhub.ts
    index.ts                    SCHEMA_MAP + barrel exports

  templates/                  ← JSON examples for Gemini (one per entity type)
    airport.template.json
    port.template.json
    cable.template.json
    utility.template.json

  infrastructure/
    raw/                      ← Gemini output (unvalidated — never serve directly)
    validated/                ← Pipeline output (safe to use in app)

  intelligence/
    raw/
    validated/

  utilities/
    raw/
    validated/

  investment/
    raw/
    validated/

scripts/
  _iso3.ts                    ← ISO 3166-1 alpha-3 reference list
  normalize.ts                ← Coordinate, country code, percentage normalization
  validate.ts                 ← CLI validator (Zod + attribution + duplicate check)
  pipeline.ts                 ← Full import pipeline (raw → validated)

docs/
  ARCHITECTURE.md
  DATA_PIPELINE.md            ← This file
  prompts/
    GEMINI_PROMPTS.md         ← Research prompts for all 10 entity types
```

---

## Entity Types

| Type | ID Format | Key Validation | Primary Sources |
|---|---|---|---|
| airport | IATA code (3-char) | Coordinates, IATA/ICAO | ACI, airport authorities |
| port | PORT-[ISO3]-[NAME] | TEU or tonnes required | Port authorities, Lloyd's List |
| cable | CABLE-[NAME-SLUG] | ≥2 landing points, ≥2 route coords | TeleGeography |
| powerplant | PLANT-[ISO3]-[SLUG] | Capacity > 0, valid status | Global Energy Monitor, IAEA |
| utility | countryId + year | Energy mix sums to 100% | IEA, Aqueduct, GFSI |
| gdp | countryId + year | Sectors sum to 100% | World Bank, IMF |
| foodsecurity | countryId + year | Score 0–100 | GFSI, FAO |
| aiadoption | countryId + year | Scores 0–100 | Oxford Insights, OECD |
| datacenter | DC-[ISO3]-[CITY]-[OP] | Valid coordinates | DC Maps, cloud providers |
| railhub | RAIL-[ISO3]-[CITY] | Valid type enum | Official rail authorities |

---

## Confidence Framework

Every entity carries an `attribution.confidence` block:

```json
{
  "confidence": {
    "confidence": "high | medium | low",
    "sourceCount": 2,
    "lastVerified": "2024-03-15"
  }
}
```

**Assignment rules:**

| Level | When to use |
|---|---|
| `high` | 3+ independent sources, all agree, data is recent (<2 years) |
| `medium` | 2 sources, or 1 authoritative source (IAEA, IEA, World Bank) |
| `low` | 1 source only, or data is >2 years old, or source is secondary |

The validator warns when confidence level doesn't match source count.

---

## Source Attribution Standard

Every entity must have at least 1 source. The validator **rejects** records without sources.

```json
"attribution": {
  "sources": [
    {
      "name": "Human-readable source name",
      "url": "https://exact-url-to-the-data-page.com",
      "accessedAt": "YYYY-MM-DD"
    }
  ],
  "confidence": {
    "confidence": "medium",
    "sourceCount": 1,
    "lastVerified": "2024-03-15"
  }
}
```

**Rules:**
- `url` must be a valid URL (validated by Zod)
- `accessedAt` must be YYYY-MM-DD format
- `sourceCount` should match the actual `sources` array length
- No internal or placeholder URLs (e.g. `https://example.com`)

---

## Validation Rules by Entity

### All entities
- `attribution.sources` must have ≥1 entry
- `countryId` must be a valid ISO 3166-1 alpha-3 code
- `coordinates` must be `[longitude, latitude]` (not latitude first)
- `coordinates` cannot be `[0, 0]` (null island)
- Duplicate IDs within a dataset are rejected

### Airport
- At least one of `iata` or `icao` must be present
- `iata` must be exactly 3 uppercase letters
- `icao` must be exactly 4 uppercase letters

### Port
- ID must start with `PORT-`
- At least one of `annualThroughputTEU` or `annualThroughputTonnes` recommended

### Submarine Cable
- Must have ≥2 `landingPoints`
- `route` must have ≥2 coordinate pairs
- Each landing point must have `countryId`, `coordinates`, and `name`

### Utility
- `electricityMix` values must sum to approximately 100% (±3% tolerance)
- `waterStressScore` must be 0–5
- `foodSecurityScore` must be 0–100

### GDP Composition
- `sectors` percentages must sum to approximately 100% (±3% tolerance)

### Power Plant
- `yearRetirement` must be after `yearCommissioned` if both provided
- ID must start with `PLANT-`

### Datacenter
- ID must start with `DC-`
- `pue` (Power Usage Effectiveness) must be ≥1.0

### Rail Hub
- ID must start with `RAIL-`
- `connectedCountries` entries must be valid ISO3 codes

---

## Pipeline Commands

### Step 1: Validate raw data
```bash
npx tsx scripts/validate.ts --type airport --file src/data/infrastructure/raw/airports.json
```

Output: pass/fail per record with error details. Exit code 1 if any failures.

### Step 2: Run full import pipeline
```bash
npx tsx scripts/pipeline.ts --type airport --raw src/data/infrastructure/raw/airports.json
```

Output:
- `src/data/infrastructure/validated/airports.json` — valid records only
- `pipeline-report.json` — full report with all errors and warnings

### Step 3: Verify the output
```bash
npx tsx scripts/validate.ts --type airport --file src/data/infrastructure/validated/airports.json
```

Should show all green.

---

## Data Collection Workflow

```
1. Choose entity type
2. Open docs/prompts/GEMINI_PROMPTS.md
3. Copy the prompt for that entity type
4. Replace [COUNTRY/REGION] with target
5. Run in Gemini (2.0 Flash or 1.5 Pro)
6. Save output → src/data/[domain]/raw/[type]s.json
7. npx tsx scripts/validate.ts --type [type] --file [path]
8. Fix any validation errors (usually: missing sources, wrong coordinates)
9. npx tsx scripts/pipeline.ts --type [type] --raw [path]
10. Validated data ready in validated/ folder
11. Import into app via layer component
```

---

## Common Validation Errors and Fixes

| Error | Fix |
|---|---|
| `Coordinate [0, 0] is null island` | Look up real coordinates on Google Maps |
| `Longitude must be between -180 and 180` | Coordinates may be swapped (lat,lng instead of lng,lat) |
| `ISO3 code must be uppercase` | Run `normalizeISO3()` or uppercase the string |
| `Energy mix sums to 98%` | Add difference to "other" category or pro-rate |
| `Missing source attribution` | Every record needs at least 1 real source URL |
| `Duplicate ID` | Rename second occurrence with a suffix |
| `URL must be a valid URL` | Ensure https:// prefix, no spaces |
| `accessedAt must be YYYY-MM-DD` | Format date as 2024-03-15 not March 15 2024 |

---

## Normalization Utilities

The `scripts/normalize.ts` module provides:

```typescript
normalizeCoord(lng, lat)        // clamp to valid range, warn on [0,0]
normalizeCountryCode(raw)       // uppercase, validate against ISO3 list
normalizePctSum(values)         // check sum ≈ 100%, pro-rate if needed
sanitizeString(s)               // trim, collapse whitespace
normalizeUrl(url)               // parse and validate URL
normalizeDate(d)                // parse various date formats → YYYY-MM-DD
```

These run automatically during `pipeline.ts`. For manual use:
```bash
npx tsx scripts/normalize.ts    # runs smoke tests
```

---

## Adding a New Entity Type

1. Create `src/data/schemas/[type].ts` with Zod schema
2. Export from `src/data/schemas/index.ts` and add to `SCHEMA_MAP`
3. Create `src/data/templates/[type].template.json`
4. Add a prompt in `docs/prompts/GEMINI_PROMPTS.md`
5. Create `src/layers/[domain]/[Type]Layer.tsx` (can be placeholder)
6. Register in `src/layers/_core/registry.ts`

---

## Future Backend Migration

The pipeline is designed for zero-rewrite migration:

**Current**: Static JSON → validated/ → imported by layer components  
**Future**: API endpoint → same validated JSON format → same layer components

Only the data source changes. All schemas, validation, and rendering stay identical.

Migration path:
1. Deploy validation pipeline as a cloud function (AWS Lambda / Cloud Run)
2. Point Gemini output → cloud storage bucket
3. Trigger pipeline on upload
4. Layer components fetch from API instead of static import
5. No schema changes, no component rewrites

---

## Gemini Usage Guidelines

| Do | Don't |
|---|---|
| Use specific country/region scope | Ask for all countries at once |
| Request JSON only, no explanation | Ask for analysis or summaries |
| Specify the exact schema | Leave format open-ended |
| Ask for source URLs per record | Accept "according to World Bank" without URL |
| Set confidence based on sources found | Accept auto-assigned confidence |
| Verify coordinates on Google Maps | Trust AI-generated coordinates blindly |
| Use secondary fact-check on key numbers | Accept single-source capacity/volume figures |
