# Gemini Research Task: Food Security — Egypt
Generated: 2026-05-10

## Instructions

Research the food security profile for **Egypt (EGY)** using the Global Food Security Index (GFSI) and FAO data.

## Rules

- Return a **valid JSON array** with exactly one object
- All scores are on their respective official scales — do not convert or normalise
- `overallScore` is mandatory — all other fields are optional
- `null` for any pillar score you cannot find in the GFSI report
- Use the most recent GFSI year available

## Hallucination Prevention

- Use the GFSI interactive tool to find exact scores — do not estimate
- Cross-reference undernourished percentage with FAO FAOSTAT
- If GFSI does not cover this country, set all scores to `null` and set `confidence: "low"`
- Do not infer pillar scores from the overall score

## Required Sources (at least 2)

- GFSI: impact.economist.com/sustainability/project/food-security-index
- FAO FAOSTAT: fao.org/faostat
- World Food Programme: wfp.org/countries/Egypt
- World Bank Food Security: data.worldbank.org

## Output Schema

```json
[
  {
    "countryId": "EGY",
    "year": 2023,
    "overallScore": 58.4,
    "availability": 55.2,
    "access": 60.1,
    "utilization": 57.8,
    "stability": 59.3,
    "undernourishedPct": 14.6,
    "foodImportDependencyPct": 28.0,
    "cerealYieldKgHa": 2800,
    "climateVulnerability": "high",
    "conflictExposure": "low",
    "attribution": {
      "sources": [
        { "name": "GFSI 2023 — Egypt", "url": "https://impact.economist.com/sustainability/project/food-security-index/", "accessedAt": "2026-05-10" },
        { "name": "FAO FAOSTAT", "url": "https://www.fao.org/faostat/en/", "accessedAt": "2026-05-10" }
      ],
      "confidence": {
        "confidence": "high",
        "sourceCount": 2,
        "lastVerified": "2026-05-10"
      }
    }
  }
]
```

## climateVulnerability / conflictExposure values
`"none"` | `"low"` | `"medium"` | `"high"` | `"extreme"`

## Save output to
`src/data/raw/food-security/EGY-food-security.raw.json`
