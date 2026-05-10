/**
 * Data validation CLI for World Intelligence platform.
 *
 * Usage:
 *   npx tsx scripts/validate.ts --type airport --file src/data/infrastructure/raw/airports.json
 *   npx tsx scripts/validate.ts --type port     --file src/data/infrastructure/raw/ports.json
 *   npx tsx scripts/validate.ts --type cable    --file src/data/infrastructure/raw/cables.json
 *
 * Supported types: airport | port | cable | powerplant | utility |
 *                  gdp | foodsecurity | aiadoption | datacenter | railhub
 */
import { readFileSync } from 'fs'
import { SCHEMA_MAP, type EntityType } from '../src/data/schemas/index'
import { isValidISO3 } from './_iso3'
import { z } from 'zod'

// ─── Parse CLI args ───────────────────────────────────────────────────────────

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

const entityType = getArg('--type') as EntityType | undefined
const filePath   = getArg('--file')

if (!entityType || !filePath) {
  console.error('Usage: npx tsx scripts/validate.ts --type <type> --file <path>')
  process.exit(1)
}

if (!SCHEMA_MAP[entityType]) {
  console.error(`Unknown entity type: "${entityType}". Valid: ${Object.keys(SCHEMA_MAP).join(', ')}`)
  process.exit(1)
}

// ─── Load JSON ────────────────────────────────────────────────────────────────

let raw: unknown
try {
  raw = JSON.parse(readFileSync(filePath, 'utf-8'))
} catch (e) {
  console.error(`Failed to read/parse file: ${filePath}`)
  console.error(e)
  process.exit(1)
}

const entries = Array.isArray(raw) ? raw : [raw]
const schema  = SCHEMA_MAP[entityType]

// ─── Validation results ───────────────────────────────────────────────────────

interface Result {
  index:    number
  id:       string | null
  valid:    boolean
  errors:   string[]
  warnings: string[]
}

const results: Result[] = []
const seenIds  = new Set<string>()

console.log(`\nValidating ${entries.length} ${entityType} record(s) from: ${filePath}\n`)

for (let i = 0; i < entries.length; i++) {
  const entry = entries[i] as Record<string, unknown>
  const id    = typeof entry?.id === 'string' ? entry.id : null
  const errors:   string[] = []
  const warnings: string[] = []

  // ── Zod validation ──
  const result = schema.safeParse(entry)
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`[${issue.path.join('.')}] ${issue.message}`)
    }
  }

  // ── Duplicate ID check ──
  if (id) {
    if (seenIds.has(id)) {
      errors.push(`Duplicate ID: "${id}"`)
    } else {
      seenIds.add(id)
    }
  }

  // ── ISO3 country code check ──
  const countryId = entry?.countryId
  if (typeof countryId === 'string' && !isValidISO3(countryId)) {
    warnings.push(`countryId "${countryId}" not in known ISO3 list`)
  }

  // ── Source attribution check ──
  const attribution = entry?.attribution as Record<string, unknown> | undefined
  if (!attribution?.sources || !Array.isArray(attribution.sources) || attribution.sources.length === 0) {
    errors.push('Missing source attribution — every record requires at least 1 source')
  } else {
    const sources = attribution.sources as Record<string, unknown>[]
    sources.forEach((s, si) => {
      if (!s.url || typeof s.url !== 'string') {
        errors.push(`sources[${si}].url is required`)
      }
      if (!s.accessedAt) {
        warnings.push(`sources[${si}].accessedAt missing — add access date`)
      }
    })
  }

  // ── Confidence check ──
  const confidence = (attribution?.confidence as Record<string, unknown> | undefined)
  if (confidence) {
    const srcCount  = Number(attribution?.sources ? (attribution.sources as unknown[]).length : 0)
    const confLevel = confidence?.confidence
    if (confLevel === 'high' && srcCount < 2) {
      warnings.push(`confidence "high" but only ${srcCount} source — consider "medium"`)
    }
    if (confLevel === 'low' && srcCount >= 3) {
      warnings.push(`confidence "low" but ${srcCount} sources — consider upgrading to "medium"`)
    }
  }

  results.push({ index: i, id, valid: errors.length === 0, errors, warnings })
}

// ─── Report ───────────────────────────────────────────────────────────────────

let passed = 0, failed = 0

for (const r of results) {
  const label = r.id ? `#${r.index} (${r.id})` : `#${r.index}`
  if (r.valid) {
    passed++
    console.log(`  ✅ ${label}`)
  } else {
    failed++
    console.log(`  ❌ ${label}`)
    r.errors.forEach(e => console.log(`       ERROR: ${e}`))
  }
  r.warnings.forEach(w => console.log(`       WARN:  ${w}`))
}

console.log(`\n─────────────────────────────────`)
console.log(`  ${passed} passed  |  ${failed} failed  |  ${entries.length} total`)
console.log(`─────────────────────────────────\n`)

process.exit(failed > 0 ? 1 : 0)
