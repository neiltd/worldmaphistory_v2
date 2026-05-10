# Gemini Research Task: AI Adoption — Germany
Generated: 2026-05-10

## Instructions

Research the AI readiness, adoption, and investment profile for **Germany (DEU)** for the most recent year available (prefer 2023).

## Rules

- Return a **valid JSON array** with exactly one object
- All scores are 0–100 unless otherwise noted
- `null` for any metric you cannot find in a reliable source
- Never estimate or interpolate scores from rankings alone

## Hallucination Prevention

- `aiReadinessScore`: must come from Oxford Insights AI Readiness Index — do not estimate
- `aiInvestmentUsdM`: use Dealroom, PitchBook, or government reports — not guesses
- `aiStartupCount`: use Crunchbase or country-specific tech reports
- If a country is not ranked in Oxford Insights, set `aiReadinessScore: null` and note in attribution

## Required Sources (at least 1)

- Oxford Insights AI Readiness Index: oxfordinsights.com/ai-readiness/ai-readiness-index
- Stanford HAI AI Index: aiindex.stanford.edu
- OECD AI Policy Observatory: oecd.ai
- Government national AI strategy documents (if any)

## Output Schema

```json
[
  {
    "countryId": "DEU",
    "year": 2023,
    "aiReadinessScore": 72.4,
    "aiAdoptionScore": 65,
    "aiTalentScore": 58,
    "aiInvestmentUsdM": 4200,
    "aiStartupCount": 890,
    "aiUnicornCount": 12,
    "hasNationalAiStrategy": true,
    "aiStrategyYear": 2018,
    "aiPolicyScore": 7.2,
    "cloudReadinessPct": null,
    "broadbandPenetrationPct": 88,
    "topAiSectors": ["Finance", "Healthcare", "Manufacturing", "Defense"],
    "attribution": {
      "sources": [
        { "name": "Oxford Insights AI Readiness Index 2023", "url": "https://oxfordinsights.com/ai-readiness/ai-readiness-index/", "accessedAt": "2026-05-10" }
      ],
      "confidence": {
        "confidence": "medium",
        "sourceCount": 1,
        "lastVerified": "2026-05-10"
      }
    }
  }
]
```

## Save output to
`src/data/raw/ai-adoption/DEU-ai-adoption.raw.json`
