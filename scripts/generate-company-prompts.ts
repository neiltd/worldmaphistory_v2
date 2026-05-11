/**
 * Company Intelligence Profile Prompt Generator
 *
 * Reads company-targets.json and generates one ready-to-use Gemini
 * prompt per sector, listing all companies in that sector.
 *
 * Usage:
 *   npm run generate:company-prompts
 *   npm run generate:company-prompts -- --sector semiconductors
 *   npm run generate:company-prompts -- --list
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'

const ROOT              = resolve(import.meta.dirname, '..')
const TEMPLATE_FILE     = join(ROOT, 'prompts/templates/company-profile.template.md')
const TEMPLATE_FILE_AI  = join(ROOT, 'prompts/templates/company-profile-ai.template.md')
const TARGETS_FILE      = join(ROOT, 'src/data/config/company-targets.json')
const OUT_DIR           = join(ROOT, 'prompts/generated/companies')

// Sectors that use the enhanced AI template
const AI_TEMPLATE_SECTORS = new Set(['semiconductors-ai', 'ai-infrastructure'])

interface CompanyTarget {
  ticker: string
  name: string
  exchange: string
  note: string
}

interface SectorTarget {
  sectorId: string
  sectorName: string
  sectorSlug: string
  priority: number
  companies: CompanyTarget[]
}

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function buildCompanyList(companies: CompanyTarget[]): string {
  return companies.map((c, i) =>
    `${i + 1}. **${c.ticker}** — ${c.name} (${c.exchange})\n   *Why it matters: ${c.note}*`
  ).join('\n\n')
}

function main() {
  const filterSector = getArg('--sector')
  const listOnly     = hasFlag('--list')

  const template: string = readFileSync(TEMPLATE_FILE, 'utf-8')
  const targets: SectorTarget[] = JSON.parse(readFileSync(TARGETS_FILE, 'utf-8'))

  const filtered = filterSector
    ? targets.filter(t => t.sectorSlug === filterSector || t.sectorId.includes(filterSector))
    : targets

  if (filtered.length === 0) {
    console.error(`No sector matching "${filterSector}"`)
    console.error(`Available: ${targets.map(t => t.sectorSlug).join(', ')}`)
    process.exit(1)
  }

  mkdirSync(OUT_DIR, { recursive: true })

  console.log(`\nCompany Profile Prompt Generator`)
  console.log('═'.repeat(60))
  if (filterSector) console.log(`  Filter: ${filterSector}`)
  if (listOnly)     console.log(`  Mode: LIST ONLY`)
  console.log()

  let generated = 0

  for (const sector of filtered.sort((a, b) => a.priority - b.priority)) {
    const companyList = buildCompanyList(sector.companies)

    // Use AI-enhanced template for AI-specific sectors
    const useAITemplate = AI_TEMPLATE_SECTORS.has(sector.sectorSlug)
    const templateSrc   = useAITemplate
      ? readFileSync(TEMPLATE_FILE_AI, 'utf-8')
      : template

    const filled = templateSrc
      .replace(/\{\{sectorName\}\}/g,   sector.sectorName)
      .replace(/\{\{sectorSlug\}\}/g,   sector.sectorSlug)
      .replace(/\{\{currentDate\}\}/g,  today())
      .replace(/\{\{companyList\}\}/g,  companyList)

    const outFile = join(OUT_DIR, `${sector.sectorSlug}-companies.md`)

    const templateLabel = useAITemplate ? '[AI template]' : '[standard template]'

    if (listOnly) {
      console.log(`  ○ WOULD GENERATE: prompts/generated/companies/${sector.sectorSlug}-companies.md  ${templateLabel}`)
      console.log(`    Companies: ${sector.companies.map(c => c.ticker).join(', ')}`)
    } else {
      writeFileSync(outFile, filled, 'utf-8')
      console.log(`  ✅ ${sector.sectorName} (Priority ${sector.priority})  ${templateLabel}`)
      console.log(`     Companies: ${sector.companies.map(c => c.ticker).join(', ')}`)
      console.log(`     → prompts/generated/companies/${sector.sectorSlug}-companies.md`)
    }

    generated++
    console.log()
  }

  console.log('─'.repeat(60))
  if (listOnly) {
    console.log(`  Would generate: ${generated} sector prompts`)
  } else {
    console.log(`  Generated: ${generated} sector prompts`)
    console.log(`  Output: prompts/generated/companies/`)
    console.log()
    console.log('Next steps:')
    console.log('  1. Open prompts/generated/companies/semiconductors-companies.md')
    console.log('  2. Copy entire content → paste into Gemini')
    console.log('  3. Save JSON output → src/data/raw/companies/semiconductors-companies.raw.json')
    console.log('  4. Repeat for each sector in priority order')
  }
  console.log('─'.repeat(60) + '\n')
}

main()
