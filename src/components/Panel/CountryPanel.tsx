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

function flagEmoji(iso2: string) {
  return iso2.toUpperCase().split('').map(c => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0))).join('')
}

function formatPop(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  return n.toLocaleString()
}

// ── CompareSearch (V2 feature, kept) ────────────────────────────────────────
interface CountryEntry { id: string; iso2: string; name: string; region: string }
const entries = countryIndex as CountryEntry[]
const fuse = new Fuse(entries, { keys: ['name'], threshold: 0.3 })

function CompareSearch() {
  const { setCompare, compareData, clearCompare, compareLoading } = useMapStore()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<CountryEntry[]>([])

  if (compareData) {
    return (
      <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
        <span>{flagEmoji(compareData.iso2)}</span>
        <span className="text-xs text-purple-300 flex-1 truncate">{compareData.name}</span>
        <button onClick={clearCompare} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
      </div>
    )
  }

  return (
    <div className="relative mt-2">
      <input
        type="text" value={q}
        onChange={e => {
          setQ(e.target.value)
          setResults(e.target.value ? fuse.search(e.target.value).slice(0, 6).map(r => r.item) : [])
        }}
        placeholder="Compare with another country..."
        className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 placeholder-slate-600 outline-none"
      />
      {compareLoading && <p className="text-xs text-slate-500 mt-1">Loading...</p>}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden z-20 shadow-2xl">
          {results.map(c => (
            <button key={c.id} onClick={() => { setCompare(c.id); setQ(''); setResults([]) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-800 text-left">
              <span>{flagEmoji(c.iso2)}</span>
              <div>
                <p className="text-xs text-slate-200">{c.name}</p>
                <p className="text-xs text-slate-500">{c.region}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────────────
export default function CountryPanel() {
  const { countryData, compareData, loading, error, clearSelection } = useMapStore()
  const [tab, setTab] = useState<Tab>('overview')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Loading intelligence data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="text-sm text-center text-slate-500">{error}</p>
        <button onClick={clearSelection} className="mt-4 text-xs text-blue-400 hover:text-blue-300 underline">
          Back to map
        </button>
      </div>
    )
  }

  if (!countryData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6 text-center">
        <div className="text-5xl mb-4">🌍</div>
        <p className="text-sm font-medium text-slate-400 mb-1">Click any country</p>
        <p className="text-xs text-slate-600">
          View historical context, geopolitical relationships, competing perspectives, and investment intelligence.
        </p>
      </div>
    )
  }

  const c: Country = countryData
  const cc = compareData

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview',      label: 'Overview' },
    { id: 'indicators',    label: 'Indicators' },
    { id: 'relationships', label: 'Relations' },
    { id: 'perspectives',  label: 'Perspectives' },
    { id: 'history',       label: 'History' },
    { id: 'investment',    label: 'Investment' },
  ]

  const radarData = Object.keys(INDICATOR_LABELS).map(key => ({
    subject: INDICATOR_LABELS[key].split(' ')[0],
    A: c.indicators[key as keyof typeof c.indicators]?.score ?? 5,
    B: cc?.indicators[key as keyof typeof cc.indicators]?.score,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{flagEmoji(c.iso2)}</span>
              <h2 className="text-lg font-bold text-white">{c.name}</h2>
            </div>
            <p className="text-xs text-slate-500 mb-0.5">{c.subregion} · {c.capital}</p>
            <p className="text-xs text-slate-600">Updated {c.lastUpdated}</p>
          </div>
          <button onClick={clearSelection} className="text-slate-500 hover:text-slate-300 text-xl leading-none p-1" aria-label="Close">×</button>
        </div>
        <CompareSearch />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 flex-shrink-0 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
              tab === t.id
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{c.summary}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-500 mb-0.5">Population</p>
                <p className="text-white font-semibold">{formatPop(c.demographics.population)}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-500 mb-0.5">Median Age</p>
                <p className="text-white font-semibold">{c.demographics.medianAge}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-500 mb-0.5">Urbanization</p>
                <p className="text-white font-semibold">{c.demographics.urbanizationRate}%</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-slate-500 mb-0.5">Alliances</p>
                <p className="text-white font-semibold">{c.alliances.length} memberships</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Religion</p>
              {c.demographics.religions.map(r => (
                <div key={r.name} className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${r.percent}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-28 text-right">{r.name} {r.percent}%</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Alliances & Memberships</p>
              <div className="flex flex-wrap gap-1.5">
                {c.alliances.map(a => (
                  <span key={a} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">{a}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── INDICATORS ── */}
        {tab === 'indicators' && (
          <div>
            {/* Radar chart — V2 feature kept */}
            <div style={{ height: 210 }} className="mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 8, right: 30, bottom: 8, left: 30 }}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar name={c.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} dot={{ fill: '#3b82f6', r: 2 }} />
                  {cc && <Radar name={cc.name} dataKey="B" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} dot={{ fill: '#a78bfa', r: 2 }} />}
                  <RechartTooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }} labelStyle={{ color: '#94a3b8' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {cc && (
              <div className="flex gap-4 mb-3">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-xs text-slate-400">{c.name}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-violet-400" /><span className="text-xs text-slate-400">{cc.name}</span></div>
              </div>
            )}
            <p className="text-xs text-slate-500 mb-3">Scores 1–10 · Confidence level shown</p>
            {Object.entries(INDICATOR_LABELS).map(([key, label]) => (
              <ScoreBar
                key={key}
                label={label}
                indicator={c.indicators[key as keyof typeof c.indicators]}
              />
            ))}
          </div>
        )}

        {/* ── RELATIONSHIPS ── */}
        {tab === 'relationships' && (
          <div>
            <p className="text-xs text-slate-500 mb-3">{c.relationships.length} key relationships</p>
            {c.relationships.map(r => (
              <div key={r.countryId} className="mb-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{r.countryName}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${RELATIONSHIP_COLORS[r.type] || RELATIONSHIP_COLORS.neutral}`}>
                    {r.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-snug">{r.summary}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── PERSPECTIVES ── */}
        {tab === 'perspectives' && (
          <div>
            <p className="text-xs text-slate-500 mb-3">Competing narratives — no single view is endorsed.</p>
            {c.perspectives.map((p, i) => (
              <div key={i} className="mb-4 border-l-2 border-blue-700 pl-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-blue-300">{p.source}</span>
                  <span className="text-xs text-slate-600">· {p.bias}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{p.view}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{c.historicalContext.summary}</p>
            <p className="text-xs text-slate-500 mb-2">Key Events</p>
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-700" />
              {c.historicalContext.keyEvents.map((e, i) => (
                <div key={i} className="flex gap-3 mb-3 relative">
                  <div className="w-16 flex-shrink-0 text-right">
                    <span className="text-xs font-mono text-blue-400">{e.year}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1 relative z-10" />
                  <p className="text-xs text-slate-300 leading-snug">{e.event}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INVESTMENT ── */}
        {tab === 'investment' && (
          <div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-emerald-400 mb-2">✓ Strengths</p>
              {c.investmentNotes.strengths.map((s, i) => (
                <p key={i} className="text-xs text-slate-300 mb-1.5 flex gap-2">
                  <span className="text-emerald-600 flex-shrink-0">•</span> {s}
                </p>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-red-400 mb-2">⚠ Risks</p>
              {c.investmentNotes.risks.map((r, i) => (
                <p key={i} className="text-xs text-slate-300 mb-1.5 flex gap-2">
                  <span className="text-red-600 flex-shrink-0">•</span> {r}
                </p>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-blue-400 mb-2">Key Sectors</p>
              <div className="flex flex-wrap gap-1">
                {c.investmentNotes.sectors.map(s => (
                  <span key={s} className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded border border-blue-800">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Sources</p>
              {c.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 block mb-1 underline">
                  {s.name} ↗
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
