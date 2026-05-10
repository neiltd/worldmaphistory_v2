# Gemini Data Generation Prompts
## World Intelligence Platform

**Role**: Claude designs schemas and validates data. Gemini researches and generates data.  
**Critical rule**: Every value must be sourced. If you cannot find a reliable source URL, omit the field or set it to `null`. Do not invent numbers.

---

## Universal Rules (apply to ALL prompts)

```
HALLUCINATION PREVENTION:
- Only include data you can verify with a real URL
- Never invent coordinates — use Google Maps or official sources
- Never invent throughput/capacity numbers — cite the source
- Set confidence: "low" if you found only 1 source
- Set confidence: "medium" if you found 2 sources
- Set confidence: "high" if you found 3+ sources
- accessedAt must be today's date in YYYY-MM-DD format
- Leave optional fields as null rather than guessing

OUTPUT RULES:
- Return a valid JSON array only — no explanation text
- No markdown formatting inside JSON
- No trailing commas
- Remove the "_comment" field from templates
- Coordinates are [longitude, latitude] order (GeoJSON standard)
```

---

## 1. AIRPORTS

**Research task**: Find major international airports for [COUNTRY/REGION]. Focus on airports with strategic geopolitical significance — not just passenger volume.

```
Prompt to Gemini:

Research the top 10 major international airports in [COUNTRY or REGION].

For each airport, find:
1. Official name
2. IATA code (3 letters) and ICAO code (4 letters)
3. Exact GPS coordinates — use Google Maps or official airport authority
4. Annual passenger volume (most recent year available)
5. Annual cargo volume in metric tonnes
6. Number of runways
7. Why it matters strategically (power projection, logistics hub, BRI, etc.)

Rules:
- Coordinates must be [longitude, latitude] — double check the order
- Use the IATA code as the "id" field
- strategicImportance: "critical" for major hubs, "high" for regional hubs, "medium" for secondary, "low" for minor
- Include at least 2 source URLs per airport
- Source URLs must be real and currently accessible

Return as JSON array matching this schema exactly:
[
  {
    "id": "IATA_CODE",
    "name": "Full Official Name",
    "countryId": "ISO3",
    "city": "City Name",
    "iata": "XXX",
    "icao": "XXXX",
    "coordinates": [longitude, latitude],
    "passengerVolume": 12345678,
    "cargoVolume": 123456,
    "runwayCount": 2,
    "elevationM": 10,
    "strategicImportance": "high",
    "geopoliticalNotes": "Why this airport matters strategically in 1-2 sentences",
    "notes": "Any other relevant operational notes",
    "attribution": {
      "sources": [
        { "name": "Source Name", "url": "https://...", "accessedAt": "YYYY-MM-DD" }
      ],
      "confidence": { "confidence": "high", "sourceCount": 2, "lastVerified": "YYYY-MM-DD" }
    }
  }
]
```

**Reliable sources for airports**:
- ACI (Airports Council International): aci.aero
- Official airport authority websites
- ICAO: icao.int
- Wikipedia (with caution — verify with official source)
- OurAirports.com for coordinates

---

## 2. SEAPORTS

**Research task**: Find major seaports for [COUNTRY/REGION]. Prioritize strategic importance for global trade.

```
Prompt to Gemini:

Research the top 8 major seaports in [COUNTRY or REGION].

For each port, find:
1. Official port name
2. Port type: container / oil / lng / bulk / multipurpose / naval / mixed
3. Exact GPS coordinates (use Google Maps for the port entrance/berth area)
4. Annual throughput — TEU for container ports, metric tonnes for others
5. Number of berths
6. Maximum vessel draft in metres
7. Strategic geopolitical significance

Rules:
- ID format: PORT-[COUNTRY]-[NAME], e.g. PORT-SGP-SINGAPORE
- strategicImportance: "critical" for world-top-10, "high" for regional major, "medium" for national important
- Only include ports with annual throughput data you can verify

Return as JSON array:
[
  {
    "id": "PORT-XXX-NAME",
    "name": "Port Name",
    "countryId": "ISO3",
    "city": "City",
    "coordinates": [longitude, latitude],
    "type": "container",
    "annualThroughputTEU": 47300000,
    "annualThroughputTonnes": null,
    "berthCount": 50,
    "maxDraftM": 20,
    "strategicImportance": "high",
    "geopoliticalNotes": "Strategic significance in 1-2 sentences",
    "attribution": {
      "sources": [
        { "name": "Source", "url": "https://...", "accessedAt": "YYYY-MM-DD" }
      ],
      "confidence": { "confidence": "medium", "sourceCount": 1, "lastVerified": "YYYY-MM-DD" }
    }
  }
]
```

