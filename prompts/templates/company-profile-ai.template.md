# Gemini Research Task: Company Intelligence Profiles — {{sectorName}}
Generated: {{currentDate}}

## Your Role

You are a geopolitical investment intelligence researcher specializing in the AI infrastructure supply chain. Your task is to map how each company positions within the global AI compute stack — who controls what, who depends on whom, and where the geopolitical chokepoints are.

This is NOT a financial analysis task. Do NOT provide price targets or buy/sell recommendations.
This IS an AI market position + geopolitical exposure mapping task.

---

## Companies to Research

{{companyList}}

---

## Instructions

For each company:

1. Find their most recent **10-K annual filing** on SEC EDGAR (sec.gov/cgi-bin/browse-edgar)
2. Read **Item 1A — Risk Factors** — extract geopolitical risk verbatim
3. Read **Item 1 — Business** — map supply chain and customers
4. Read the **financial statements** — geographic revenue breakdown
5. Research their **AI market position** from:
   - Earnings call transcripts (Seeking Alpha, company IR page)
   - Analyst reports (Morgan Stanley, Goldman Sachs, Deutsche Bank AI chip reports)
   - Industry data (IDC, TechInsights, Gartner)
   - Company press releases on AI partnerships

---

## Rules — READ CAREFULLY

- Return a **valid JSON array** — no explanation, no markdown, no extra text
- `verbatimText` must be EXACT words from source — never paraphrase
- Every `source` must have a real, working URL
- `null` for any field you cannot find or verify — never invent numbers
- Market share estimates: cite the specific analyst report or source
- `confidence: "high"` = data from 10-K filing; `"medium"` = analyst report; `"low"` = estimate
- `accessedAt` must be today: {{currentDate}}

---

## Hallucination Prevention

- Market share percentages must cite a specific source (e.g. "IDC Q4 2024", "Morgan Stanley AI chip report Jan 2024")
- If market share data is not publicly available, use `null` — do not estimate
- Custom ASIC partnerships must be confirmed in earnings calls or press releases — not assumed
- HBM relationships must be from verified supply agreements or public disclosures
- Do not extrapolate forward-looking statements as current facts

---

## Output Schema

