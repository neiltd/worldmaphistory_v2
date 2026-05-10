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

const INDICATOR_KEYS = [
  { key: 'politicalStability',       label: 'Political Stability' },
  { key: 'economicDirection',        label: 'Economic Direction' },
  { key: 'investmentAttractiveness', label: 'Investment Attractiveness' },
  { key: 'geopoliticalRisk',         label: 'Geopolitical Risk' },
  { key: 'educationQuality',         label: 'Education Quality' },
  { key: 'healthcareQuality',        label: 'Healthcare Quality' },
  { key: 'technologyInvestment',     label: 'Technology Investment' },
]

const REL_STYLE: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  ally:             { bg: '#052e16', border: '#166534', badge: '#14532d', text: '#4ade80' },
  treaty_ally:      { bg: '#052e16', border: '#166534', badge: '#14532d', text: '#4ade80' },
  strategic_partner:{ bg: '#0c1a3a', border: '#1e3a5f', badge: '#1e3a5f', text: '#60a5fa' },
  trade_partner:    { bg: '#0c1a3a', border: '#1e3a5f', badge: '#1e3a5f', text: '#7dd3fc' },
  neutral:          { bg: '#111827', border: '#1f2937', badge: '#1f2937', text: '#94a3b8' },
  contested:        { bg: '#1c0f03', border: '#92400e', badge: '#78350f', text: '#fb923c' },
  rival:            { bg: '#1a0a03', border: '#7c2d12', badge: '#7c2d12', text: '#f97316' },
  enemy:            { bg: '#1c0505', border: '#7f1d1d', badge: '#7f1d1d', text: '#f87171' },
}

const TREND_ICON: Record<string, string> = { rising: '↑', improving: '↑', stable: '→', declining: '↓' }
const TREND_COLOR: Record<string, string> = {
  rising: '#f87171', declining: '#f87171', improving: '#4ade80', stable: '#475569',
}
const CONFIDENCE_COLOR: Record<string, string> = {
  high: '#4ade80', medium: '#f59e0b', low: '#f87171',
}

function flag(iso2: string) {
  return iso2.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  ).join('')
}
function fmtPop(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  return n.toLocaleString()
}

interface CountryEntry { id: string; iso2: string; name: string; region: string }
const entries = countryIndex as CountryEntry[]
const fuse = new Fuse(entries, { keys: ['name'], threshold: 0.3 })

