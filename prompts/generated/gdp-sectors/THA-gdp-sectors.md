# Gemini Research Task: GDP Sector Composition — Thailand
Generated: 2026-05-10

## Instructions

Research the GDP sector composition for **Thailand (THA)** for the most recent year available (prefer 2022 or 2023).

Break down GDP into meaningful economic sectors — go beyond just Agriculture / Industry / Services where data allows. For resource-dependent economies, identify the key commodity sectors specifically (e.g. "Oil & Gas", "Mining").

## Rules

- Return a **valid JSON array** with exactly one object
- Sector percentages **must sum to 100** — adjust largest sector for rounding
- Use real World Bank, IMF, or national statistics office data
- `null` for optional fields you cannot find
- Include `gdpUsdBn` in current USD if available

## Hallucination Prevention

- Cross-reference World Bank DataBank and IMF World Economic Outlook
- Never estimate sector percentages — use official national accounts data
- If only broad categories are available (Agriculture/Industry/Services), use those — don't subdivide without data
- Verify the year — use the most recent year where all sectors are reported

## Required Sources (at least 1)

- World Bank DataBank: databank.worldbank.org
- IMF World Economic Outlook: imf.org/en/Publications/WEO
- Country national statistics office
- CIA World Factbook (cross-reference only): cia.gov/the-world-factbook

## Output Schema

```json
[
  {
    "countryId": "THA",
    "year": 2023,
    "gdpUsdBn": 3700,
    "gdpPerCapita": 2600,
    "sectors": [
      { "sector": "Services", "percentOfGDP": 55, "notes": "IT services 8% of GDP" },
      { "sector": "Industry", "percentOfGDP": 26, "notes": null },
      { "sector": "Agriculture", "percentOfGDP": 18, "notes": "Rice and wheat dominant" },
      { "sector": "Government", "percentOfGDP": 1, "notes": null }
    ],
    "attribution": {
      "sources": [
        { "name": "World Bank DataBank 2023", "url": "https://databank.worldbank.org/", "accessedAt": "2026-05-10" }
      ],
      "confidence": {
        "confidence": "high",
        "sourceCount": 1,
        "lastVerified": "2026-05-10"
      }
    }
  }
]
```

## Save output to
`src/data/raw/gdp-sectors/THA-gdp-sectors.raw.json`
