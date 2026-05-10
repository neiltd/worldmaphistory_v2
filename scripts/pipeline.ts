/**
 * Full import pipeline: raw → validate → normalize → validated/
 *
 * Usage:
 *   npx tsx scripts/pipeline.ts --type airport --raw src/data/infrastructure/raw/airports.json
 *
 * Output:
 *   src/data/infrastructure/validated/airports.json  (valid records only)
 *   pipeline-report.json                              (full validation report)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, basename, join } from 'path'
import { SCHEMA_MAP, type EntityType } from '../src/data/schemas/index'
import { normalizeCoord, normalizeCountryCode, sanitizeString } from './normalize'
import { isValidISO3 } from './_iso3'

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

const entityType = getArg('--type') as EntityType | undefined
const rawPath    = getArg('--raw')
const outDir     = getArg('--out')

if (!entityType || !rawPath) {
  console.error('Usage: npx tsx scripts/pipeline.ts --type <type> --raw <path> [--out <dir>]')
  process.exit(1)
}

// ─── Load ─────────────────────────────────────────────────────────────────────

let entries: Record<string, unknown>[]
try {
  const raw = JSON.parse(readFileSync(rawPath, 'utf-8'))
  entries = Array.isArray(raw) ? raw : [raw]
} catch {
  console.error(`Cannot read: ${rawPath}`)
  process.exit(1)
}

const schema = SCHEMA_MAP[entityType]
if (!schema) {
  console.error(`Unknown type: ${entityType}`)
  process.exit(1)
}

console.log(`\nPipeline: ${entityType} — ${entries.length} record(s) from ${rawPath}`)
console.log('═'.repeat(60))

// ─── Pipeline stages ──────────────────────────────────────────────────────────

interface PipelineRecord {
  original: Record<string, unknown>
  normalized?: Record<string, unknown>
  valid: boolean
  stage: 'normalized' | 'rejected'
  errors: string[]
  warnings: string[]
}

const pipeline: PipelineRecord[] = []
const seenIds = new Set<string>()

for (const entry of entries) {
  const record: PipelineRecord = {
    original: entry,
    valid: true,
    stage: 'normalized',
    errors: [],
    warnings: [],
  }

  let working = { ...entry }

  // ── Stage 1: Normalize strings ──
  for (const key of ['name', 'city', 'notes', 'geopoliticalNotes']) {
    if (typeof working[key] === 'string') {
      working[key] = sanitizeString(working[key])
    }
  }

  // ── Stage 2: Normalize country code ──
  if (working.countryId !== undefined) {
    const { code, valid, warnings } = normalizeCountryCode(working.countryId, String(working.id ?? ''))
    working.countryId = code
    record.warnings.push(...warnings)
    if (!valid) {
      record.errors.push(`Invalid ISO3 country code: "${code}"`)
    }
  }

  // ── Stage 3: Normalize coordinates ──
  if (Array.isArray(working.coordinates) && working.coordinates.length === 2) {
    try {
      const { coord, warnings } = normalizeCoord(
        working.coordinates[0], working.coordinates[1], String(working.id ?? '')
      )
      working.coordinates = coord
      record.warnings.push(...warnings)
    } catch (e) {
      record.errors.push(String(e))
    }
  }

  // ── Stage 4: Normalize landing point coordinates (cables) ──
  if (Array.isArray(working.landingPoints)) {
    working.landingPoints = (working.landingPoints as Record<string, unknown>[]).map((lp, i) => {
      if (Array.isArray(lp.coordinates) && lp.coordinates.length === 2) {
        try {
          const { coord } = normalizeCoord(lp.coordinates[0], lp.coordinates[1], `landingPoints[${i}]`)
          return { ...lp, coordinates: coord }
        } catch { /* keep original */ }
      }
      return lp
    })
  }

  // ── Stage 5: Deduplicate IDs ──
  const id = String(working.id ?? '')
  if (id && seenIds.has(id)) {
    record.errors.push(`Duplicate ID: "${id}"`)
  } else if (id) {
    seenIds.add(id)
  }

  // ── Stage 6: Zod schema validation ──
  const zodResult = schema.safeParse(working)
  if (!zodResult.success) {
    for (const issue of zodResult.error.issues) {
      record.errors.push(`[${issue.path.join('.')}] ${issue.message}`)
    }
  }

  // ── Stage 7: Source attribution enforcement ──
  const attr = working.attribution as Record<string, unknown> | undefined
  if (!attr?.sources || !Array.isArray(attr.sources) || (attr.sources as unknown[]).length === 0) {
    record.errors.push('REJECTED: Missing source attribution')
  }

  record.valid  = record.errors.length === 0
  record.stage  = record.valid ? 'normalized' : 'rejected'
  record.normalized = record.valid ? working : undefined

  pipeline.push(record)
}

// ─── Results ──────────────────────────────────────────────────────────────────

const valid   = pipeline.filter(r => r.valid)
const invalid = pipeline.filter(r => !r.valid)

for (const r of pipeline) {
  const id    = String(r.original.id ?? '?')
  const label = r.valid ? `✅ ${id}` : `❌ ${id}`
  console.log(`  ${label}`)
  r.errors.forEach(e => console.log(`       ERROR: ${e}`))
  r.warnings.forEach(w => console.log(`       WARN:  ${w}`))
}

console.log('\n' + '─'.repeat(60))
console.log(`  ${valid.length} valid  |  ${invalid.length} rejected  |  ${entries.length} total`)
console.log('─'.repeat(60) + '\n')

// ─── Write output ─────────────────────────────────────────────────────────────

const outputDir = outDir ?? dirname(rawPath).replace('/raw', '/validated')
mkdirSync(outputDir, { recursive: true })

const outFile  = join(outputDir, basename(rawPath))
const outData  = valid.map(r => r.normalized)
writeFileSync(outFile, JSON.stringify(outData, null, 2), 'utf-8')
console.log(`✅ Validated output → ${outFile}  (${outData.length} records)`)

// ── Report ──
const report = {
  entityType,
  source: rawPath,
  processedAt: new Date().toISOString(),
  total: entries.length,
  valid: valid.length,
  rejected: invalid.length,
  records: pipeline.map(r => ({
    id:       r.original.id ?? null,
    valid:    r.valid,
    errors:   r.errors,
    warnings: r.warnings,
  })),
}

const reportPath = 'pipeline-report.json'
writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
console.log(`📋 Report → ${reportPath}\n`)

process.exit(invalid.length > 0 ? 1 : 0)
