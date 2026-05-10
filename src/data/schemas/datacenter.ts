import { z } from 'zod'
import { CoordSchema, ISO3Schema, AttributionSchema, YearSchema } from './_shared'

export const DatacenterTierSchema = z.enum(['1', '2', '3', '4'])
export const DatacenterStatusSchema = z.enum(['operational', 'construction', 'planned', 'decommissioned'])
export const DatacenterTypeSchema = z.enum([
  'hyperscale',   // 100MW+, owned by cloud giants
  'colocation',   // multi-tenant commercial
  'enterprise',   // single-org private
  'government',   // state-owned
  'edge',         // small regional node
])

export const DatacenterSchema = z.object({
  id:        z.string().min(1).regex(/^DC-[A-Z0-9-]+$/, 'ID must start with DC-'),
  name:      z.string().min(2),
  countryId: ISO3Schema,
  city:      z.string().min(1),

  coordinates: CoordSchema,
  type:        DatacenterTypeSchema,
  status:      DatacenterStatusSchema,

  // ── Technical specs ──
  tierLevel:    DatacenterTierSchema.optional(), // Uptime Institute tier
  capacityMW:   z.number().positive().optional(),
  floorSpaceM2: z.number().positive().optional(),
  pue:          z.number().min(1).max(3).optional(), // Power Usage Effectiveness

  // ── Ownership ──
  operator: z.string().optional(), // e.g. "Amazon AWS", "Equinix", "Government"
  owner:    z.string().optional(),

  // ── Timeline ──
  yearOpened:   YearSchema.optional(),
  yearPlanned:  YearSchema.optional(),

  // ── Context ──
  cloudRegion:       z.string().optional(),       // e.g. "ap-southeast-1"
  geopoliticalNotes: z.string().optional(),       // state actor involvement, data sovereignty
  notes:             z.string().optional(),

  attribution: AttributionSchema,
})

export type Datacenter       = z.infer<typeof DatacenterSchema>
export type DatacenterTier   = z.infer<typeof DatacenterTierSchema>
export type DatacenterStatus = z.infer<typeof DatacenterStatusSchema>
