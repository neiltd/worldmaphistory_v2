import { z } from 'zod'
import { ISO3Schema, PctSchema, YearSchema, AttributionSchema, assertSumsTo100 } from './_shared'

export const EnergyMixSchema = z.object({
  coal:            PctSchema.optional(),
  gas:             PctSchema.optional(),
  oil:             PctSchema.optional(),
  nuclear:         PctSchema.optional(),
  hydro:           PctSchema.optional(),
  solar:           PctSchema.optional(),
  wind:            PctSchema.optional(),
  otherRenewables: PctSchema.optional(),
  other:           PctSchema.optional(),
}).refine(mix => {
  const vals = Object.values(mix).filter((v): v is number => v !== undefined)
  if (vals.length === 0) return false
  return assertSumsTo100(vals, 3)  // allow 3% tolerance for rounding
}, { message: 'Energy mix percentages must sum to approximately 100%' })

export const CountryUtilitySchema = z.object({
  countryId: ISO3Schema,
  year:      YearSchema,

  // ── Electricity ──
  electricityConsumptionTWh: z.number().positive().optional(),
  electricityProductionTWh:  z.number().positive().optional(),
  electricityMix:            EnergyMixSchema,
  renewableSharePct:         PctSchema.optional(), // derived but useful to store

  // ── Water ──
  waterStressScore:    z.number().min(0).max(5).optional(),  // Aqueduct 0-5 scale
  waterWithdrawalPct:  PctSchema.optional(),                 // % of available freshwater

  // ── Food ──
  foodSecurityScore:   z.number().min(0).max(100).optional(), // GFSI 0-100

  // ── Technology ──
  aiAdoptionScore:     z.number().min(0).max(100).optional(), // composite 0-100
  internetPenetration: PctSchema.optional(),
  mobilePenetration:   PctSchema.optional(),

  attribution: AttributionSchema,
})

export type CountryUtility = z.infer<typeof CountryUtilitySchema>
export type EnergyMix      = z.infer<typeof EnergyMixSchema>
