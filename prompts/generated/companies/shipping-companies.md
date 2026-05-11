# Gemini Research Task: Company Intelligence Profiles — Shipping & Logistics
Generated: 2026-05-11

## Your Role

You are a geopolitical investment intelligence researcher. Your task is to build structured company profiles that map how each company connects to the geopolitical world — chokepoints, supply chains, country risks, commodity dependencies, and infrastructure.

This is NOT a financial analysis task. Do NOT provide buy/sell recommendations or price targets.
This IS a geopolitical exposure mapping task.

---

## Companies to Research

1. **FDX** — FedEx Corporation (NYSE)
   *Why it matters: Air/ground freight — Red Sea beneficiary, China exposure*

2. **UPS** — United Parcel Service (NYSE)
   *Why it matters: Global logistics — supply chain disruption exposure*

3. **ZIM** — ZIM Integrated Shipping Services (NYSE)
   *Why it matters: Container shipping — directly affected by Red Sea crisis*

4. **MATX** — Matson Inc. (NYSE)
   *Why it matters: Trans-Pacific shipping — US-China trade routes*

5. **GXO** — GXO Logistics (NYSE)
   *Why it matters: Contract logistics — European supply chain exposure*

---

## Instructions

For each company above:

1. Find their most recent **10-K annual filing** on SEC EDGAR (sec.gov/cgi-bin/browse-edgar)
2. Read **Item 1A — Risk Factors** carefully
3. Read **Item 1 — Business** for supply chain and geography
4. Read **Note on Geographic Revenue** in the financial statements
5. Extract the data below

---

## Rules — READ CAREFULLY

- Return a **valid JSON array** — no explanation, no markdown, no extra text
- Every `verbatimText` field must be the EXACT words from the filing — never paraphrase
- Every source must have a real, working URL
- Use `null` for any field you cannot find — never estimate or invent
- `revenueByGeography` must match the exact segments reported in the filing
- `flags` must be verifiable — only set `true` if the filing explicitly mentions it
- `secCik` is the 10-digit Central Index Key from SEC EDGAR
- `confidence: "high"` requires data from the actual 10-K, not secondary sources
- `accessedAt` must be today: 2026-05-11

---

## Hallucination Prevention

- Every percentage in `revenueByGeography` must be from the actual filing — not estimated
- `keySuppliers` names must appear in the 10-K or earnings call — not guessed
- Coordinates in `infrastructureDependencies` are not needed — use the entity ID only
- If a company's 10-K does not mention a specific risk (e.g. Red Sea), set that flag to `false`
- Do not add risks that are not in the filing or verifiable public disclosures

---

## Required Sources

For each company, cite:
1. The specific 10-K filing (SEC EDGAR direct link)
2. The specific section within the filing (e.g., "Item 1A, Risk Factors, p.24")
3. Any additional source used (earnings call transcript, investor day, press release)

---

## Output Schema

