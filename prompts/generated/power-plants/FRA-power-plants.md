# Gemini Research Task: Power Plants — France
Generated: 2026-05-10

## Instructions

Research major power plants in **France (FRA)**.

Prioritize:
1. **All nuclear power plants** (regardless of size — always strategically significant)
2. Large hydro dams (capacity >500 MW)
3. Major coal plants still operating (capacity >500 MW)
4. Largest gas power plants
5. Notable large-scale solar/wind farms

Limit to the top 15 most strategically significant facilities.

## Rules

- Return a **valid JSON array only** — no explanation, no markdown
- Coordinates are **[longitude, latitude]** — longitude first
- `capacityMW` is installed capacity, not current output
- Use `null` for any field you cannot verify — never estimate capacity
- Only include facilities with capacity ≥ 100 MW (exception: all nuclear plants)

## Hallucination Prevention

- Verify plant existence and capacity on Global Energy Monitor before including
- Nuclear: cross-reference with IAEA PRIS database (pris.iaea.org)
- Coordinates: locate the actual facility on satellite maps, not the nearest city
- Do not include plants you cannot find on Global Energy Monitor or IAEA PRIS

## Required Sources (at least 1)

- Global Energy Monitor: globalenergymonitor.org (primary)
- IAEA PRIS (nuclear only): pris.iaea.org
- WRI Global Power Plant Database: datasets.wri.org/dataset/globalpowerplantdatabase
- EIA: eia.gov (for US plants)
- Country energy ministry reports

## Output Schema

```json
[
  {
    "id": "PLANT-FRA-NAME-SLUG",
    "name": "Official Plant Name",
    "countryId": "FRA",
    "city": "Nearest Town/City",
    "coordinates": [longitude, latitude],
    "type": "nuclear",
    "status": "operating",
    "capacityMW": 2000,
    "annualOutputGWh": null,
    "yearCommissioned": 1990,
    "yearRetirement": null,
    "operator": "Operator Company Name",
    "owner": "Owner/Government Entity",
    "strategicNote": "Why this facility is geopolitically significant",
    "notes": null,
    "attribution": {
      "sources": [
        { "name": "Global Energy Monitor", "url": "https://globalenergymonitor.org/...", "accessedAt": "2026-05-10" }
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

## type values
`"coal"` | `"gas"` | `"oil"` | `"nuclear"` | `"hydro"` | `"solar"` | `"wind"` | `"geothermal"` | `"biomass"` | `"other"`

## status values
`"operating"` | `"construction"` | `"planned"` | `"decommissioned"` | `"mothballed"`

## Save output to
`src/data/raw/power-plants/FRA-power-plants.raw.json`
