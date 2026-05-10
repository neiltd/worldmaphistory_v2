import { useState } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartTooltip,
} from 'recharts'
import { useMapStore } from '../../store/useMapStore'
import countryIndex from '../../data/country-index.json'
import Fuse from 'fuse.js'

type Tab = 'overview' | 'indicators' | 'relationships' | 'perspectives' | 'history' | 'investment'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',      label: 'Overview' },
  { id: 'indicators',    label: 'Indicators' },
  { id: 'relationships', label: 'Relations' },
  { id: 'perspectives',  label: 'Perspectives' },
  { id: 'history',       label: 'History' },
  { id: 'investment',    label: 'Investment' },
]

const INDICATOR_LABELS: Record<string, string> = {
  politicalStability:       'Political Stability',
  economicDirection:        'Economic Direction',
  investmentAttractiveness: 'Investment',
  geopoliticalRisk:         'Geo Risk',
  educationQuality:         'Education',
  healthcareQuality:        'Healthcare',
  technologyInvestment:     'Technology',
}

const REL_COLORS: Record<string, string> = {
  ally: '#166534', treaty_ally: '#166534', strategic_partner: '#1e3a5f',
  trade_partner: '#1e3a5f', neutral: '#1c1c2e', contested: '#422006',
  rival: '#431407', enemy: '#450a0a',
}
const REL_TEXT: Record<string, string> = {
  ally: '#4ade80', treaty_ally: '#4ade80', strategic_partner: '#60a5fa',
  trade_partner: '#7dd3fc', neutral: '#94a3b8', contested: '#fb923c',
  rival: '#f97316', enemy: '#f87171',
}
const TREND_ICON: Record<string, string> = {
  rising: '↑', improving: '↑', stable: '→', declining: '↓',
}
const TREND_COLOR: Record<string, string> = {
  rising: 'text-red-400', declining: 'text-red-400',
  improving: 'text-emerald-400', stable: 'text-slate-500',
}

function flag(iso2: string) {
  return iso2.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  ).join('')
}
function fmtPop(n: number) {
  if (n >= 1e9) return `${(n/1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`
  return n.toLocaleString()
}

interface CountryEntry { id: string; iso2: string; name: string; region: string }
const entries = countryIndex as CountryEntry[]
const fuse = new Fuse(entries, { keys: ['name'], threshold: 0.3 })

