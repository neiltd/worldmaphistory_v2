import { z } from 'zod'
import { CoordSchema, ISO3Schema, StrategicImportanceSchema, AttributionSchema } from './_shared'

export const RailHubTypeSchema = z.enum([
  'passenger',        // primarily passenger
  'freight',          // primarily freight/cargo
  'mixed',            // both
  'high_speed',       // HSR hub
  'border_crossing',  // international freight crossing
  'port_interface',   // rail-port multimodal
  'military',         // strategic military logistics
])

export const RailHubSchema = z.object({
  id:        z.string().min(1).regex(/^RAIL-[A-Z0-9-]+$/, 'ID must start with RAIL-'),
  name:      z.string().min(2),
  countryId: ISO3Schema,
  city:      z.string().min(1),

  coordinates: CoordSchema,
  type:        RailHubTypeSchema,

  // ── Capacity ──
  dailyPassengers:      z.number().int().positive().optional(),
  annualFreightTonnes:  z.number().positive().optional(),

  // ── Connectivity ──
  connectedCountries: z.array(ISO3Schema).optional(), // for border hubs
  gaugeType:          z.enum(['standard', 'broad', 'narrow', 'mixed']).optional(),
  lineCount:          z.number().int().positive().optional(),

  // ── Classification ──
  strategicImportance: StrategicImportanceSchema,
  isPartOfBRI:         z.boolean().optional(), // Belt and Road Initiative

  // ── Annotation ──
  geopoliticalNotes: z.string().optional(),
  notes:             z.string().optional(),

  attribution: AttributionSchema,
})

export type RailHub     = z.infer<typeof RailHubSchema>
export type RailHubType = z.infer<typeof RailHubTypeSchema>
