import { z } from 'zod'

// ─── Coordinate ───────────────────────────────────────────────────────────────
// GeoJSON order: [longitude, latitude]
export const CoordSchema = z
  .tuple([
    z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
    z.number().min(-90).max(90,   'Latitude must be between -90 and 90'),
  ])
  .refine(([lng, lat]) => !(lng === 0 && lat === 0), {
    message: 'Coordinate [0, 0] is the null island — likely a placeholder. Use null if unknown.',
  })

export type Coord = z.infer<typeof CoordSchema>

// ─── Source attribution (required on every entity) ────────────────────────────
export const SourceRefSchema = z.object({
  name:       z.string().min(1, 'Source name required'),
  url:        z.string().url('Source URL must be a valid URL'),
  accessedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'accessedAt must be YYYY-MM-DD'),
})

export type SourceRef = z.infer<typeof SourceRefSchema>

// ─── Confidence metadata ──────────────────────────────────────────────────────
export const ConfidenceSchema = z.object({
  confidence:   z.enum(['high', 'medium', 'low']),
  sourceCount:  z.number().int().min(1),
  lastVerified: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'lastVerified must be YYYY-MM-DD'),
})

export type Confidence = z.infer<typeof ConfidenceSchema>

// ─── Combined attribution block ───────────────────────────────────────────────
export const AttributionSchema = z.object({
  sources:    z.array(SourceRefSchema).min(1, 'At least one source required'),
  confidence: ConfidenceSchema,
})

export type Attribution = z.infer<typeof AttributionSchema>

// ─── Strategic importance scale ───────────────────────────────────────────────
export const StrategicImportanceSchema = z.enum(['low', 'medium', 'high', 'critical'])
export type StrategicImportance = z.infer<typeof StrategicImportanceSchema>

// ─── Risk level ───────────────────────────────────────────────────────────────
export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'extreme'])
export type RiskLevel = z.infer<typeof RiskLevelSchema>

// ─── ISO 3166-1 alpha-3 (partial list — expand as needed) ────────────────────
// Validates the format only; full country list in scripts/_iso3.ts
export const ISO3Schema = z
  .string()
  .length(3, 'ISO country code must be exactly 3 characters')
  .regex(/^[A-Z]{3}$/, 'ISO3 code must be uppercase letters only')

// ─── Year ─────────────────────────────────────────────────────────────────────
export const YearSchema = z
  .number()
  .int()
  .min(1900)
  .max(new Date().getFullYear() + 5)

// ─── Percentage (0–100) ───────────────────────────────────────────────────────
export const PctSchema = z.number().min(0).max(100)

// ─── Percentage sum check helper ──────────────────────────────────────────────
export function assertSumsTo100(
  values: (number | undefined | null)[],
  tolerance = 2
): boolean {
  const sum = values.reduce<number>((acc, v) => acc + (v ?? 0), 0)
  return Math.abs(sum - 100) <= tolerance
}
