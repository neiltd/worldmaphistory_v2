# Gemini Research Task: Rail Hubs — Thailand
Generated: 2026-05-10

## Instructions

Research the top 8 most strategically significant rail hubs in **Thailand**.

Prioritize:
- International border crossing freight terminals
- BRI (Belt and Road Initiative) rail corridor nodes
- High-speed rail hubs with regional connectivity
- Major freight terminals serving ports or industrial zones
- Military logistics rail nodes (only if publicly documented)

## Rules

- Return a **valid JSON array** — no explanation, no markdown
- Coordinates are **[longitude, latitude]** — locate the actual rail yard/station
- `connectedCountries` must only contain valid ISO3 codes
- `isPartOfBRI` must be verifiable — set to `false` if uncertain
- `null` for traffic figures you cannot find in a verified source

## Hallucination Prevention

- `dailyPassengers` and `annualFreightTonnes`: cite specific source — do not estimate
- `connectedCountries`: only include countries reachable by direct rail without vessel transfer
- BRI designation: verify against official BRI project lists or Chinese government sources
- Coordinates: use the actual station or freight yard location on satellite maps

## Required Sources (at least 1)

- International Union of Railways: uic.org
- Country rail authority or ministry of transport
- China Railway Express (for BRI): railway.gov.cn
- OSM (OpenStreetMap): openstreetmap.org (for coordinates)
- Jane's Transport (if accessible)

## Output Schema

```json
[
  {
    "id": "RAIL-THA-CITY-SLUG",
    "name": "Hub Official Name",
    "countryId": "THA",
    "city": "City Name",
    "coordinates": [longitude, latitude],
    "type": "freight",
    "dailyPassengers": null,
    "annualFreightTonnes": 1800000,
    "connectedCountries": ["KAZ", "RUS", "DEU"],
    "gaugeType": "standard",
    "lineCount": 4,
    "strategicImportance": "high",
    "isPartOfBRI": true,
    "geopoliticalNotes": "Why this rail hub matters strategically — corridor role, military logistics, BRI significance",
    "notes": null,
    "attribution": {
      "sources": [
        { "name": "China Railway Express Statistics", "url": "https://english.mofcom.gov.cn/", "accessedAt": "2026-05-10" }
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
`"passenger"` | `"freight"` | `"mixed"` | `"high_speed"` | `"border_crossing"` | `"port_interface"` | `"military"`

## gaugeType values
`"standard"` | `"broad"` | `"narrow"` | `"mixed"`

## Save output to
`src/data/raw/rail-hubs/THA-rail-hubs.raw.json`
