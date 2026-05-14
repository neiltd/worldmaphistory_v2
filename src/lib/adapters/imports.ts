/**
 * Import adapter — fetches and validates hub-exported JSON files at runtime.
 *
 * Files live in public/data/imports/ and are served as static assets.
 * This mirrors the existing pattern used for countries-110m.json.
 *
 * Loading strategy:
 *   1. Try the real file (e.g. events.json) — dropped by the hub on deploy
 *   2. If 404, try the example file (events.example.json) — committed for dev
 *   3. If both fail, return an empty fallback and log a warning
 *
 * This means the app runs correctly in three modes:
 *   - Production:   hub drops real files → real data shown
 *   - Development:  example files committed → sample data shown
 *   - Offline:      nothing found → app runs with no intelligence data
 *
 * ─── Data flow ────────────────────────────────────────────────────────────────
 *   public/data/imports/{file}.json    (hub-produced, gitignored)
 *   public/data/imports/{file}.example.json  (sample, committed)
 *       │  fetched at runtime via fetch()
 *       ▼
 *   loadImports()  ← validates each file with Zod
 *       │
 *       ▼
 *   useIntelligenceStore  ← typed runtime state
 *       │
 *       ▼
 *   Map layers / CountryPanel  ← read from store, render only
 *
 * ─── Future agent integration point ──────────────────────────────────────────
 * Agents write enriched versions of the same files (same schema, optional
 * fields populated). No changes to this adapter required — the optional
 * fields flow through as-is.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  EventsImportSchema,
  EnergyImportSchema,
  MacroImportSchema,
  ManifestSchema,
  SCHEMA_VERSION,
  type ImportedEvent,
  type EnergyIndicator,
  type ImportManifest,
} from '../../data/schemas/imports'

// ── Runtime fetch — tries real file then example file ────────────────────────
async function tryFetch<T>(filename: string, fallback: T): Promise<T> {
  const base = `${import.meta.env.BASE_URL}data/imports/`
  const candidates = [filename, filename.replace('.json', '.example.json')]

  for (const candidate of candidates) {
    try {
      const res = await fetch(`${base}${candidate}`)
      if (res.ok) {
        const data = await res.json() as T
        if (candidate !== filename) {
          console.info(`[imports] Using example file: ${candidate}`)
        }
        return data
      }
      if (res.status !== 404) {
        console.warn(`[imports] ${candidate} returned HTTP ${res.status}`)
      }
    } catch (e) {
      console.warn(`[imports] Failed to fetch ${candidate}:`, (e as Error).message)
    }
  }

  console.warn(`[imports] ${filename} not found — intelligence data unavailable for this source.`)
  return fallback
}

// ── Schema version guard ──────────────────────────────────────────────────────
function checkVersion(schemaVersion: string, filename: string): boolean {
  const [importedMajor] = schemaVersion.split('.')
  const [expectedMajor] = SCHEMA_VERSION.split('.')
  if (importedMajor !== expectedMajor) {
    console.error(
      `[imports] ${filename} schema version mismatch — ` +
      `expected major ${expectedMajor}, got ${schemaVersion}. ` +
      `Update src/data/schemas/imports.ts to match the hub contract.`
    )
    return false
  }
  return true
}

// ── Per-file loaders ──────────────────────────────────────────────────────────

export async function loadEvents(): Promise<ImportedEvent[]> {
  const raw = await tryFetch<unknown>('events.json', null)
  if (!raw) return []

  const result = EventsImportSchema.safeParse(raw)
  if (!result.success) {
    console.error('[imports] events.json schema error:', result.error.issues.slice(0, 5))
    return []
  }
  if (!checkVersion(result.data.schemaVersion, 'events.json')) return []

  console.info(`[imports] events.json — ${result.data.events.length} events loaded`)
  return result.data.events
}

export async function loadEnergyIndicators(): Promise<EnergyIndicator[]> {
  const raw = await tryFetch<unknown>('energy-indicators.json', null)
  if (!raw) return []

  const result = EnergyImportSchema.safeParse(raw)
  if (!result.success) {
    console.error('[imports] energy-indicators.json schema error:', result.error.issues.slice(0, 5))
    return []
  }
  if (!checkVersion(result.data.schemaVersion, 'energy-indicators.json')) return []

  console.info(`[imports] energy-indicators.json — ${result.data.indicators.length} series loaded`)
  return result.data.indicators
}

export async function loadMacroIndicators(): Promise<Record<string, Record<string, number>>> {
  const raw = await tryFetch<unknown>('macro-indicators.json', null)
  if (!raw) return {}

  const result = MacroImportSchema.safeParse(raw)
  if (!result.success) {
    console.error('[imports] macro-indicators.json schema error:', result.error.issues.slice(0, 5))
    return {}
  }
  if (!checkVersion(result.data.schemaVersion, 'macro-indicators.json')) return {}

  const count = Object.keys(result.data.byCountry).length
  console.info(`[imports] macro-indicators.json — ${count} countries loaded`)
  return result.data.byCountry
}

export async function loadManifest(): Promise<ImportManifest | null> {
  const raw = await tryFetch<unknown>('manifest.json', null)
  if (!raw) return null

  const result = ManifestSchema.safeParse(raw)
  if (!result.success) {
    console.error('[imports] manifest.json schema error:', result.error.issues.slice(0, 3))
    return null
  }
  return result.data
}

// ── Load all imports in one parallel call ─────────────────────────────────────
export interface LoadedImports {
  events:           ImportedEvent[]
  energyIndicators: EnergyIndicator[]
  macroIndicators:  Record<string, Record<string, number>>
  manifest:         ImportManifest | null
}

export async function loadAllImports(): Promise<LoadedImports> {
  const [events, energyIndicators, macroIndicators, manifest] = await Promise.all([
    loadEvents(),
    loadEnergyIndicators(),
    loadMacroIndicators(),
    loadManifest(),
  ])
  return { events, energyIndicators, macroIndicators, manifest }
}
