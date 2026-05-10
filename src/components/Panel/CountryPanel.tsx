import { useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartTooltip } from 'recharts'
import Fuse from 'fuse.js'
import { useMapStore } from '../../store/useMapStore'
import ScoreBar from '../UI/ScoreBar'
import type { Country } from '../../types/country'
import countryIndex from '../../data/country-index.json'

const INDICATOR_LABELS: Record<string, string> = {
  politicalStability:       'Political Stability',
  economicDirection:        'Economic Direction',
  investmentAttractiveness: 'Investment Attractiveness',
  geopoliticalRisk:         'Geopolitical Risk',
  educationQuality:         'Education Quality',
  healthcareQuality:        'Healthcare Quality',
  technologyInvestment:     'Technology Investment',
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  ally:              'bg-emerald-900 text-emerald-300 border-emerald-700',
  treaty_ally:       'bg-emerald-900 text-emerald-300 border-emerald-700',
  strategic_partner: 'bg-blue-900 text-blue-300 border-blue-700',
  trade_partner:     'bg-sky-900 text-sky-300 border-sky-700',
  neutral:           'bg-slate-800 text-slate-300 border-slate-600',
  contested:         'bg-amber-900 text-amber-300 border-amber-700',
  rival:             'bg-orange-900 text-orange-300 border-orange-700',
  enemy:             'bg-red-900 text-red-300 border-red-700',
}

type Tab = 'overview' | 'indicators' | 'relationships' | 'perspectives' | 'history' | 'investment'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',      label: 'Overview' },
  { id: 'indicators',    label: 'Indicators' },
  { id: 'relationships', label: 'Relations' },
  { id: 'perspectives',  label: 'Perspectives' },
  { id: 'history',       label: 'History' },
  { id: 'investment',    label: 'Investment' },
]

function flagEmoji(iso2: string) {
  return iso2.toUpperCase().split('').map(c => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0))).join('')
}

function formatPop(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  return n.toLocaleString()
}

// ── Section wrapper for consistent spacing ───────────────────────────────────
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      {title && <p className="text-xs text-slate-500 mb-2 font-medium">{title}</p>}
      {children}
    </div>
  )
}

// ── CompareSearch ─────────────────────────────────────────────────────────────
interface CountryEntry { id: string; iso2: string; name: string; region: string }
const entries = countryIndex as CountryEntry[]
const fuse = new Fuse(entries, { keys: ['name'], threshold: 0.3 })

