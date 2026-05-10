import { z } from 'zod'
import { CoordSchema, ISO3Schema, StrategicImportanceSchema, RiskLevelSchema, AttributionSchema } from './_shared'

export const PortTypeSchema = z.enum(['container', 'oil', 'lng', 'bulk', 'multipurpose', 'naval', 'mixed'])
export type PortType = z.infer<typeof PortTypeSchema>

export const PortSchema = z.object({
  id:       z.string().min(1).regex(/^PORT-[A-Z0-9-]+$/, 'ID must start with PORT-'),
  name:     z.string().min(3),
  countryId: ISO3Schema,
  city:     z.string().min(1),

  coordinates: CoordSchema,
  type:        PortTypeSchema,

  // ── Throughput ──
  annualThroughputTEU:     z.number().positive().optional(), // 20ft equivalent units (containers)
  annualThroughputTonnes:  z.number().positive().optional(), // metric tonnes (bulk/oil)

  // ── Physical ──
  berthCount:   z.number().int().positive().optional(),
  maxDraftM:    z.number().positive().optional(),    // max ship draft in metres
  areaHectares: z.number().positive().optional(),

  // ── Classification ──
  strategicImportance: StrategicImportanceSchema,
  riskLevel:           RiskLevelSchema.optional(),

  // ── Annotation ──
  geopoliticalNotes: z.string().optional(),
  notes:             z.string().optional(),

  attribution: AttributionSchema,
})

export type Port = z.infer<typeof PortSchema>
