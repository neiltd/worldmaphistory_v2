# Gemini Research Task: Airports — Egypt
Generated: 2026-05-10

## Instructions

Research the top 10 most strategically significant international airports in **Egypt (EGY)**.

Prioritize airports that matter for geopolitical analysis — logistics hubs, military-accessible airports, BRI corridor airports, and major connectivity nodes. Do not simply sort by passenger volume.

## Rules

- Return a **valid JSON array only** — no explanation, no markdown, no extra text
- Every record must include real, accessible source URLs
- Coordinates are **[longitude, latitude]** — GeoJSON order, not Google Maps order
- Never invent numbers — use `null` for unknown optional fields
- `confidence: "high"` requires 2+ sources that agree
- `accessedAt` must be today: 2026-05-10

## Hallucination Prevention

- Verify coordinates on Google Maps or official airport authority website before submitting
- Verify passenger/cargo volumes against ACI, IATA, or official airport annual report
- If you cannot find a reliable source URL for a specific field, set it to `null`
- Do not use Wikipedia as the sole source — always cross-reference

## Required Sources (use at least 2)

- ACI World: aci.aero
- Official airport authority website (e.g. dubaiairports.ae, heathrow.com)
- IATA: iata.org
- ICAO: icao.int
- OurAirports: ourairports.com (for coordinates)

## Output Schema

```json
[
  {
    "id": "IATA_CODE",
    "name": "Full Official Airport Name",
    "countryId": "EGY",
    "city": "City Name",
    "iata": "XXX",
    "icao": "XXXX",
    "coordinates": [longitude, latitude],
    "passengerVolume": 12345678,
    "cargoVolume": 123456,
    "runwayCount": 2,
    "elevationM": 10,
    "strategicImportance": "high",
    "geopoliticalNotes": "1-2 sentences on why this airport matters strategically for Egypt and the North Africa region",
    "notes": "Operational notes if relevant",
    "attribution": {
      "sources": [
        { "name": "Source Name", "url": "https://...", "accessedAt": "2026-05-10" },
        { "name": "Source Name 2", "url": "https://...", "accessedAt": "2026-05-10" }
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

## strategicImportance values
- `"critical"` — top global hub (top 20 worldwide), major military logistics node
- `"high"` — major regional hub, significant for national connectivity
- `"medium"` — secondary hub, important domestically
- `"low"` — minor international airport

## Save output to
`src/data/raw/airports/EGY-airports.raw.json`
