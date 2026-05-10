# Gemini Research Task: Country Utility Profile — Bangladesh
Generated: 2026-05-10

## Instructions

Research the energy, water, and digital utility profile for **Bangladesh (BGD)** for the most recent year with complete data (prefer 2022 or 2023).

## Rules

- Return a **valid JSON array** with exactly one object for Bangladesh
- `electricityMix` percentages **must sum to exactly 100** — adjust rounding if needed
- If a source type is 0% or negligible, omit it entirely (no zero values)
- `null` for any value you cannot find — never estimate
- `waterStressScore`: Aqueduct scale 0–5 (0=no stress, 5=extreme)
- `foodSecurityScore`: GFSI scale 0–100 (100=most food secure)

## Hallucination Prevention

- Electricity mix: use IEA, BP Statistical Review, or Our World in Data — verify the year
- Confirm the mix sums to 100 before submitting — adjust largest category if needed for rounding
- Water stress: use WRI Aqueduct specifically — do not estimate
- Do not blend data from different years without noting it

## Required Sources (at least 2)

- IEA World Energy Balances: iea.org/data-and-statistics
- BP Statistical Review of World Energy: bp.com/statisticalreview
- WRI Aqueduct: wri.org/aqueduct
- GFSI: impact.economist.com/sustainability/project/food-security-index
- Our World in Data: ourworldindata.org/energy

## Output Schema

```json
[
  {
    "countryId": "BGD",
    "year": 2023,
    "electricityConsumptionTWh": 1600,
    "electricityProductionTWh": 1700,
    "electricityMix": {
      "coal": 45,
      "gas": 25,
      "hydro": 12,
      "solar": 8,
      "wind": 5,
      "nuclear": 3,
      "otherRenewables": 2
    },
    "renewableSharePct": 27,
    "waterStressScore": 3.2,
    "waterWithdrawalPct": 28,
    "foodSecurityScore": 68,
    "aiAdoptionScore": 52,
    "internetPenetration": 65,
    "mobilePenetration": 95,
    "attribution": {
      "sources": [
        { "name": "IEA World Energy Balances 2023", "url": "https://www.iea.org/data-and-statistics/data-product/world-energy-balances", "accessedAt": "2026-05-10" },
        { "name": "WRI Aqueduct 3.0", "url": "https://www.wri.org/aqueduct", "accessedAt": "2026-05-10" }
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

## electricityMix keys (use only those with data)
`coal` | `gas` | `oil` | `nuclear` | `hydro` | `solar` | `wind` | `otherRenewables` | `other`

## Save output to
`src/data/raw/utilities/BGD-utilities.raw.json`
