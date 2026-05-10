/**
 * Batch data validator
 *
 * Scans src/data/raw/ directories and validates each .raw.json file
 * against the appropriate Zod schema.
 *
 * Usage:
 *   npm run validate:data
 *   npm run validate:data -- --type airports
 *   npm run validate:data -- --file src/data/raw/airports/USA-airports.raw.json
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, basename, resolve } from 'path'
import { SCHEMA_MAP, type EntityType } from '../src/data/schemas/index'
import { isValidISO3 } from './_iso3'

const ROOT = resolve(import.meta.dirname, '..')
const RAW_ROOT = join(ROOT, 'src/data/raw')

// Maps folder name → schema entity type
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
}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

interface FileResult {
  file: string
  entityType: EntityType
  total: number
  passed: number
  failed: number
  errors: { id: string | null; issues: string[] }[]
}

function validateFile(filePath: string, entityType: EntityType): FileResult {
  const schema = SCHEMA_MAP[entityType]
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'))
  const entries = Array.isArray(raw) ? raw : [raw]
  const seenIds = new Set<string>()
  const errors: { id: string | null; issues: string[] }[] = []

  for (const entry of entries as Record<string, unknown>[]) {
    const id = typeof entry?.id === 'string' ? entry.id : null
    const issues: string[] = []

    // Zod
    const result = schema.safeParse(entry)
    if (!result.success) {
      for (const issue of result.error.issues) {
        issues.push(`[${issue.path.join('.')}] ${issue.message}`)
      }
    }

    // Duplicate IDs
    if (id) {
      if (seenIds.has(id)) issues.push(`Duplicate ID: "${id}"`)
      else seenIds.add(id)
    }

    // ISO3
    const cid = entry?.countryId
    if (typeof cid === 'string' && !isValidISO3(cid)) {
      issues.push(`countryId "${cid}" not in ISO3 list`)
    }

    // Source attribution
    const attr = entry?.attribution as Record<string, unknown> | undefined
    const sources = attr?.sources as unknown[] | undefined
    if (!sources || sources.length === 0) {
      issues.push('Missing source attribution')
    }

    // Confidence
    const conf = attr?.confidence as Record<string, unknown> | undefined
    if (conf) {
      const level = conf.confidence
      const srcCount = sources?.length ?? 0
      if (level === 'high' && srcCount < 2) {
        issues.push(`confidence "high" but only ${srcCount} source(s) — consider "medium"`)
      }
    }

    if (issues.length > 0) errors.push({ id, issues })
  }

  return {
    file: filePath.replace(ROOT + '/', ''),
    entityType,
    total: entries.length,
    passed: entries.length - errors.length,
    failed: errors.length,
    errors,
  }
}

function scanDir(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter(f => f.endsWith('.raw.json'))
      .map(f => join(dir, f))
  } catch { return [] }
}

function main() {
  const filterType = getArg('--type')
  const filterFile = getArg('--file')

  const filesToValidate: { path: string; entityType: EntityType }[] = []

  if (filterFile) {
    // Single file mode
    const folderName = filterFile.split('/').slice(-2)[0]
    const entityType = FOLDER_TO_SCHEMA[folderName] as EntityType | undefined
    if (!entityType) {
      console.error(`Cannot infer entity type from folder: "${folderName}"`)
      console.error(`Valid folders: ${Object.keys(FOLDER_TO_SCHEMA).join(', ')}`)
      process.exit(1)
    }
    filesToValidate.push({ path: resolve(filterFile), entityType })
  } else {
    // Scan all raw/ directories
    for (const [folder, entityType] of Object.entries(FOLDER_TO_SCHEMA)) {
      if (filterType && folder !== filterType) continue
      const dir = join(RAW_ROOT, folder)
      for (const f of scanDir(dir)) {
        filesToValidate.push({ path: f, entityType: entityType as EntityType })
      }
    }
  }

  if (filesToValidate.length === 0) {
    console.log('\nNo .raw.json files found to validate.')
    console.log('Save Gemini output to src/data/raw/[type]/[target]-[type].raw.json first.\n')
    process.exit(0)
  }

  console.log(`\nBatch Validator — ${filesToValidate.length} file(s)`)
  console.log('═'.repeat(60))

  const results: FileResult[] = []
  let totalFiles = 0, failedFiles = 0

  for (const { path, entityType } of filesToValidate) {
    try {
      const result = validateFile(path, entityType)
      results.push(result)
      totalFiles++

      const icon = result.failed === 0 ? '✅' : '❌'
      console.log(`\n  ${icon} ${result.file}  [${entityType}]`)
      console.log(`     ${result.passed}/${result.total} records valid`)

      for (const { id, issues } of result.errors) {
        console.log(`\n     Record: ${id ?? '(no id)'}`)
        for (const issue of issues) {
          console.log(`       ERROR: ${issue}`)
        }
      }

      if (result.failed > 0) failedFiles++
    } catch (e) {
      console.error(`  ❌ ${path} — failed to parse: ${e}`)
      failedFiles++
      totalFiles++
    }
  }

  const totalRecords = results.reduce((a, r) => a + r.total, 0)
  const passedRecords = results.reduce((a, r) => a + r.passed, 0)

  console.log('\n' + '─'.repeat(60))
  console.log(`  Files:   ${totalFiles - failedFiles} passed  |  ${failedFiles} failed`)
  console.log(`  Records: ${passedRecords} passed  |  ${totalRecords - passedRecords} failed  |  ${totalRecords} total`)
  console.log('─'.repeat(60) + '\n')

  if (failedFiles === 0 && totalFiles > 0) {
    console.log('All files valid. Run: npm run import:data\n')
  }

  process.exit(failedFiles > 0 ? 1 : 0)
}

main()
