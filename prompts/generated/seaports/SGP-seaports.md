# Gemini Research Task: Seaports — Singapore
Generated: 2026-05-10

## Instructions

Research the top 8 most strategically significant seaports in **Singapore**.

Focus on ports that are relevant to global supply chains, energy exports, military logistics, and geopolitical leverage — not just cargo volume rankings.

## Rules

- Return a **valid JSON array only** — no explanation, no markdown
- Coordinates are **[longitude, latitude]** — always longitude first
- Use `null` for unknown optional fields, never invent figures
- `annualThroughputTEU` for container ports, `annualThroughputTonnes` for bulk/oil/LNG
- `confidence: "high"` requires 2+ verifiable sources

## Hallucination Prevention

- Verify throughput data against official port authority or UNCTAD statistics
- Verify coordinates by locating the actual port entrance on Google Maps/Satellite
- If throughput is unknown, set to `null` — do not estimate
- Do not use the city center coordinates for the port location

## Required Sources (at least 2)

- Port authority official website
- UNCTAD Maritime Transport Report: unctad.org
- Lloyd's List port rankings
- World Shipping Council: worldshipping.org
- Port specific Wikipedia page (cross-reference only)

## Output Schema

```json
[
  {
    "id": "PORT-SGP-SLUG",
    "name": "Full Official Port Name",
    "countryId": "SGP",
    "city": "City Name",
    "coordinates": [longitude, latitude],
    "type": "container",
    "annualThroughputTEU": 12345678,
    "annualThroughputTonnes": null,
    "berthCount": 30,
    "maxDraftM": 18.5,
    "strategicImportance": "high",
    "riskLevel": "low",
    "geopoliticalNotes": "Why this port matters strategically",
    "notes": "Any relevant operational context",
    "attribution": {
      "sources": [
        { "name": "Source", "url": "https://...", "accessedAt": "2026-05-10" }
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
`container` | `oil` | `lng` | `bulk` | `multipurpose` | `naval` | `mixed`

## strategicImportance values
`"critical"` | `"high"` | `"medium"` | `"low"`

## Save output to
`src/data/raw/seaports/SGP-seaports.raw.json`
