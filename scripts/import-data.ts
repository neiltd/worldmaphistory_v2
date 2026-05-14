/**
 * Batch data importer
 *
 * Reads all .raw.json files from src/data/raw/,
 * validates each record, merges valid records per type,
 * and writes consolidated output to src/data/validated/[type].json
 *
 * Usage:
 *   npm run import:data
 *   npm run import:data -- --type airports
 *   npm run import:data -- --force   (skip validation gate — not recommended)
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { SCHEMA_MAP, type EntityType } from '../src/data/schemas/index'
import { normalizeCoord, normalizeCountryCode, sanitizeString } from './normalize'
import { isValidISO3 } from './_iso3'

const ROOT          = resolve(import.meta.dirname, '..')
const RAW_ROOT      = join(ROOT, 'src/data/raw')
const VALIDATED_DIR = join(ROOT, 'src/data/validated')

const FOLDER_TO_SCHEMA: Record<string, EntityType> = {
  'airports':        'airport',
  'seaports':        'port',
  'submarine-cables':'cable',
  'power-plants':    'powerplant',
  'utilities':       'utility',
  'gdp-sectors':     'gdp',
  'food-security':   'foodsecurity',
  'ai-adoption':     'aiadoption',
  'datacenters':     'datacenter',
  'rail-hubs':       'railhub',
  'companies':       'company',
}

const OUTPUT_FILENAME: Record<string, string> = {
  'airports':        'airports.json',
  'seaports':        'seaports.json',
  'submarine-cables':'submarine-cables.json',
  'power-plants':    'power-plants.json',
  'utilities':       'utilities.json',
  'gdp-sectors':     'gdp-sectors.json',
  'food-security':   'food-security.json',
  'ai-adoption':     'ai-adoption.json',
  'datacenters':     'datacenters.json',
  'rail-hubs':       'rail-hubs.json',
  'companies':       'companies.json',
}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

// ─── Normalise a single record ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRecord(entry: Record<string, unknown>): { record: any; warnings: string[] } {
  const warnings: string[] = []
  const w = { ...entry }

  // Strings
  for (const key of ['name', 'city', 'notes', 'geopoliticalNotes', 'strategicNote']) {
    if (typeof w[key] === 'string') w[key] = sanitizeString(w[key] as string)
  }

  // Country code
  if (w.countryId !== undefined) {
    const { code, warnings: cw } = normalizeCountryCode(w.countryId, String(w.id ?? ''))
    w.countryId = code
    warnings.push(...cw)
  }

  // Coordinates
  if (Array.isArray(w.coordinates) && w.coordinates.length === 2) {
    try {
      const { coord, warnings: cw } = normalizeCoord(w.coordinates[0], w.coordinates[1], String(w.id ?? ''))
      w.coordinates = coord
      warnings.push(...cw)
    } catch (e) { warnings.push(String(e)) }
  }

  // Landing points (cables)
  if (Array.isArray(w.landingPoints)) {
    w.landingPoints = (w.landingPoints as Record<string, unknown>[]).map((lp, i) => {
      if (Array.isArray(lp.coordinates) && lp.coordinates.length === 2) {
        try {
          const { coord } = normalizeCoord(lp.coordinates[0], lp.coordinates[1], `lp[${i}]`)
          return { ...lp, coordinates: coord }
        } catch { return lp }
      }
      return lp
    })
  }

  return { record: w, warnings }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const filterType = getArg('--type')
  const force      = hasFlag('--force')

  mkdirSync(VALIDATED_DIR, { recursive: true })

  console.log(`\nBatch Importer${force ? ' (--force: skipping validation gate)' : ''}`)
  console.log('═'.repeat(60))

  let totalImported = 0, totalRejected = 0

  for (const [folder, entityType] of Object.entries(FOLDER_TO_SCHEMA)) {
    if (filterType && folder !== filterType) continue

    const rawDir = join(RAW_ROOT, folder)
    let files: string[]
    try {
      files = readdirSync(rawDir).filter(f => f.endsWith('.raw.json'))
    } catch { continue }

    if (files.length === 0) continue

    const schema = SCHEMA_MAP[entityType]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const merged: any[] = []
    const seenIds = new Set<string>()
    let folderImported = 0, folderRejected = 0

    console.log(`\n  📂 ${folder}  [${files.length} file(s)]`)

    for (const file of files) {
      const filePath = join(rawDir, file)
      let entries: Record<string, unknown>[]

      try {
        const raw = JSON.parse(readFileSync(filePath, 'utf-8'))
        entries = Array.isArray(raw) ? raw : [raw]
      } catch (e) {
        console.log(`    ❌ ${file} — JSON parse error: ${e}`)
        folderRejected++
        continue
      }

      let fileImported = 0, fileRejected = 0

      for (const entry of entries) {
        const { record, warnings } = normalizeRecord(entry as Record<string, unknown>)

        // Source attribution gate (always enforced, even with --force)
        const sources = (record?.attribution?.sources as unknown[] | undefined) ?? []
        if (sources.length === 0) {
          console.log(`    ❌ ${record?.id ?? '?'} — rejected: no source attribution`)
          fileRejected++
          continue
        }

        // Country code gate
        if (record.countryId && !isValidISO3(record.countryId)) {
          console.log(`    ❌ ${record?.id ?? '?'} — rejected: invalid countryId "${record.countryId}"`)
          fileRejected++
          continue
        }

        // Zod gate (skip if --force)
        if (!force) {
          const zodResult = schema.safeParse(record)
          if (!zodResult.success) {
            const issues = zodResult.error.issues.map(i => `[${i.path.join('.')}] ${i.message}`)
            console.log(`    ❌ ${record?.id ?? '?'} — ${issues.length} validation error(s)`)
            issues.forEach(i => console.log(`         ${i}`))
            fileRejected++
            continue
          }
        }

        // Duplicate ID gate
        const id = String(record?.id ?? '')
        if (id && seenIds.has(id)) {
          console.log(`    ⚠  ${id} — skipped: duplicate ID`)
          continue
        }
        if (id) seenIds.add(id)

        if (warnings.length > 0) {
          warnings.forEach(w => console.log(`    ⚠  ${record?.id ?? '?'}: ${w}`))
        }

        merged.push(record)
        fileImported++
      }

      console.log(`    ✅ ${file}  (${fileImported} imported, ${fileRejected} rejected)`)
      folderImported += fileImported
      folderRejected += fileRejected
    }

    // Write merged output
    if (merged.length > 0) {
      const outPath = join(VALIDATED_DIR, OUTPUT_FILENAME[folder])
      writeFileSync(outPath, JSON.stringify(merged, null, 2), 'utf-8')
      console.log(`\n    → Written: src/data/validated/${OUTPUT_FILENAME[folder]}  (${merged.length} records)`)
    }

    totalImported += folderImported
    totalRejected += folderRejected
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`  Imported: ${totalImported}  |  Rejected: ${totalRejected}`)
  console.log('─'.repeat(60) + '\n')

  if (totalImported > 0) {
    console.log('Validated data ready in: src/data/validated/')
    console.log('Next: wire into layer components via src/layers/\n')
  }

  process.exit(totalRejected > 0 && !force ? 1 : 0)
}

main()
