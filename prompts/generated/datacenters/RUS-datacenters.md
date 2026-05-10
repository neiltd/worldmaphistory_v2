# Gemini Research Task: Datacenters — Russia
Generated: 2026-05-10

## Instructions

Research the top 10 most strategically significant datacenters in **Russia**.

Focus on:
- Hyperscale cloud facilities (AWS, Google, Microsoft Azure, Alibaba Cloud, Huawei Cloud)
- Large colocation hubs (Equinix, Digital Realty, NTT)
- Government or military datacenters (only if publicly documented)
- Facilities with notable geopolitical significance (data sovereignty, state actor involvement, strategic location)

## Rules

- Return a **valid JSON array** — no explanation, no markdown
- Coordinates are **[longitude, latitude]** — use the datacenter campus location, not city center
- `null` for unknown capacity, PUE, or floor space — never estimate
- Only include facilities with a verifiable operator name and approximate location
- `geopoliticalNotes` is required — every datacenter must have strategic context

## Hallucination Prevention

- Verify facility existence on datacentermap.com or the operator's official infrastructure page
- Do not invent capacity figures — set to `null` if not publicly stated
- Coordinates: locate the actual campus on Google Maps satellite view
- `cloudRegion`: use exact AWS/Azure/GCP region code (e.g. "ap-southeast-1") if applicable

## Required Sources (at least 1)

- DataCenter Map: datacentermap.com
- Cloud provider infrastructure pages (aws.amazon.com/infrastructure, azure.microsoft.com, cloud.google.com/about/locations)
- Equinix: equinix.com/data-centers
- Data Center Dynamics: datacenterdynamics.com
- Operator investor relations or annual reports

## Output Schema

```json
[
  {
    "id": "DC-RUS-CITY-OPERATOR-CODE",
    "name": "Facility Name",
    "countryId": "RUS",
    "city": "City",
    "coordinates": [longitude, latitude],
    "type": "hyperscale",
    "status": "operational",
    "tierLevel": "3",
    "capacityMW": 200,
    "floorSpaceM2": null,
    "pue": 1.3,
    "operator": "Amazon Web Services",
    "owner": "Amazon",
    "yearOpened": 2014,
    "yearPlanned": null,
    "cloudRegion": "ap-southeast-1",
    "geopoliticalNotes": "Why this datacenter matters geopolitically — data sovereignty, state access, strategic location",
    "notes": null,
    "attribution": {
      "sources": [
        { "name": "AWS Global Infrastructure", "url": "https://aws.amazon.com/about-aws/global-infrastructure/regions_az/", "accessedAt": "2026-05-10" }
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
`"hyperscale"` | `"colocation"` | `"enterprise"` | `"government"` | `"edge"`

## tierLevel values
`"1"` | `"2"` | `"3"` | `"4"` (Uptime Institute Tier Classification)

## Save output to
`src/data/raw/datacenters/RUS-datacenters.raw.json`