function CompareSearch() {
  const { setCompare, compareData, clearCompare, compareLoading } = useMapStore()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<CountryEntry[]>([])

  if (compareData) {
    return (
      <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 min-w-0">
        <span className="flex-shrink-0">{flagEmoji(compareData.iso2)}</span>
        <span className="text-xs text-purple-300 flex-1 truncate min-w-0">{compareData.name}</span>
        <button onClick={clearCompare} className="flex-shrink-0 text-slate-500 hover:text-white text-lg leading-none">×</button>
      </div>
    )
  }

  return (
    <div className="relative mt-3">
      <input
        type="text" value={q}
        onChange={e => {
          setQ(e.target.value)
          setResults(e.target.value ? fuse.search(e.target.value).slice(0, 6).map(r => r.item) : [])
        }}
        placeholder="Compare with another country..."
        className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 placeholder-slate-600 outline-none"
      />
      {compareLoading && <p className="text-xs text-slate-500 mt-1">Loading…</p>}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden z-20 shadow-2xl">
          {results.map(c => (
            <button key={c.id} onClick={() => { setCompare(c.id); setQ(''); setResults([]) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-800 text-left min-w-0">
              <span className="flex-shrink-0">{flagEmoji(c.iso2)}</span>
              <div className="min-w-0">
                <p className="text-xs text-slate-200 truncate">{c.name}</p>
                <p className="text-xs text-slate-500">{c.region}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function CountryPanel() {
  const { countryData, compareData, loading, error, clearSelection } = useMapStore()
  const [tab, setTab] = useState<Tab>('overview')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading intelligence data…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
        <div className="text-4xl">🗺️</div>
        <p className="text-sm text-slate-500 break-words">{error}</p>
        <button onClick={clearSelection} className="text-xs text-blue-400 hover:text-blue-300 underline">Back to map</button>
      </div>
    )
  }

  if (!countryData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-3">
        <div className="text-5xl">🌍</div>
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">Click any country</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            View historical context, geopolitical relationships, competing perspectives, and investment intelligence.
          </p>
        </div>
      </div>
    )
  }

  const c: Country = countryData
  const cc = compareData

  const radarData = Object.keys(INDICATOR_LABELS).map(key => ({
    subject: INDICATOR_LABELS[key].split(' ')[0],
    A: c.indicators[key as keyof typeof c.indicators]?.score ?? 5,
    B: cc?.indicators[key as keyof typeof cc.indicators]?.score,
  }))

  return (
    // Req 1, 9: proper flexbox column, overflow-y only on body
    <div className="flex flex-col h-full min-h-0">

      {/* ── HEADER — fixed, never scrolls ── */}
      {/* Req 7: consistent header padding */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-slate-800">
        {/* Req 1, 6: flex layout, break-words prevents text from pushing close button */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{flagEmoji(c.iso2)}</span>
            <div className="min-w-0 flex-1">
              {/* Req 6: break-words on long country names */}
              <h2 className="text-base font-bold text-white leading-snug break-words">{c.name}</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">{c.subregion} · {c.capital}</p>
              <p className="text-xs text-slate-600 mt-0.5">Updated {c.lastUpdated}</p>
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="flex-shrink-0 text-slate-500 hover:text-slate-300 text-xl leading-none p-1 mt-0.5"
            aria-label="Close"
          >×</button>
        </div>
        <CompareSearch />
      </div>

      {/* ── TABS — fixed, never scrolls, never wraps ── */}
      {/* Req 2, 10: overflow-x-auto prevents wrapping; flex-shrink-0 keeps it stable */}
      <div className="flex-shrink-0 flex overflow-x-auto border-b border-slate-800 scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            // Req 2: flex-shrink-0 + whitespace-nowrap prevents tab text wrapping
            className={`flex-shrink-0 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
              tab === t.id
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* ── BODY — only this scrolls ── */}
      {/* Req 9: overflow-y-auto only here; min-h-0 is required for flex children to shrink */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-5">

            {/* Req 4, 6: long summary text won't collapse siblings */}
            <p className="text-sm text-slate-300 leading-relaxed break-words">{c.summary}</p>

            {/* Req 5: auto-fit grid so cards wrap on narrow panels */}
            <Section title="Demographics">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                {[
                  ['Population',   formatPop(c.demographics.population)],
                  ['Median Age',   String(c.demographics.medianAge)],
                  ['Urban',        `${c.demographics.urbanizationRate}%`],
                  ['Alliances',    `${c.alliances.length} memberships`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-800 rounded-lg p-3 min-h-[60px] flex flex-col justify-between">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    {/* Req 6: break-words on values */}
                    <p className="text-sm text-white font-semibold leading-snug break-words">{value}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Req 3, 7: min-height and consistent spacing for religion section */}
            <Section title="Religion">
              <div className="flex flex-col gap-2.5">
                {c.demographics.religions.map(r => (
                  // Req 1: flex layout with min-w-0 prevents bar from overflowing
                  <div key={r.name} className="flex items-center gap-3 min-w-0">
                    <div className="flex-1 min-w-0 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${r.percent}%` }} />
                    </div>
                    {/* Req 6: fixed min-width label, right-aligned */}
                    <span
                      className="flex-shrink-0 text-xs text-slate-400 text-right"
                      style={{ minWidth: '7.5rem' }}
                    >{r.name} {r.percent}%</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Req 7: alliance tags section with gap and margin */}
            <Section title="Alliances & Memberships">
              {/* Req 2: flex-wrap so tags never overflow */}
              <div className="flex flex-wrap gap-1.5">
                {c.alliances.map(a => (
                  <span key={a} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 break-words">
                    {a}
                  </span>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ══ INDICATORS ══ */}
        {tab === 'indicators' && (
          <div className="flex flex-col gap-4">
            {/* Req 3: min-height on radar chart container */}
            <div style={{ height: 210, minHeight: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 8, right: 30, bottom: 8, left: 30 }}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar name={c.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} dot={{ fill: '#3b82f6', r: 2 }} />
                  {cc && <Radar name={cc.name} dataKey="B" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} dot={{ fill: '#a78bfa', r: 2 }} />}
                  <RechartTooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {cc && (
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" /><span className="text-xs text-slate-400 break-words">{c.name}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" /><span className="text-xs text-slate-400 break-words">{cc.name}</span></div>
              </div>
            )}
            <p className="text-xs text-slate-500">Scores 1–10 · Confidence level shown</p>
            <div className="flex flex-col gap-1">
              {Object.entries(INDICATOR_LABELS).map(([key, label]) => (
                <ScoreBar
                  key={key}
                  label={label}
                  indicator={c.indicators[key as keyof typeof c.indicators]}
                />
              ))}
            </div>
          </div>
        )}

        {/* ══ RELATIONSHIPS ══ */}
        {tab === 'relationships' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500">{c.relationships.length} key relationships</p>
            {c.relationships.map(r => (
              <div key={r.countryId} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                {/* Req 1, 6: flex with min-w-0 prevents badge from being pushed off screen */}
                <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
                  <span className="text-sm font-medium text-white break-words min-w-0 flex-1 leading-snug">{r.countryName}</span>
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${RELATIONSHIP_COLORS[r.type] || RELATIONSHIP_COLORS.neutral}`}>
                    {r.type.replace(/_/g, ' ')}
                  </span>
                </div>
                {/* Req 6: break-words on summary text */}
                <p className="text-xs text-slate-400 leading-relaxed break-words">{r.summary}</p>
              </div>
            ))}
          </div>
        )}

        {/* ══ PERSPECTIVES ══ */}
        {tab === 'perspectives' && (
          <div className="flex flex-col gap-5">
            <p className="text-xs text-slate-500">Competing narratives — no single view is endorsed.</p>
            {c.perspectives.map((p, i) => (
              <div key={i} className="border-l-2 border-blue-700 pl-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                  <span className="text-xs font-semibold text-blue-300 break-words">{p.source}</span>
                  <span className="text-xs text-slate-600">· {p.bias}</span>
                </div>
                {/* Req 4, 6: long perspective text won't collapse siblings */}
                <p className="text-xs text-slate-300 leading-relaxed break-words">{p.view}</p>
              </div>
            ))}
          </div>
        )}

        {/* ══ HISTORY ══ */}
        {tab === 'history' && (
          <div className="flex flex-col gap-4">
            {/* Req 4: leading-relaxed + break-words prevents long summary collapsing timeline */}
            <p className="text-sm text-slate-300 leading-relaxed break-words">{c.historicalContext.summary}</p>
            <p className="text-xs text-slate-500">Key Events</p>
            <div className="relative flex flex-col gap-3">
              <div className="absolute left-[3.75rem] top-0 bottom-0 w-px bg-slate-700" />
              {c.historicalContext.keyEvents.map((e, i) => (
                // Req 1: flex with flex-shrink-0 on year/dot, min-w-0 on text
                <div key={i} className="flex items-start gap-3 relative min-w-0">
                  <div className="w-14 flex-shrink-0 text-right pt-0.5">
                    <span className="text-xs font-mono text-blue-400">{e.year}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1 relative z-10" />
                  {/* Req 6: break-words on event text */}
                  <p className="text-xs text-slate-300 leading-relaxed break-words min-w-0 flex-1">{e.event}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ INVESTMENT ══ */}
        {tab === 'investment' && (
          <div className="flex flex-col gap-5">
            <Section title="✓ Strengths">
              <div className="flex flex-col gap-2">
                {c.investmentNotes.strengths.map((s, i) => (
                  // Req 4: flex prevents bullet collapsing when text is long
                  <div key={i} className="flex gap-2 min-w-0">
                    <span className="text-emerald-600 flex-shrink-0 font-bold">•</span>
                    <p className="text-xs text-slate-300 leading-relaxed break-words min-w-0">{s}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="⚠ Risks">
              <div className="flex flex-col gap-2">
                {c.investmentNotes.risks.map((r, i) => (
                  <div key={i} className="flex gap-2 min-w-0">
                    <span className="text-red-600 flex-shrink-0 font-bold">•</span>
                    <p className="text-xs text-slate-300 leading-relaxed break-words min-w-0">{r}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Key Sectors">
              {/* Req 2: flex-wrap so sector tags never overflow */}
              <div className="flex flex-wrap gap-1.5">
                {c.investmentNotes.sectors.map(s => (
                  <span key={s} className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded border border-blue-800 break-words">
                    {s}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="Sources">
              <div className="flex flex-col gap-1.5">
                {c.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline break-words leading-relaxed">
                    {s.name} ↗
                  </a>
                ))}
              </div>
            </Section>
          </div>
        )}

      </div>
    </div>
  )
}
