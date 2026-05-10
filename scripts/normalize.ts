/**
 * Normalization utilities for geopolitical intelligence data.
 * Run standalone: npx tsx scripts/normalize.ts
 */
import { isValidISO3, normalizeISO3 } from './_iso3'

// ─── Coordinate normalization ─────────────────────────────────────────────────

export interface CoordNormResult {
  coord: [number, number]
  warnings: string[]
}

export function normalizeCoord(
  lng: unknown,
  lat: unknown,
  context = ''
): CoordNormResult {
  const warnings: string[] = []
  let lngN = Number(lng)
  let latN = Number(lat)

  if (isNaN(lngN) || isNaN(latN)) {
    throw new Error(`${context}: Non-numeric coordinate [${lng}, ${lat}]`)
  }

  // Warn on null island
  if (lngN === 0 && latN === 0) {
    warnings.push(`${context}: [0, 0] is null island — likely a placeholder`)
  }

  // Clamp longitude to [-180, 180]
  while (lngN > 180)  lngN -= 360
  while (lngN < -180) lngN += 360

  // Clamp latitude
  if (latN > 90) {
    warnings.push(`${context}: Latitude ${latN} clamped to 90`)
    latN = 90
  }
  if (latN < -90) {
    warnings.push(`${context}: Latitude ${latN} clamped to -90`)
    latN = -90
  }

  // Precision: round to 6 decimal places (~10cm accuracy)
  return {
    coord: [
      Math.round(lngN * 1e6) / 1e6,
      Math.round(latN * 1e6) / 1e6,
    ],
    warnings,
  }
}

// ─── Country code normalization ───────────────────────────────────────────────

export interface CodeNormResult {
  code: string
  valid: boolean
  warnings: string[]
}

export function normalizeCountryCode(raw: unknown, context = ''): CodeNormResult {
  const warnings: string[] = []

  if (typeof raw !== 'string') {
    return { code: String(raw), valid: false, warnings: [`${context}: countryId must be a string`] }
  }

  const normalized = normalizeISO3(raw)

  if (!isValidISO3(normalized)) {
    warnings.push(`${context}: "${normalized}" is not a recognized ISO3 country code`)
    return { code: normalized, valid: false, warnings }
  }

  if (raw !== normalized) {
    warnings.push(`${context}: Normalized "${raw}" → "${normalized}"`)
  }

  return { code: normalized, valid: true, warnings }
}

// ─── Percentage sum normalization ─────────────────────────────────────────────

export interface PctNormResult {
  adjusted: Record<string, number>
  warnings: string[]
}

export function normalizePctSum(
  values: Record<string, number | undefined | null>,
  tolerance = 3
): PctNormResult {
  const warnings: string[] = []
  const defined: Record<string, number> = {}

  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined && v !== null) defined[k] = v
  }

  const sum = Object.values(defined).reduce((a, b) => a + b, 0)

  if (Math.abs(sum - 100) > tolerance) {
    warnings.push(`Percentage sum is ${sum.toFixed(1)}% — expected ~100%`)
    // Pro-rate to 100
    const factor = 100 / sum
    const adjusted: Record<string, number> = {}
    for (const [k, v] of Object.entries(defined)) {
      adjusted[k] = Math.round(v * factor * 10) / 10
    }
    warnings.push(`Pro-rated values: ${JSON.stringify(adjusted)}`)
    return { adjusted, warnings }
  }

  return { adjusted: defined, warnings }
}

// ─── String sanitization ──────────────────────────────────────────────────────

export function sanitizeString(s: unknown): string {
  if (typeof s !== 'string') return String(s ?? '').trim()
  return s.trim().replace(/\s+/g, ' ')
}

// ─── URL normalization ────────────────────────────────────────────────────────

export function normalizeUrl(url: unknown, context = ''): { url: string; valid: boolean } {
  try {
    const u = new URL(String(url))
    return { url: u.toString(), valid: true }
  } catch {
    return { url: String(url), valid: false }
  }
  void context
}

// ─── Date normalization (ISO YYYY-MM-DD) ─────────────────────────────────────

export function normalizeDate(d: unknown, context = ''): { date: string; valid: boolean } {
  const s = String(d ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const dt = new Date(s)
    if (!isNaN(dt.getTime())) return { date: s, valid: true }
  }
  // Try to parse common formats
  const dt = new Date(s)
  if (!isNaN(dt.getTime())) {
    const iso = dt.toISOString().split('T')[0]
    return { date: iso, valid: true }
  }
  void context
  return { date: s, valid: false }
}

// ─── CLI entrypoint ───────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  // Quick smoke test
  const r1 = normalizeCoord(121.5, 31.2, 'Shanghai test')
  console.log('Coord normalization:', r1)

  const r2 = normalizeCountryCode('chn', 'China test')
  console.log('Code normalization:', r2)

  const r3 = normalizePctSum({ coal: 60, gas: 20, wind: 15, solar: 6 })
  console.log('Pct sum normalization:', r3)
}
