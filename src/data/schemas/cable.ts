import { z } from 'zod'
import { CoordSchema, ISO3Schema, AttributionSchema } from './_shared'

export const CableStatusSchema = z.enum(['active', 'planned', 'construction', 'damaged', 'decommissioned', 'unknown'])
export type CableStatus = z.infer<typeof CableStatusSchema>

export const LandingPointSchema = z.object({
  name:        z.string().min(1),
  countryId:   ISO3Schema,
  coordinates: CoordSchema,
  city:        z.string().optional(),
})

export const SubmarineCableSchema = z.object({
  id:   z.string().min(1).regex(/^CABLE-[A-Z0-9-]+$/, 'ID must start with CABLE-'),
  name: z.string().min(3),

  // Route must have at least 2 points (start and end)
  route: z.array(CoordSchema).min(2, 'Route must have at least 2 coordinate points'),

  landingPoints: z.array(LandingPointSchema).min(2, 'Must have at least 2 landing points'),

  status: CableStatusSchema,

  // ── Technical specs ──
  lengthKm:      z.number().positive().optional(),
  capacityTbps:  z.number().positive().optional(),
  yearLaid:      z.number().int().min(1850).max(2035).optional(),
  yearRepaired:  z.number().int().min(1850).max(2035).optional(),

  // ── Ownership ──
  owners:    z.array(z.string()).optional(),
  operators: z.array(z.string()).optional(),

  // ── Geopolitical context ──
  vulnerabilities:   z.string().optional(), // known risks (fishing, anchoring, state actors)
  geopoliticalNotes: z.string().optional(),
  notes:             z.string().optional(),

  attribution: AttributionSchema,
})
.refine(d => d.landingPoints.length >= 2, {
  message: 'Cable must connect at least 2 landing points',
})

export type SubmarineCable = z.infer<typeof SubmarineCableSchema>
export type LandingPoint    = z.infer<typeof LandingPointSchema>