**Reliable sources for ports**:
- Port authority official websites
- Lloyd's List port rankings
- UNCTAD Maritime Transport Report: unctad.org
- World Shipping Council: worldshipping.org
- Statista port statistics (with source citation)

---

## 3. SUBMARINE CABLES

**Research task**: Find major active submarine internet cables for [REGION or OCEAN].

```
Prompt to Gemini:

Research active submarine internet cables in [REGION/OCEAN, e.g. "the Indian Ocean", "between East Asia and North America"].

For each cable, find:
1. Official cable name
2. All landing point locations with country and approximate GPS coordinates
3. Cable status: active / planned / construction / damaged / unknown
4. Cable length in km
5. Design capacity in Tbps
6. Year the cable was laid/activated
7. Owners/consortium members
8. Geopolitical vulnerabilities or significance

Rules:
- ID format: CABLE-[NAME-SLUG], e.g. CABLE-SEA-ME-WE-5
- route: simplified waypoint coordinates along the cable path (5-15 points is sufficient)
- Coordinates are [longitude, latitude] — critical to get the order right
- Landing point coordinates should be the actual coastal landing location, not city center
- Only include cables you can verify on TeleGeography or official sources

Return as JSON array:
[
  {
    "id": "CABLE-NAME",
    "name": "Cable Full Name",
    "route": [[lng, lat], [lng, lat], ...],
    "landingPoints": [
      { "name": "Location Name", "countryId": "ISO3", "coordinates": [lng, lat], "city": "City" }
    ],
    "status": "active",
    "lengthKm": 15000,
    "capacityTbps": 160,
    "yearLaid": 2020,
    "owners": ["Owner 1", "Owner 2"],
    "vulnerabilities": "Known physical or geopolitical risks",
    "geopoliticalNotes": "Why this cable matters strategically",
    "attribution": {
      "sources": [
        { "name": "TeleGeography SubmarineCableMap", "url": "https://www.submarinecablemap.com/...", "accessedAt": "YYYY-MM-DD" }
      ],
      "confidence": { "confidence": "high", "sourceCount": 1, "lastVerified": "YYYY-MM-DD" }
    }
  }
]
```

**Reliable sources for cables**:
- TeleGeography SubmarineCableMap: submarinecablemap.com (primary)
- ITU: itu.int
- Cable operator official websites
- APRICOT, PTC conference proceedings

---

## 4. POWER PLANTS

**Research task**: Find major power plants in [COUNTRY], especially nuclear, large hydro, and strategic energy facilities.

```
Prompt to Gemini:

Research major power plants in [COUNTRY]. Focus on:
- All nuclear power plants
- Large hydro facilities (>1000 MW)
- Major coal plants still operating
- Largest gas plants
- Notable solar/wind farms

For each facility, find:
1. Official facility name
2. Energy type (coal/gas/oil/nuclear/hydro/solar/wind/geothermal/biomass/other)
3. Operational status (operating/construction/planned/decommissioned/mothballed)
4. Exact GPS coordinates
5. Installed capacity in MW
6. Year commissioned
7. Owner/operator name

Rules:
- ID format: PLANT-[ISO3]-[NAME-SLUG], e.g. PLANT-CHN-SANXIA
- Do NOT include plants under 100 MW capacity unless they are strategically significant
- Nuclear plants are always strategic — include all of them

Return as JSON array:
[
  {
    "id": "PLANT-XXX-NAME",
    "name": "Plant Name",
    "countryId": "ISO3",
    "city": "Nearest City",
    "coordinates": [longitude, latitude],
    "type": "nuclear",
    "status": "operating",
    "capacityMW": 2000,
    "annualOutputGWh": null,
    "yearCommissioned": 1990,
    "operator": "Operator Name",
    "owner": "Owner Name",
    "strategicNote": "Only nuclear plant in Southeast Asia — critical for regional energy security",
    "attribution": {
      "sources": [
        { "name": "Global Energy Monitor", "url": "https://globalenergymonitor.org/...", "accessedAt": "YYYY-MM-DD" }
      ],
      "confidence": { "confidence": "medium", "sourceCount": 1, "lastVerified": "YYYY-MM-DD" }
    }
  }
]
```

**Reliable sources for power plants**:
- Global Energy Monitor: globalenergymonitor.org
- IAEA PRIS (nuclear): pris.iaea.org
- Global Power Plant Database (WRI): datasets.wri.org
- EIA: eia.gov
- Country energy ministry reports

---

## 5. COUNTRY UTILITY PROFILES

**Research task**: Generate a utility/energy profile for [COUNTRY] covering electricity mix, water stress, and food security.

