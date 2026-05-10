/**
 * Gemini Prompt Generator
 *
 * Reads data-generation-targets.json and produces one ready-to-use
 * Gemini prompt file per (target × dataType) combination.
 *
 * Usage:
 *   npm run generate:prompts
 *   npm run generate:prompts -- --target USA          (single country)
 *   npm run generate:prompts -- --type airports       (single data type)
 *   npm run generate:prompts -- --target USA --type airports
 *   npm run generate:prompts -- --list               (show what would be generated)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')

// ─── Types ────────────────────────────────────────────────────────────────────

type DataType =
  | 'airports' | 'seaports' | 'submarineCables' | 'powerPlants'
  | 'utilities' | 'gdpSectors' | 'foodSecurity' | 'aiAdoption'
  | 'datacenters' | 'railHubs'

type TargetType = 'country' | 'region'

interface CountryTarget {
  targetType: 'country'
  countryId: string
  countryName: string
  region: string
  enabledDataTypes: DataType[]
}

interface RegionTarget {
  targetType: 'region'
  regionName: string
  region: string
  enabledDataTypes: DataType[]
}

type Target = CountryTarget | RegionTarget

interface TemplateMeta {
  dataType: string
  templateFile: string
  targetTypes: TargetType[]
  defaultLimit: number
  requiredSources: number
  outputSchema: string
  rawFolder: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TEMPLATE_DIR  = join(ROOT, 'prompts/templates')
const OUTPUT_DIR    = join(ROOT, 'prompts/generated')
const TARGETS_FILE  = join(ROOT, 'src/data/config/data-generation-targets.json')
const METADATA_FILE = join(ROOT, 'prompts/templates/_metadata.json')

// Maps dataType key → template filename folder name
const FOLDER_MAP: Record<DataType, string> = {
  airports:       'airports',
  seaports:       'seaports',
  submarineCables:'submarine-cables',
  powerPlants:    'power-plants',
  utilities:      'utilities',
  gdpSectors:     'gdp-sectors',
  foodSecurity:   'food-security',
  aiAdoption:     'ai-adoption',
  datacenters:    'datacenters',
  railHubs:       'rail-hubs',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

// ─── Variable replacement ─────────────────────────────────────────────────────

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

function buildVars(target: Target, meta: TemplateMeta): Record<string, string> {
  const base: Record<string, string> = {
    currentDate: today(),
    limit:       String(meta.defaultLimit),
    requiredSources: String(meta.requiredSources),
    region:      'region' in target ? target.region : '',
  }

  if (target.targetType === 'country') {
    return {
      ...base,
      countryId:   target.countryId,
      countryName: target.countryName,
      regionName:  '',
      regionSlug:  '',
    }
  } else {
    return {
      ...base,
      countryId:   '',
      countryName: '',
      regionName:  target.regionName,
      regionSlug:  slugify(target.regionName),
    }
  }
}

function targetLabel(target: Target): string {
  return target.targetType === 'country'
    ? `${target.countryId} (${target.countryName})`
    : target.regionName
}

function outputFileName(target: Target, dataType: DataType): string {
  const id = target.targetType === 'country'
    ? target.countryId
    : slugify(target.regionName)
  return `${id}-${FOLDER_MAP[dataType]}.md`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  // ── Load config ──
  const targets: Target[] = JSON.parse(readFileSync(TARGETS_FILE, 'utf-8'))
  const metadata: Record<string, TemplateMeta> = JSON.parse(readFileSync(METADATA_FILE, 'utf-8'))

  // ── Filters from CLI ──
  const filterTarget = getArg('--target')
  const filterType   = getArg('--type') as DataType | undefined
  const listOnly     = hasFlag('--list')

  // ── Filter targets ──
  const filteredTargets = targets.filter(t => {
    if (!filterTarget) return true
    if (t.targetType === 'country') return t.countryId === filterTarget || t.countryName === filterTarget
    return t.regionName === filterTarget
  })

  if (filteredTargets.length === 0) {
    console.error(`No targets found matching "${filterTarget}"`)
    process.exit(1)
  }

  let generated = 0, skipped = 0

  console.log(`\nGemini Prompt Generator`)
  console.log('═'.repeat(60))
  if (filterTarget) console.log(`  Filter target: ${filterTarget}`)
  if (filterType)   console.log(`  Filter type:   ${filterType}`)
  if (listOnly)     console.log(`  Mode: LIST ONLY (no files written)`)
  console.log()

  for (const target of filteredTargets) {
    const dataTypes = filterType
      ? target.enabledDataTypes.filter(dt => dt === filterType)
      : target.enabledDataTypes

    for (const dataType of dataTypes) {
      const meta = metadata[dataType]
      if (!meta) {
        console.warn(`  ⚠ No metadata for "${dataType}" — skipping`)
        skipped++
        continue
      }

      // Check target type compatibility
      if (!meta.targetTypes.includes(target.targetType)) {
        console.log(`  ─ SKIP  ${targetLabel(target)} × ${dataType} (not compatible with ${target.targetType} targets)`)
        skipped++
        continue
      }

      const templatePath = join(TEMPLATE_DIR, meta.templateFile)
      if (!existsSync(templatePath)) {
        console.warn(`  ⚠ Template not found: ${meta.templateFile}`)
        skipped++
        continue
      }

      const templateRaw = readFileSync(templatePath, 'utf-8')
      const vars        = buildVars(target, meta)
      const filled      = fillTemplate(templateRaw, vars)

      const outFolder = join(OUTPUT_DIR, FOLDER_MAP[dataType])
      const outFile   = join(outFolder, outputFileName(target, dataType))

      const label = `${targetLabel(target)} × ${dataType}`

      if (listOnly) {
        console.log(`  ○ WOULD GENERATE: ${outFile.replace(ROOT + '/', '')}`)
      } else {
        mkdirSync(outFolder, { recursive: true })
        writeFileSync(outFile, filled, 'utf-8')
        console.log(`  ✅ ${label}`)
        console.log(`     → ${outFile.replace(ROOT + '/', '')}`)
      }

      generated++
    }
  }

  console.log()
  console.log('─'.repeat(60))
  if (listOnly) {
    console.log(`  Would generate: ${generated} prompts  |  Would skip: ${skipped}`)
  } else {
    console.log(`  Generated: ${generated} prompts  |  Skipped: ${skipped}`)
    console.log(`  Output: prompts/generated/`)
  }
  console.log('─'.repeat(60) + '\n')

  if (!listOnly && generated > 0) {
    console.log('Next steps:')
    console.log('  1. Open any prompt in prompts/generated/[type]/[target]-[type].md')
    console.log('  2. Copy the full content into Gemini')
    console.log('  3. Save Gemini output to src/data/raw/[type]/[target]-[type].raw.json')
    console.log('  4. Run: npm run validate:data')
    console.log('  5. Run: npm run import:data')
    console.log()
  }
}

main()
