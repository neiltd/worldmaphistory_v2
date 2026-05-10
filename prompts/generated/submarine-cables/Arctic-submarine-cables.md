# Gemini Research Task: Submarine Internet Cables — Arctic
Generated: 2026-05-10

## Instructions

Research active and notable submarine internet cables in or crossing **Arctic**.

Focus on cables with geopolitical significance — strategic chokepoints, state-controlled landing stations, cables linking rival powers, and recently damaged cables.

## Rules

- Return a **valid JSON array only** — no explanation, no markdown
- `route` is a simplified path with 5–15 waypoint coordinates
- Coordinates are **[longitude, latitude]** — longitude first
- Landing point coordinates must be the actual coastal landing location, not city center
- `null` for unknown optional fields — never invent capacity or ownership
- Primary source: TeleGeography SubmarineCableMap (submarinecablemap.com)

## Hallucination Prevention

- Every cable must exist on TeleGeography's map — verify before including
- Do not invent capacity (Tbps) if not publicly stated — use `null`
- Landing point coordinates: use satellite maps to locate the actual beach landing
- `owners` must be the actual consortium members — verify against TeleGeography or cable operator website
- Do not include planned cables unless `status: "planned"` is explicitly set

## Required Sources (at least 1)

- TeleGeography SubmarineCableMap: submarinecablemap.com (required)
- Cable operator official website
- ITU: itu.int
- Submarine Cable Networks: submarinenetworks.com

## Output Schema

```json
[
  {
    "id": "CABLE-NAME-SLUG",
    "name": "Cable Full Official Name",
    "route": [
      [longitude, latitude],
      [longitude, latitude]
    ],
    "landingPoints": [
      {
        "name": "Location Name",
        "countryId": "ISO3",
        "coordinates": [longitude, latitude],
        "city": "Nearest City"
      }
    ],
    "status": "active",
    "lengthKm": 15000,
    "capacityTbps": 160,
    "yearLaid": 2020,
    "yearRepaired": null,
    "owners": ["Owner 1", "Owner 2"],
    "vulnerabilities": "Known physical or geopolitical risk factors",
    "geopoliticalNotes": "Why this cable matters for regional geopolitics",
    "notes": null,
    "attribution": {
      "sources": [
        { "name": "TeleGeography SubmarineCableMap", "url": "https://www.submarinecablemap.com/submarine-cable/CABLE-NAME", "accessedAt": "2026-05-10" }
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

## status values
`"active"` | `"planned"` | `"construction"` | `"damaged"` | `"decommissioned"` | `"unknown"`

## Save output to
`src/data/raw/submarine-cables/Arctic-submarine-cables.raw.json`
