import { z } from 'zod'
import { ISO3Schema, PctSchema, YearSchema, AttributionSchema, assertSumsTo100 } from './_shared'

export const GdpSectorSchema = z.object({
  sector:       z.string().min(1),  // e.g. "Services", "Manufacturing", "Oil & Gas"
  percentOfGDP: PctSchema,
  notes:        z.string().optional(),
})

export const GdpCompositionSchema = z.object({
  countryId:   ISO3Schema,
  year:        YearSchema,
  gdpUsdBn:    z.number().positive().optional(), // GDP in USD billions
  gdpPerCapita: z.number().positive().optional(),

  sectors: z.array(GdpSectorSchema).min(1),

  attribution: AttributionSchema,
})
.refine(d => assertSumsTo100(d.sectors.map(s => s.percentOfGDP), 3), {
  message: 'GDP sector percentages must sum to approximately 100%',
  path: ['sectors'],
})

export type GdpComposition = z.infer<typeof GdpCompositionSchema>
export type GdpSector      = z.infer<typeof GdpSectorSchema>