```
Prompt to Gemini:

Research the utility and energy profile for [COUNTRY] for the most recent year available (prefer 2022 or 2023).

Find:
1. Total electricity consumption in TWh
2. Electricity mix by source (percentages must sum to 100%)
3. Water stress score (Aqueduct 0-5 scale, or equivalent)
4. Food security score (GFSI 0-100 scale)
5. AI readiness or adoption score (Oxford Insights AI Readiness Index or equivalent)
6. Internet and mobile penetration percentages

Rules:
- Electricity mix values must sum to exactly 100 (adjust minor rounding)
- If a source type is 0%, omit it (don't include zeros)
- waterStressScore: 0=no stress, 1=low, 2=low-medium, 3=medium-high, 4=high, 5=extremely high
- foodSecurityScore: GFSI 0-100 (100=most secure)

Return as JSON array (one object per country):
[
  {
    "countryId": "ISO3",
    "year": 2023,
    "electricityConsumptionTWh": 1600,
    "electricityProductionTWh": 1700,
    "electricityMix": {
      "coal": 70,
      "hydro": 12,
      "solar": 7,
      "wind": 5,
      "gas": 4,
      "nuclear": 2
    },
    "renewableSharePct": 24,
    "waterStressScore": 4.1,
    "waterWithdrawalPct": 34,
    "foodSecurityScore": 58,
    "aiAdoptionScore": 45,
    "internetPenetration": 45,
    "mobilePenetration": 84,
    "attribution": {
      "sources": [
        { "name": "IEA World Energy Balances", "url": "https://www.iea.org/data-and-statistics", "accessedAt": "YYYY-MM-DD" },
        { "name": "GFSI 2023", "url": "https://impact.economist.com/sustainability/project/food-security-index/", "accessedAt": "YYYY-MM-DD" }
      ],
      "confidence": { "confidence": "high", "sourceCount": 2, "lastVerified": "YYYY-MM-DD" }
    }
  }
]
```

**Reliable sources for utilities**:
- IEA (electricity): iea.org
- Aqueduct (water): wri.org/aqueduct
- GFSI (food security): impact.economist.com/sustainability
- Oxford Insights AI Readiness: oxfordinsights.com
- ITU (internet/mobile): itu.int/en/ITU-D/Statistics

---

## 6. GDP SECTOR COMPOSITION

```
Prompt to Gemini:

Research the GDP sector composition for [COUNTRY] for [YEAR].

Use World Bank, IMF, or country statistical office data.
Break down GDP into meaningful economic sectors (not just agriculture/industry/services — go deeper where data allows).

Rules:
- Sectors must sum to 100% (allow ±2% for rounding)
- Use real World Bank or IMF data — don't estimate
- Include gdpUsdBn if available (current USD)

Return as JSON:
[
  {
    "countryId": "ISO3",
    "year": 2023,
    "gdpUsdBn": 3700,
    "gdpPerCapita": 2600,
    "sectors": [
      { "sector": "Services", "percentOfGDP": 55, "notes": "Software and IT services are 8% of total" },
      { "sector": "Industry", "percentOfGDP": 26 },
      { "sector": "Agriculture", "percentOfGDP": 18 },
      { "sector": "Government", "percentOfGDP": 1 }
    ],
    "attribution": {
      "sources": [
        { "name": "World Bank DataBank", "url": "https://databank.worldbank.org/", "accessedAt": "YYYY-MM-DD" }
      ],
      "confidence": { "confidence": "high", "sourceCount": 1, "lastVerified": "YYYY-MM-DD" }
    }
  }
]
```

---

## 7. FOOD SECURITY

```
Prompt to Gemini:

Research the food security profile for [COUNTRY] using the Global Food Security Index (GFSI) and related sources.

Return as JSON:
[
  {
    "countryId": "ISO3",
    "year": 2023,
    "overallScore": 58.4,
    "availability": 55.2,
    "access": 60.1,
    "utilization": 57.8,
    "stability": 59.3,
    "undernourishedPct": 14.6,
    "foodImportDependencyPct": 28,
    "cerealYieldKgHa": 2800,
    "climateVulnerability": "high",
    "conflictExposure": "low",
    "attribution": {
      "sources": [
        { "name": "GFSI 2023", "url": "https://impact.economist.com/sustainability/project/food-security-index/", "accessedAt": "YYYY-MM-DD" },
        { "name": "FAO FAOSTAT", "url": "https://www.fao.org/faostat/", "accessedAt": "YYYY-MM-DD" }
      ],
      "confidence": { "confidence": "high", "sourceCount": 2, "lastVerified": "YYYY-MM-DD" }
    }
  }
]
```

---

## 8. AI ADOPTION

