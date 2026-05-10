/**
 * Investment intelligence layer types.
 *
 * Principle: Every signal must be source-attributed and event-backed.
 * Score ranges: 0–10 unless stated otherwise.
 */

export type SignalType = 'risk' | 'opportunity' | 'neutral'

export interface SourceRef {
  name: string
  url: string
}

export interface InvestmentSignal {
  id: string
  countryId: string
  sector: string
  signalType: SignalType
  score: number              // 0–10 (10 = strongest signal)
  thesis: string             // Investment thesis in 2-3 sentences
  supportingEvents: string[] // IntelligenceEvent IDs
  sources: SourceRef[]
  lastUpdated: string
}

export interface CountryInvestmentProfile {
  countryId: string

  // Composite scores (0–10)
  overallOpportunityScore: number
  overallRiskScore: number
  easeOfDoingBusinessScore?: number
  ruleOfLawScore?: number
  currencyStabilityScore?: number
  politicalRiskScore?: number

  // Sector breakdown
  sectorSignals: InvestmentSignal[]

  // Watchlist metadata
  watchlistTags?: string[]   // e.g. ["AI boom", "energy transition", "political risk"]
  analystNote?: string

  lastUpdated: string
}

export interface InvestmentThesis {
  id: string
  title: string
  countries: string[]         // ISO3 codes in scope
  sectors: string[]
  timeHorizon: 'short' | 'medium' | 'long'  // <1yr, 1-5yr, 5yr+
  thesis: string
  risks: string[]
  catalysts: string[]
  signals: InvestmentSignal[]
  sources: SourceRef[]
  createdAt: string
  lastUpdated: string
}

export interface RiskOpportunityMatrix {
  countryId: string
  riskScore: number        // x-axis (0–10, higher = more risk)
  opportunityScore: number // y-axis (0–10, higher = more opportunity)
  label?: string           // e.g. "Emerging market", "Frontier", "Stable"
}
