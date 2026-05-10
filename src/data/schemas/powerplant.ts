import { z } from 'zod'
import { CoordSchema, ISO3Schema, AttributionSchema, YearSchema } from './_shared'

export const PlantTypeSchema = z.enum([
  'coal', 'gas', 'oil', 'nuclear', 'hydro',
  'solar', 'wind', 'geothermal', 'biomass', 'other',
])
export const PlantStatusSchema = z.enum(['operating', 'construction', 'planned', 'decommissioned', 'mothballed'])

export const PowerPlantSchema = z.object({
  id:        z.string().min(1).regex(/^PLANT-[A-Z0-9-]+$/, 'ID must start with PLANT-'),
  name:      z.string().min(2),
  countryId: ISO3Schema,
  city:      z.string().optional(),

  coordinates: CoordSchema,
  type:        PlantTypeSchema,
  status:      PlantStatusSchema,

  // ── Capacity ──
  capacityMW:       z.number().positive().optional(),
  annualOutputGWh:  z.number().positive().optional(),

  // ── Timeline ──
  yearCommissioned: YearSchema.optional(),
  yearRetirement:   YearSchema.optional(),

  // ── Ownership ──
  operator:    z.string().optional(),
  owner:       z.string().optional(),

  // ── Context ──
  strategicNote: z.string().optional(), // e.g. "Only nuclear plant in region"
  notes:         z.string().optional(),

  attribution: AttributionSchema,
})
.refine(d => {
  if (d.yearRetirement && d.yearCommissioned) {
    return d.yearRetirement > d.yearCommissioned
  }
  return true
}, { message: 'yearRetirement must be after yearCommissioned' })

export type PowerPlant = z.infer<typeof PowerPlantSchema>
export type PlantType   = z.infer<typeof PlantTypeSchema>
export type PlantStatus = z.infer<typeof PlantStatusSchema>
