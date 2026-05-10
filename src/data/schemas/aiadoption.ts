import { z } from 'zod'
import { ISO3Schema, YearSchema, PctSchema, AttributionSchema } from './_shared'

export const AiAdoptionSchema = z.object({
  countryId: ISO3Schema,
  year:      YearSchema,

  // ── Composite scores (0–100) ──
  aiReadinessScore:    z.number().min(0).max(100).optional(), // Oxford Insights AI Readiness Index
  aiAdoptionScore:     z.number().min(0).max(100).optional(), // composite adoption metric
  aiTalentScore:       z.number().min(0).max(100).optional(), // talent pool quality

  // ── Investment ──
  aiInvestmentUsdM:   z.number().nonnegative().optional(), // USD millions invested in AI annually
  aiStartupCount:     z.number().int().nonnegative().optional(),
  aiUnicornCount:     z.number().int().nonnegative().optional(),

  // ── Policy ──
  hasNationalAiStrategy:  z.boolean().optional(),
  aiStrategyYear:         YearSchema.optional(),
  aiPolicyScore:          z.number().min(0).max(10).optional(),

  // ── Infrastructure ──
  cloudReadinessPct:      PctSchema.optional(),
  broadbandPenetrationPct: PctSchema.optional(),

  // ── Sector adoption ──
  topAiSectors: z.array(z.string()).optional(), // e.g. ["Finance", "Healthcare", "Defense"]

  attribution: AttributionSchema,
})

export type AiAdoption = z.infer<typeof AiAdoptionSchema>
