import { z } from 'zod'
import { ISO3Schema, YearSchema, PctSchema, AttributionSchema } from './_shared'

// Based on Global Food Security Index (GFSI) methodology
export const FoodSecuritySchema = z.object({
  countryId: ISO3Schema,
  year:      YearSchema,

  // ── GFSI composite score (0–100, higher = more secure) ──
  overallScore: z.number().min(0).max(100),

  // ── GFSI pillars (0–100 each) ──
  availability: z.number().min(0).max(100).optional(), // supply + production
  access:       z.number().min(0).max(100).optional(), // affordability + income
  utilization:  z.number().min(0).max(100).optional(), // nutrition + safety
  stability:    z.number().min(0).max(100).optional(), // resilience to shocks

  // ── Key indicators ──
  undernourishedPct:       PctSchema.optional(), // % of population undernourished
  foodImportDependencyPct: PctSchema.optional(), // % of food supply from imports
  cerealYieldKgHa:         z.number().positive().optional(),

  // ── Risk context ──
  climateVulnerability:  z.enum(['low', 'medium', 'high', 'extreme']).optional(),
  conflictExposure:      z.enum(['none', 'low', 'medium', 'high']).optional(),

  attribution: AttributionSchema,
})

export type FoodSecurity = z.infer<typeof FoodSecuritySchema>