```json
[
  {
    "id": "COMPANY-{TICKER}",
    "ticker": "NVDA",
    "name": "NVIDIA Corporation",
    "exchange": "NASDAQ",
    "gicsSector": "Information Technology",
    "gicsIndustryGroup": "Semiconductors & Semiconductor Equipment",
    "gicsIndustry": "Semiconductors",
    "countryOfIncorporation": "USA",
    "countryOfHQ": "USA",
    "marketCapUsdBn": 2200,
    "revenueUsdBn": 60.9,
    "fiscalYear": 2024,

    "description": "2-3 sentence business description",
    "businessModel": "How the company makes money — revenue model",
    "geopoliticalSummary": "2-3 sentences on overall geopolitical exposure from the 10-K perspective",

    "revenueByGeography": [
      {
        "region": "United States",
        "countryIds": ["USA"],
        "percentOfRevenue": 45,
        "revenueUsdBn": 27.4,
        "year": 2024,
        "note": "Exact segment name from filing: 'United States'"
      },
      {
        "region": "China (including Hong Kong)",
        "countryIds": ["CHN"],
        "percentOfRevenue": 17,
        "revenueUsdBn": 10.4,
        "year": 2024,
        "note": "Export control restrictions apply to H100/A100 class GPUs"
      }
    ],

    "keySuppliers": [
      {
        "role": "manufacturer",
        "name": "TSMC",
        "countryId": "TWN",
        "city": "Hsinchu",
        "percentOfSupply": 92,
        "isConcentrationRisk": true,
        "strategicNote": "TSMC is the sole manufacturer of NVIDIA's advanced GPUs at ≤5nm node. Verbatim from 10-K: '[exact quote from filing about TSMC dependency]'"
      }
    ],

    "keyCustomers": [
      {
        "role": "customer",
        "name": "Microsoft",
        "countryId": "USA",
        "percentOfRevenue": null,
        "isConcentrationRisk": false,
        "strategicNote": "Hyperscaler customer for AI training infrastructure"
      }
    ],

    "manufacturingLocations": [
      {
        "countryId": "TWN",
        "city": "Hsinchu",
        "percentOfCapacity": 92,
        "note": "TSMC foundry — advanced node production"
      }
    ],

    "commodityDependencies": [
      {
        "commodity": "Advanced Semiconductors (CoWoS packaging)",
        "role": "input",
        "percentOfCOGS": null,
        "primarySupplyCountries": ["TWN"],
        "isHedged": false,
        "geopoliticalRisk": "critical",
        "note": "CoWoS advanced packaging is sole-sourced from TSMC Taiwan"
      }
    ],

    "regionalExposures": [
      {
        "region": "China",
        "countryIds": ["CHN"],
        "exposureType": "revenue",
        "magnitude": "high",
        "note": "US export controls restrict H100/A100 sales to China. Company developed A800/H800 chips for China market but those were also restricted in Oct 2023.",
        "filingRefs": []
      },
      {
        "region": "Taiwan",
        "countryIds": ["TWN"],
        "exposureType": "supply-chain",
        "magnitude": "critical",
        "note": "Manufacturing concentration in Taiwan creates existential supply chain risk. Verbatim from 10-K Item 1A: '[paste exact risk factor text about Taiwan]'",
        "filingRefs": []
      }
    ],

    "infrastructureDependencies": [
      {
        "type": "trade-route",
        "entityId": "ROUTE-TRANSPAC-NORTH",
        "name": "Trans-Pacific (North) Shipping Route",
        "importance": "high",
        "note": "GPU shipments from TSMC Taiwan to US datacenters transit trans-Pacific routes"
      }
    ],

    "flags": {
      "chinaRevenuePct": 17,
      "chinaManufacturingDependent": false,
      "russiaExposed": false,
      "middleEastEnergyDependent": false,
      "taiwanSemiconductorDependent": true,
      "redSeaTradeRouteDependent": false,
      "straitOfHormuzDependent": false,
      "sanctionsSensitive": true,
      "exportControlSensitive": true
    },

    "latestFilingId": "FILING-NVDA-10K-2024",
    "secCik": "0001045810",
    "secEdgarUrl": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=10-K&dateb=&owner=include&count=10",

    "attribution": {
      "sources": [
        {
          "name": "NVIDIA 10-K FY2024 — Item 1A Risk Factors",
          "url": "https://www.sec.gov/Archives/edgar/data/1045810/000104581024000029/nvda-20240128.htm",
          "type": "filing",
          "accessedAt": "2026-05-11",
          "verbatimQuote": "[Copy the exact opening sentence of the most relevant risk factor here]"
        }
      ],
      "confidence": "high",
      "lastVerified": "2026-05-11",
      "generatedBy": "ai-assisted"
    }
  }
]
```

---

## Key Fields Priority (in order of importance)

1. `revenueByGeography` — exact percentages from filing
2. `keySuppliers` — named suppliers from 10-K
3. `regionalExposures` with verbatim filing quotes
4. `flags` — binary risk flags
5. `commodityDependencies`
6. `secCik` and `secEdgarUrl`
7. All other fields

---

## Save output to

`src/data/raw/companies/shipping-companies.raw.json`