function CompareSearch() {
  const { setCompare, compareData, clearCompare, compareLoading } = useMapStore()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<CountryEntry[]>([])

  if (compareData) {
    return (
      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg" style={{ background: '#1a0e2e', border: '1px solid #4c1d95' }}>
        <span>{flag(compareData.iso2)}</span>
        <span className="text-sm text-purple-300 flex-1 truncate">{compareData.name}</span>
        <button onClick={clearCompare} className="text-slate-500 hover:text-white">×</button>
      </div>
    )
  }

  return (
    <div className="relative mt-2">
      <input type="text" value={q}
        onChange={e => { setQ(e.target.value); setResults(e.target.value ? fuse.search(e.target.value).slice(0, 6).map(r => r.item) : []) }}
        placeholder="Compare with another country..."
        className="w-full text-sm rounded-lg px-3 py-1.5 outline-none"
        style={{ background: '#0E1525', border: '1px solid #1E2D4A', color: '#cbd5e1' }}
      />
      {compareLoading && <p className="text-xs text-slate-500 mt-1">Loading...</p>}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-20 shadow-2xl" style={{ background: '#0E1525', border: '1px solid #1E2D4A' }}>
          {results.map(c => (
            <button key={c.id} onClick={() => { setCompare(c.id); setQ(''); setResults([]) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#151F35] text-left">
              <span className="text-base">{flag(c.iso2)}</span>
              <div><p className="text-sm text-slate-200">{c.name}</p><p className="text-xs text-slate-500">{c.region}</p></div>
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
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading intelligence data...</p>
      </div>
    </div>
  )

  if (error || !c) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
      <div className="text-5xl">🌍</div>
      <div>
        <p className="text-base font-medium text-slate-300">{error || 'Click any country on the map'}</p>
        <p className="text-sm text-slate-600 mt-1">214 countries with full intelligence profiles</p>
      </div>
    </div>
  )

  const radarData = INDICATOR_KEYS.map(({ key, label }) => ({
    subject: label.split(' ')[0], // short label for radar axis
    A: c.indicators[key as keyof typeof c.indicators]?.score ?? 5,
    B: cc?.indicators[key as keyof typeof cc.indicators]?.score,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 pt-4 pb-3 border-b flex-shrink-0" style={{ borderColor: '#1E2D4A' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-3xl leading-none flex-shrink-0">{flag(c.iso2)}</span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white leading-tight">{c.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{c.capital} · {c.subregion}</p>
              <p className="text-xs text-slate-700 mt-0.5">Updated {c.lastUpdated}</p>
            </div>
          </div>
          <button onClick={clearSelection} className="text-slate-600 hover:text-white text-xl w-7 h-7 flex items-center justify-center flex-shrink-0">×</button>
        </div>
        <CompareSearch />
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: '#1E2D4A' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2"
            style={tab === t.id
              ? { color: '#60a5fa', borderColor: '#3b82f6' }
              : { color: '#475569', borderColor: 'transparent' }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (
          <div className="p-5 space-y-5">
            <p className="text-sm leading-7 text-slate-400">{c.summary}</p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Population', fmtPop(c.demographics.population)],
                ['Median Age', `${c.demographics.medianAge} yrs`],
                ['Urban', `${c.demographics.urbanizationRate}%`],
                ['Alliances', `${c.alliances.length}`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl p-3.5" style={{ background: '#0E1525', border: '1px solid #1E2D4A' }}>
                  <p className="text-xs text-slate-600 mb-1">{k}</p>
                  <p className="text-base font-semibold text-white">{v}</p>
                </div>
              ))}
            </div>

            {/* Religion */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">Religion</p>
              <div className="space-y-2.5">
                {c.demographics.religions.map(r => (
                  <div key={r.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-400">{r.name}</span>
                      <span className="text-sm font-medium text-slate-300">{r.percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1E2D4A' }}>
                      <div className="h-full rounded-full bg-blue-600" style={{ width: `${r.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alliances */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">Alliances & Memberships</p>
              <div className="flex flex-wrap gap-1.5">
                {c.alliances.map(a => (
                  <span key={a} className="text-xs px-2.5 py-1 rounded-full text-slate-400" style={{ background: '#0E1525', border: '1px solid #1E2D4A' }}>{a}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ INDICATORS ═══ */}
        {tab === 'indicators' && (
          <div className="p-5 space-y-5">
            {/* Radar chart */}
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 35, bottom: 10, left: 35 }}>
                  <PolarGrid stroke="#1E2D4A" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Radar name={c.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} dot={{ fill: '#3b82f6', r: 3 }} />
                  {cc && <Radar name={cc.name} dataKey="B" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} dot={{ fill: '#a78bfa', r: 3 }} />}
                  <RechartTooltip contentStyle={{ background: '#0E1525', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {cc && (
              <div className="flex gap-5">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-sm text-slate-400">{c.name}</span></div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-violet-400" /><span className="text-sm text-slate-400">{cc.name}</span></div>
              </div>
            )}

            <p className="text-xs text-slate-600">Scores 1–10 · Confidence shown</p>

            {/* Score bars */}
            <div className="space-y-4">
              {INDICATOR_KEYS.map(({ key, label }) => {
                const ind = c.indicators[key as keyof typeof c.indicators]
                if (!ind) return null
                const barColor = ind.score >= 7 ? '#22c55e' : ind.score >= 4 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-300">{label}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs" style={{ color: CONFIDENCE_COLOR[ind.confidence] }}>{ind.confidence}</span>
                        <span className="text-sm" style={{ color: TREND_COLOR[ind.trend] }}>{TREND_ICON[ind.trend]} {ind.trend}</span>
                        <span className="text-sm font-bold text-white w-5 text-right">{ind.score}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1E2D4A' }}>
                      <div className="h-full rounded-full" style={{ width: `${(ind.score / 10) * 100}%`, background: barColor }} />
                    </div>
                    {ind.note && <p className="text-xs mt-1.5 text-slate-600 leading-relaxed">{ind.note}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ RELATIONSHIPS ═══ */}
        {tab === 'relationships' && (
          <div className="p-5">
            <p className="text-sm text-slate-600 mb-4">{c.relationships?.length ?? 0} key bilateral relationships</p>
            <div className="space-y-3">
              {(c.relationships ?? []).map((r, i) => {
                const s = REL_STYLE[r.type] ?? REL_STYLE.neutral
                return (
                  <div key={i} className="rounded-xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-semibold text-white">{r.countryName}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize" style={{ background: s.badge, color: s.text }}>
                        {r.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-400">{r.summary}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ PERSPECTIVES ═══ */}
        {tab === 'perspectives' && (
          <div className="p-5">
            <div className="rounded-xl p-3.5 mb-5" style={{ background: '#0a1020', border: '1px solid #1E2D4A' }}>
              <p className="text-sm text-slate-500 leading-relaxed">Competing narratives are presented without endorsement. Read all perspectives before forming conclusions.</p>
            </div>
            <div className="space-y-5">
              {(c.perspectives ?? []).map((p, i) => (
                <div key={i} className="pl-4" style={{ borderLeft: '2px solid #1d4ed8' }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold text-blue-300">{p.source}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-slate-500" style={{ background: '#1E2D4A' }}>{p.bias}</span>
                  </div>
                  <p className="text-sm leading-7 text-slate-400">{p.view}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ HISTORY ═══ */}
        {tab === 'history' && (
          <div className="p-5">
            <p className="text-sm leading-7 text-slate-400 mb-6">{c.historicalContext?.summary}</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-4">Key Events</p>
            <div className="relative">
              <div className="absolute top-0 bottom-0 w-px" style={{ left: '3.25rem', background: '#1E2D4A' }} />
              <div className="space-y-4">
                {(c.historicalContext?.keyEvents ?? []).map((e, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-10 text-right flex-shrink-0 text-sm font-mono font-bold pt-0.5 text-blue-500">{e.year}</span>
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1 z-10 border-2" style={{ background: '#070B14', borderColor: '#3b82f6', marginLeft: '0.35rem' }} />
                    <p className="text-sm leading-relaxed text-slate-400">{e.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ INVESTMENT ═══ */}
        {tab === 'investment' && (
          <div className="p-5 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Strengths</p>
              <div className="space-y-2">
                {(c.investmentNotes?.strengths ?? []).map((s, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-emerald-600 font-bold flex-shrink-0 mt-0.5">✓</span>
                    <p className="text-sm leading-relaxed text-slate-400">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-3">Risks</p>
              <div className="space-y-2">
                {(c.investmentNotes?.risks ?? []).map((r, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-red-600 font-bold flex-shrink-0 mt-0.5">⚠</span>
                    <p className="text-sm leading-relaxed text-slate-400">{r}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">Key Sectors</p>
              <div className="flex flex-wrap gap-2">
                {(c.investmentNotes?.sectors ?? []).map(s => (
                  <span key={s} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: '#0c1a3a', border: '1px solid #1e3a5f', color: '#60a5fa' }}>{s}</span>
                ))}
              </div>
            </div>

            <div className="pt-4" style={{ borderTop: '1px solid #1E2D4A' }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mb-3">Sources</p>
              <div className="space-y-2">
                {(c.sources ?? []).map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                    {s.name} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
