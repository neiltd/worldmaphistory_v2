import { z } from 'zod'
import { CoordSchema, ISO3Schema, StrategicImportanceSchema, AttributionSchema } from './_shared'

export const AirportSchema = z.object({
  // ── Identity ──
  id:   z.string().min(1).regex(/^[A-Z]{3,4}$/, 'Use IATA (3-char) or ICAO (4-char) code as ID'),
  name: z.string().min(3),
  countryId: ISO3Schema,
  city: z.string().min(1),

  // ── Codes ──
  iata: z.string().length(3).regex(/^[A-Z]{3}$/).optional(),
  icao: z.string().length(4).regex(/^[A-Z]{4}$/).optional(),

  // ── Location ──
  coordinates: CoordSchema,

  // ── Traffic (annual) ──
  passengerVolume: z.number().int().positive().optional(), // persons/year
  cargoVolume:     z.number().positive().optional(),       // metric tonnes/year

  // ── Physical ──
  runwayCount: z.number().int().min(1).max(10).optional(),
  elevationM:  z.number().optional(),                     // metres above sea level

  // ── Classification ──
  strategicImportance: StrategicImportanceSchema,

  // ── Annotation ──
  geopoliticalNotes: z.string().optional(), // WHY it matters strategically
  notes:             z.string().optional(),

  // ── Attribution ──
  attribution: AttributionSchema,
})
.refine(d => d.iata !== undefined || d.icao !== undefined, {
  message: 'At least one of iata or icao must be provided',
})

export type Airport = z.infer<typeof AirportSchema>