// Compare search
function CompareSearch() {
  const { setCompare, compareData, clearCompare, compareLoading } = useMapStore()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<CountryEntry[]>([])

  function handleChange(v: string) {
    setQ(v)
    setResults(v.length > 0 ? fuse.search(v).slice(0, 6).map(r => r.item) : [])
  }

  if (compareData) {
    return (
      <div className="flex items-center gap-2 bg-purple-900/20 border border-purple-800/40 rounded-lg px-2.5 py-1.5 mt-2">
        <span className="text-sm">{flag(compareData.iso2)}</span>
        <span className="text-xs text-purple-300 flex-1">{compareData.name}</span>
        <button onClick={clearCompare} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
      </div>
    )
  }

  return (
    <div className="relative mt-2">
      <input
        type="text"
        value={q}
        onChange={e => handleChange(e.target.value)}
        placeholder="Compare with..."
        className="w-full bg-[#0E1525] border border-[#1E2D4A] text-xs text-slate-300 placeholder-slate-600 rounded-lg px-2.5 py-1.5 outline-none"
      />
      {compareLoading && <p className="text-xs text-slate-500 mt-1">Loading...</p>}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0E1525] border border-[#1E2D4A] rounded-lg overflow-hidden z-20 shadow-xl">
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => { setCompare(c.id); setQ(''); setResults([]) }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#151F35] text-left"
            >
              <span>{flag(c.iso2)}</span>
              <span className="text-xs text-slate-200">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CountryPanel() {
  const { countryData: c, compareData: cc, loading, error, clearSelection } = useMapStore()
  const [tab, setTab] = useState<Tab>('overview')

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading...</p>
      </div>
    </div>
  )

  if (error || !c) return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="text-4xl mb-3">🗺️</div>
      <p className="text-sm text-slate-400 mb-1">{error || 'Click any country on the map'}</p>
      <p className="text-xs text-slate-600">214 countries with full intelligence profiles</p>
    </div>
  )

  // Radar data
  const radarData = Object.entries(INDICATOR_LABELS).map(([key, name]) => ({
    subject: name,
    A: c.indicators[key as keyof typeof c.indicators]?.score ?? 5,
    B: cc?.indicators[key as keyof typeof cc.indicators]?.score,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden panel-enter">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-[#1E2D4A] flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{flag(c.iso2)}</span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{c.name}</h2>
              <p className="text-xs text-slate-600">{c.subregion} · {c.capital}</p>
            </div>
          </div>
          <button onClick={clearSelection} className="text-slate-600 hover:text-white text-xl leading-none flex-shrink-0 ml-2">×</button>
        </div>
        <CompareSearch />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1E2D4A] flex-shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-600 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {tab === 'overview' && (
          <div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">{c.summary}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                ['Population', fmtPop(c.demographics.population)],
                ['Median Age', String(c.demographics.medianAge)],
                ['Urban', `${c.demographics.urbanizationRate}%`],
                ['Alliances', `${c.alliances.length}`],
              ].map(([k, v]) => (
                <div key={k} className="bg-[#0E1525] rounded-lg p-2.5 border border-[#1E2D4A]">
                  <p className="text-xs text-slate-600 mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-white">{v}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mb-2">Religion</p>
            {c.demographics.religions.map(r => (
              <div key={r.name} className="flex items-center gap-2 mb-1.5">
                <div className="h-1.5 bg-[#1E2D4A] rounded-full overflow-hidden flex-1">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${r.percent}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-36 text-right">{r.name} {r.percent}%</span>
              </div>
            ))}
            <div className="mt-3">
              <p className="text-xs text-slate-600 mb-2">Alliances</p>
              <div className="flex flex-wrap gap-1">
                {c.alliances.map(a => (
                  <span key={a} className="text-xs bg-[#0E1525] border border-[#1E2D4A] text-slate-400 px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'indicators' && (
          <div>
            {/* Radar chart */}
            <div className="h-52 mb-4 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#1E2D4A" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9 }} />
                  <Radar name={c.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} dot={{ fill: '#3b82f6', r: 2 }} />
                  {cc && <Radar name={cc.name} dataKey="B" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} dot={{ fill: '#8b5cf6', r: 2 }} />}
                  <RechartTooltip
                    contentStyle={{ background: '#0E1525', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {cc && (
              <div className="flex gap-4 mb-3 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-slate-400">{c.name}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-slate-400">{cc.name}</span></div>
              </div>
            )}
            {/* Score list */}
            {Object.entries(INDICATOR_LABELS).map(([key, label]) => {
              const ind = c.indicators[key as keyof typeof c.indicators]
              if (!ind) return null
              const pct = (ind.score / 10) * 100
              const barColor = ind.score >= 7 ? '#22c55e' : ind.score >= 4 ? '#f59e0b' : '#ef4444'
              return (
                <div key={key} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${TREND_COLOR[ind.trend]}`}>{TREND_ICON[ind.trend]} {ind.trend}</span>
                      <span className="text-xs font-bold text-white w-4 text-right">{ind.score}</span>
                    </div>
                  </div>
                  <div className="h-1 bg-[#1E2D4A] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  {ind.note && <p className="text-xs text-slate-600 mt-0.5 leading-snug">{ind.note}</p>}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'relationships' && (
          <div>
            <p className="text-xs text-slate-600 mb-3">{c.relationships?.length ?? 0} key relationships</p>
            {(c.relationships ?? []).map((r, i) => (
              <div key={i} className="mb-2 p-3 rounded-lg border" style={{ background: REL_COLORS[r.type] || '#1c1c2e', borderColor: REL_COLORS[r.type] || '#1E2D4A' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">{r.countryName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: REL_TEXT[r.type] || '#94a3b8' }}>
                    {r.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-snug">{r.summary}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'perspectives' && (
          <div>
            <p className="text-xs text-slate-600 mb-3">No single view is endorsed. Read all.</p>
            {(c.perspectives ?? []).map((p, i) => (
              <div key={i} className="mb-4 pl-3 border-l-2 border-blue-700">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold text-blue-300">{p.source}</span>
                  <span className="text-xs text-slate-600">· {p.bias}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{p.view}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">{c.historicalContext?.summary}</p>
            <div className="relative pl-10">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-[#1E2D4A]" />
              {(c.historicalContext?.keyEvents ?? []).map((e, i) => (
                <div key={i} className="flex gap-3 mb-3 relative">
                  <span className="absolute -left-10 text-xs font-mono text-blue-500 w-9 text-right">{e.year}</span>
                  <div className="absolute -left-1.5 top-1 w-2 h-2 rounded-full bg-blue-600 z-10 flex-shrink-0" />
                  <p className="text-xs text-slate-400 leading-snug pl-2">{e.event}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'investment' && (
          <div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-emerald-400 mb-2">Strengths</p>
              {(c.investmentNotes?.strengths ?? []).map((s, i) => (
                <p key={i} className="text-xs text-slate-400 mb-1.5 flex gap-2"><span className="text-emerald-700 flex-shrink-0">▸</span>{s}</p>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-red-400 mb-2">Risks</p>
              {(c.investmentNotes?.risks ?? []).map((r, i) => (
                <p key={i} className="text-xs text-slate-400 mb-1.5 flex gap-2"><span className="text-red-700 flex-shrink-0">▸</span>{r}</p>
              ))}
            </div>
            <div className="mb-4">
              <p className="text-xs font-semibold text-blue-400 mb-2">Key Sectors</p>
              <div className="flex flex-wrap gap-1">
                {(c.investmentNotes?.sectors ?? []).map(s => (
                  <span key={s} className="text-xs bg-blue-950/50 text-blue-300 border border-blue-900 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-[#1E2D4A]">
              <p className="text-xs text-slate-600 mb-2">Sources</p>
              {(c.sources ?? []).map((s, i) => (
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