```json
[
  {
    "id": "COMPANY-{TICKER}",
    "ticker": "AVGO",
    "name": "Broadcom Inc.",
    "exchange": "NASDAQ",
    "gicsSector": "Information Technology",
    "gicsIndustryGroup": "Semiconductors & Semiconductor Equipment",
    "gicsIndustry": "Semiconductors",
    "countryOfIncorporation": "USA",
    "countryOfHQ": "USA",
    "marketCapUsdBn": 780,
    "revenueUsdBn": 51.6,
    "fiscalYear": 2024,

    "description": "2-3 sentence business description",
    "businessModel": "How the company makes money in AI specifically",
    "geopoliticalSummary": "2-3 sentences on geopolitical exposure from 10-K",

    "revenueByGeography": [
      {
        "region": "United States",
        "countryIds": ["USA"],
        "percentOfRevenue": 38,
        "revenueUsdBn": 19.6,
        "year": 2024,
        "note": "Exact filing segment name"
      },
      {
        "region": "China",
        "countryIds": ["CHN"],
        "percentOfRevenue": 35,
        "revenueUsdBn": 18.1,
        "year": 2024,
        "note": "Heavy China exposure — networking chips sold to Huawei before restrictions"
      }
    ],

    "keySuppliers": [
      {
        "role": "manufacturer",
        "name": "TSMC",
        "countryId": "TWN",
        "percentOfSupply": 95,
        "isConcentrationRisk": true,
        "strategicNote": "Verbatim from 10-K: '[exact quote about foundry dependency]'"
      }
    ],

    "keyCustomers": [
      {
        "role": "custom-asic-partner",
        "name": "Google",
        "countryId": "USA",
        "percentOfRevenue": null,
        "isConcentrationRisk": false,
        "strategicNote": "Builds Google's TPU (Tensor Processing Unit) AI chips"
      }
    ],

    "manufacturingLocations": [
      {
        "countryId": "TWN",
        "city": "Hsinchu",
        "percentOfCapacity": 95,
        "note": "TSMC foundry — fabless model"
      }
    ],

    "commodityDependencies": [
      {
        "commodity": "Advanced Logic Chips (3nm/5nm)",
        "role": "input",
        "primarySupplyCountries": ["TWN"],
        "isHedged": false,
        "geopoliticalRisk": "critical",
        "note": "Fabless — entirely dependent on TSMC Taiwan for advanced nodes"
      }
    ],

    "regionalExposures": [
      {
        "region": "Taiwan",
        "countryIds": ["TWN"],
        "exposureType": "supply-chain",
        "magnitude": "critical",
        "note": "All advanced chip manufacturing in Taiwan. Verbatim from 10-K Item 1A: '[exact Taiwan risk factor text]'",
        "filingRefs": []
      },
      {
        "region": "China",
        "countryIds": ["CHN"],
        "exposureType": "revenue",
        "magnitude": "high",
        "note": "China historically ~35% of revenue. Export controls restrict networking chips to Huawei. Verbatim from 10-K: '[exact China risk factor text]'",
        "filingRefs": []
      }
    ],

    "infrastructureDependencies": [
      {
        "type": "trade-route",
        "entityId": "ROUTE-TRANSPAC-NORTH",
        "name": "Trans-Pacific (North) Shipping Route",
        "importance": "high",
        "note": "Chip shipments from TSMC Taiwan to US customers"
      }
    ],

    "flags": {
      "chinaRevenuePct": 35,
      "chinaManufacturingDependent": false,
      "russiaExposed": false,
      "middleEastEnergyDependent": false,
      "taiwanSemiconductorDependent": true,
      "redSeaTradeRouteDependent": false,
      "straitOfHormuzDependent": false,
      "sanctionsSensitive": true,
      "exportControlSensitive": true
    },

    "aiMarketPosition": {
      "primaryAIRole": "custom-asic",
      "aiRevenueEstimateUsdBn": 15.0,
      "aiRevenueShareOfTotal": 29,

      "trainingMarketSharePct": null,
      "inferenceMarketSharePct": null,
      "customASICMarketSharePct": 55,

      "aiComputeStack": {
        "layer": "Silicon Design",
        "what": "Custom AI accelerators (XPUs) designed for specific hyperscaler workloads",
        "replaceabilityRisk": "low",
        "note": "Broadcom's custom ASICs are co-designed with customers over 2-3 years — very sticky relationship"
      },

      "hbmRelationship": {
        "role": "none",
        "note": "Custom ASICs use HBM but Broadcom does not produce or control HBM supply — depends on SK Hynix/Micron/Samsung"
      },

      "customASICPartnerships": [
        {
          "customer": "Google",
          "chipName": "TPU (Tensor Processing Unit) v4/v5",
          "node": "5nm",
          "confirmed": true,
          "source": "Google earnings call, Broadcom investor day",
          "note": "TPU is Google's primary AI training chip — Broadcom is the designer/manufacturer partner"
        },
        {
          "customer": "Meta",
          "chipName": "MTIA (Meta Training and Inference Accelerator)",
          "node": "5nm",
          "confirmed": true,
          "source": "Meta AI infrastructure blog, Broadcom 10-K",
          "note": "Broadcom designs Meta's custom inference chip"
        },
        {
          "customer": "Apple",
          "chipName": "Neural Engine (inside M-series chips)",
          "node": "3nm",
          "confirmed": true,
          "source": "Industry analysis, Bloomberg reporting",
          "note": "Broadcom supplies networking chips and co-designs Apple's connectivity silicon"
        }
      ],

      "keyAICustomers": [
        {
          "name": "Google",
          "relationship": "custom-asic-partner",
          "estimatedSpendUsdBn": 8,
          "note": "TPU is Google's primary training chip. Agreement confirmed in Broadcom earnings call FY2024."
        },
        {
          "name": "Meta",
          "relationship": "custom-asic-partner",
          "estimatedSpendUsdBn": 3,
          "note": "MTIA chips for Meta's AI inference at scale"
        }
      ],

      "vsNVIDIA": {
        "relationship": "competitor",
        "note": "Broadcom custom ASICs compete with NVIDIA GPUs for hyperscaler AI workloads. Custom ASICs are cheaper per FLOP for fixed workloads but lack NVIDIA's programmability and ecosystem (CUDA)."
      },

      "competitiveMoat": [
        "2-3 year co-design lock-in with each hyperscaler customer",
        "Only company with proven ability to deliver 1 trillion parameter model training ASICs",
        "Networking monopoly (Tomahawk switches power all major AI clusters)",
        "Both the silicon AND the interconnect for AI clusters"
      ],

      "keyAIRisks": [
        "Hyperscalers could bring custom ASIC design in-house (Google partially has with DeepMind hardware team)",
        "NVIDIA's CUDA ecosystem creates software lock-in that custom ASICs cannot match",
        "Export controls reduce addressable China market for AI chips",
        "TSMC dependency — if Taiwan disrupted, custom ASIC production stops"
      ],

      "aiMarketShareSources": [
        {
          "metric": "Custom AI ASIC market share",
          "value": "~55% of non-NVIDIA AI silicon",
          "source": "Morgan Stanley AI chip report Q1 2024",
          "url": null,
          "note": "Estimate — exact figure varies by analyst"
        }
      ]
    },

    "latestFilingId": "FILING-AVGO-10K-2024",
    "secCik": "0001730168",
    "secEdgarUrl": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001730168&type=10-K",

    "attribution": {
      "sources": [
        {
          "name": "Broadcom 10-K FY2024 — Item 1A Risk Factors",
          "url": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001730168&type=10-K",
          "type": "filing",
          "accessedAt": "{{currentDate}}",
          "verbatimQuote": "[Paste exact opening sentence of most relevant risk factor]"
        }
      ],
      "confidence": "high",
      "lastVerified": "{{currentDate}}",
      "generatedBy": "ai-assisted"
    }
  }
]
```

---

## Key Fields Priority (in order of importance)

1. `aiMarketPosition` — the new AI-specific block (most important for this prompt)
2. `revenueByGeography` — exact percentages from 10-K
3. `keySuppliers` + `customASICPartnerships` — supply chain map
4. `flags` — binary geopolitical risk flags
5. `regionalExposures` with verbatim 10-K quotes
6. `secCik` and `secEdgarUrl`

---

## AI Role Reference (for primaryAIRole field)

| Value | Meaning |
|---|---|
| `training-gpu` | Makes the GPUs used to train AI models (NVDA, AMD) |
| `inference-chip` | Makes chips for AI inference/deployment |
| `custom-asic` | Designs custom AI chips for specific customers (AVGO, MRVL) |
| `hbm-memory` | Makes the HBM memory stacked on AI GPUs (MU, SK Hynix) |
| `networking` | Makes the interconnect chips linking GPUs in clusters |
| `systems` | Builds complete AI server systems (SMCI) |
| `architecture` | Licenses the CPU/chip architecture used in AI chips (ARM) |
| `foundry` | Manufactures the physical chips for others (TSM) |
| `equipment` | Makes machines used to manufacture chips (ASML, AMAT) |

---

## Save output to

`src/data/raw/companies/{{sectorSlug}}-companies.raw.json`