```
Prompt to Gemini:

Research the AI adoption and readiness profile for [COUNTRY].

Primary source: Oxford Insights AI Readiness Index (oxfordinsights.com)
Secondary: Stanford HAI AI Index, OECD AI Policy Observatory

Return as JSON:
[
  {
    "countryId": "ISO3",
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
    "topAiSectors": ["Finance", "Healthcare", "Manufacturing", "Defense"],
    "attribution": {
      "sources": [
        { "name": "Oxford Insights AI Readiness Index 2023", "url": "https://oxfordinsights.com/ai-readiness/ai-readiness-index/", "accessedAt": "YYYY-MM-DD" }
      ],
      "confidence": { "confidence": "medium", "sourceCount": 1, "lastVerified": "YYYY-MM-DD" }
    }
  }
]
```

---

## 9. DATACENTERS

```
Prompt to Gemini:

Research major datacenters in [COUNTRY]. Focus on:
- Hyperscale facilities (AWS, Google, Microsoft, Alibaba, Huawei)
- Large colocation facilities (Equinix, Digital Realty)
- Government/military datacenters if publicly known
- Any datacenter with known geopolitical significance

Rules:
- ID format: DC-[ISO3]-[CITY]-[OPERATOR-SLUG], e.g. DC-SGP-SINGAPORE-EQUINIX-SG1
- Only include facilities with verifiable location and operator
- If exact coordinates unavailable, use the datacenter campus general area (not city center)
- geopoliticalNotes: note state actor involvement, data sovereignty laws, strategic location

Return as JSON array:
[
  {
    "id": "DC-SGP-SINGAPORE-AWS-AP1",
    "name": "AWS Asia Pacific (Singapore) Region",
    "countryId": "SGP",
    "city": "Singapore",
    "coordinates": [103.8, 1.36],
    "type": "hyperscale",
    "status": "operational",
    "tierLevel": "4",
    "capacityMW": 200,
    "operator": "Amazon Web Services",
    "owner": "Amazon",
    "yearOpened": 2010,
    "cloudRegion": "ap-southeast-1",
    "geopoliticalNotes": "Singapore's data sovereignty laws require AWS to comply with MAS regulatory oversight. Strategic for Southeast Asian cloud infrastructure.",
    "attribution": {
      "sources": [
        { "name": "AWS Global Infrastructure", "url": "https://aws.amazon.com/about-aws/global-infrastructure/", "accessedAt": "YYYY-MM-DD" }
      ],
      "confidence": { "confidence": "medium", "sourceCount": 1, "lastVerified": "YYYY-MM-DD" }
    }
  }
]
```

**Reliable sources for datacenters**:
- DC Maps: datacentermap.com
- Cloud provider infrastructure pages (AWS, Azure, GCP, Alibaba Cloud)
- Equinix, Digital Realty investor materials
- Data Center Dynamics: datacenterdynamics.com

---

## 10. RAIL HUBS

```
Prompt to Gemini:

Research major rail hubs in [COUNTRY or REGION]. Focus on:
- International border crossing points
- Freight terminals with high strategic significance
- BRI (Belt and Road Initiative) rail nodes
- High-speed rail hubs with regional connectivity
- Military logistics rail nodes (if publicly known)

Rules:
- ID format: RAIL-[ISO3]-[CITY-SLUG], e.g. RAIL-CHN-CHENGDU
- isPartOfBRI: true for confirmed BRI rail corridor nodes
- connectedCountries: ISO3 codes of countries reachable by direct rail

Return as JSON array:
[
  {
    "id": "RAIL-CHN-CHENGDU",
    "name": "Chengdu International Railway Port",
    "countryId": "CHN",
    "city": "Chengdu",
    "coordinates": [104.07, 30.65],
    "type": "freight",
    "dailyPassengers": null,
    "annualFreightTonnes": 1800000,
    "connectedCountries": ["KAZ", "RUS", "DEU", "POL", "NLD"],
    "gaugeType": "standard",
    "lineCount": 4,
    "strategicImportance": "high",
    "isPartOfBRI": true,
    "geopoliticalNotes": "Major BRI freight hub connecting China to Europe via Central Asia. China-Europe Railway Express terminus.",
    "attribution": {
      "sources": [
        { "name": "China Railway Express Statistics", "url": "https://english.mofcom.gov.cn/", "accessedAt": "YYYY-MM-DD" }
      ],
      "confidence": { "confidence": "medium", "sourceCount": 1, "lastVerified": "YYYY-MM-DD" }
    }
  }
]
```

---

## Workflow Summary

```
1. Choose entity type (airport / port / cable / powerplant / etc.)
2. Copy the prompt template for that type
3. Replace [COUNTRY/REGION] with your target
4. Run prompt in Gemini with "2.0 Flash" or "1.5 Pro"
5. Save output to: src/data/infrastructure/raw/[type]s.json
6. Validate:  npx tsx scripts/validate.ts --type [type] --file path/to/raw.json
7. Fix errors reported by the validator
8. Import:    npx tsx scripts/pipeline.ts --type [type] --raw path/to/raw.json
9. Validated output → src/data/infrastructure/validated/[type]s.json
```
