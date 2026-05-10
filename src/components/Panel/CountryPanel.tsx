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
  investmentAttractiveness: 'Investment Attractiveness',
  geopoliticalRisk:         'Geopolitical Risk',
  educationQuality:         'Education Quality',
  healthcareQuality:        'Healthcare Quality',
  technologyInvestment:     'Technology Investment',
}

const REL_BG: Record<string, string> = {
  ally: '#052e16', treaty_ally: '#052e16', strategic_partner: '#0c1a3a',
  trade_partner: '#0c1a3a', neutral: '#111827', contested: '#1c0f03',
  rival: '#1a0a03', enemy: '#1c0505',
}
const REL_BORDER: Record<string, string> = {
  ally: '#14532d', treaty_ally: '#14532d', strategic_partner: '#1e3a5f',
  trade_partner: '#1e3a5f', neutral: '#1f2937', contested: '#92400e',
  rival: '#7c2d12', enemy: '#7f1d1d',
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
  rising: '#f87171', declining: '#f87171',
  improving: '#4ade80', stable: '#64748b',
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

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>
      {children}
    </p>
  )
}

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
      <div className="flex items-center gap-2.5 mt-3 px-3 py-2 rounded-lg border"
        style={{ background: '#1a0e2e', borderColor: '#4c1d95' }}>
        <span className="text-base">{flag(compareData.iso2)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-purple-300 truncate">{compareData.name}</p>
          <p className="text-xs" style={{ color: '#6d28d9' }}>Comparing</p>
        </div>
        <button onClick={clearCompare} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
      </div>
    )
  }

  return (
    <div className="relative mt-3">
      <input
        type="text"
        value={q}
        onChange={e => handleChange(e.target.value)}
        placeholder="Compare with another country..."
        className="w-full text-sm placeholder-slate-600 rounded-lg px-3 py-2 outline-none"
        style={{ background: '#0E1525', border: '1px solid #1E2D4A', color: '#cbd5e1' }}
      />
      {compareLoading && <p className="text-sm text-slate-500 mt-1">Loading...</p>}
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-20 shadow-2xl"
          style={{ background: '#0E1525', border: '1px solid #1E2D4A' }}>
          {results.map(c => (
            <button key={c.id} onClick={() => { setCompare(c.id); setQ(''); setResults([]) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#151F35] text-left transition-colors">
              <span className="text-lg">{flag(c.iso2)}</span>
              <div>
                <p className="text-sm text-slate-200">{c.name}</p>
                <p className="text-xs" style={{ color: '#475569' }}>{c.region}</p>
              </div>
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
    <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-3">
      <div className="text-5xl">🗺️</div>
      <p className="text-base text-slate-300 font-medium">{error || 'Click any country'}</p>
      <p className="text-sm" style={{ color: '#475569' }}>214 countries with full intelligence profiles</p>
    </div>
  )

  const radarData = Object.entries(INDICATOR_LABELS).map(([key, name]) => ({
    subject: name.replace(' ', '\n'),
    A: c.indicators[key as keyof typeof c.indicators]?.score ?? 5,
    B: cc?.indicators[key as keyof typeof cc.indicators]?.score,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden panel-enter">

      {/* ── Header ── */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0 border-b" style={{ borderColor: '#1E2D4A' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-3xl flex-shrink-0">{flag(c.iso2)}</span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white leading-tight truncate">{c.name}</h2>
              <p className="text-sm mt-0.5" style={{ color: '#475569' }}>{c.capital} · {c.subregion}</p>
            </div>
          </div>
          <button onClick={clearSelection}
            className="w-7 h-7 flex items-center justify-center rounded-md text-lg leading-none transition-colors flex-shrink-0"
            style={{ color: '#475569' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          >×</button>
        </div>
        <CompareSearch />
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-shrink-0 overflow-x-auto border-b" style={{ borderColor: '#1E2D4A' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors"
            style={tab === t.id
              ? { color: '#60a5fa', borderBottom: '2px solid #3b82f6' }
              : { color: '#475569' }}
            onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.color = '#94a3b8' }}
            onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.color = '#475569' }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <p className="text-sm leading-7" style={{ color: '#94a3b8' }}>{c.summary}</p>

            <div>
              <SectionLabel>At a Glance</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Population', fmtPop(c.demographics.population)],
                  ['Median Age', `${c.demographics.medianAge} yrs`],
                  ['Urbanization', `${c.demographics.urbanizationRate}%`],
                  ['Alliances', `${c.alliances.length} memberships`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl p-3.5 border" style={{ background: '#0E1525', borderColor: '#1E2D4A' }}>
                    <p className="text-xs mb-1" style={{ color: '#475569' }}>{k}</p>
                    <p className="text-base font-semibold text-white">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Religion</SectionLabel>
              <div className="space-y-2.5">
                {c.demographics.religions.map(r => (
                  <div key={r.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm" style={{ color: '#94a3b8' }}>{r.name}</span>
                      <span className="text-sm font-medium text-white">{r.percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1E2D4A' }}>
                      <div className="h-full rounded-full" style={{ width: `${r.percent}%`, background: '#3b82f6' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Alliances & Memberships</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {c.alliances.map(a => (
                  <span key={a} className="text-sm px-3 py-1 rounded-full border" style={{ background: '#0E1525', borderColor: '#1E2D4A', color: '#94a3b8' }}>{a}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INDICATORS */}
        {tab === 'indicators' && (
          <div className="space-y-5">
            <div className="h-64 -mx-3">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 16, right: 30, bottom: 16, left: 30 }}>
                  <PolarGrid stroke="#1E2D4A" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Radar name={c.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} dot={{ fill: '#3b82f6', r: 3 }} />
                  {cc && <Radar name={cc.name} dataKey="B" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} dot={{ fill: '#a78bfa', r: 3 }} />}
                  <RechartTooltip
                    contentStyle={{ background: '#0E1525', border: '1px solid #1E2D4A', borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {cc && (
              <div className="flex gap-5 px-1">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-sm" style={{ color: '#94a3b8' }}>{c.name}</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-400" /><span className="text-sm" style={{ color: '#94a3b8' }}>{cc.name}</span></div>
              </div>
            )}

            <div className="space-y-4 pt-1">
              {Object.entries(INDICATOR_LABELS).map(([key, label]) => {
                const ind = c.indicators[key as keyof typeof c.indicators]
                if (!ind) return null
                const barColor = ind.score >= 7 ? '#22c55e' : ind.score >= 4 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium" style={{ color: '#cbd5e1' }}>{label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm" style={{ color: TREND_COLOR[ind.trend] }}>{TREND_ICON[ind.trend]} {ind.trend}</span>
                        <span className="text-sm font-bold text-white w-5 text-right">{ind.score}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1E2D4A' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(ind.score / 10) * 100}%`, background: barColor }} />
                    </div>
                    {ind.note && <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#475569' }}>{ind.note}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* RELATIONSHIPS */}
        {tab === 'relationships' && (
          <div>
            <p className="text-sm mb-4" style={{ color: '#475569' }}>{c.relationships?.length ?? 0} key bilateral relationships</p>
            <div className="space-y-3">
              {(c.relationships ?? []).map((r, i) => (
                <div key={i} className="rounded-xl p-4 border" style={{ background: REL_BG[r.type] || '#111827', borderColor: REL_BORDER[r.type] || '#1f2937' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-semibold text-white">{r.countryName}</span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize" style={{ color: REL_TEXT[r.type] || '#94a3b8', background: 'rgba(0,0,0,0.3)' }}>
                      {r.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{r.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERSPECTIVES */}
        {tab === 'perspectives' && (
          <div>
            <div className="mb-5 px-4 py-3 rounded-xl border" style={{ background: '#0a1020', borderColor: '#1E2D4A' }}>
              <p className="text-sm" style={{ color: '#64748b' }}>
                Competing narratives are presented without endorsement. Read all perspectives before forming conclusions.
              </p>
            </div>
            <div className="space-y-5">
              {(c.perspectives ?? []).map((p, i) => (
                <div key={i} className="pl-4 border-l-2 border-blue-700">
                  <div className="flex items-start gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold text-blue-300">{p.source}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full mt-0.5" style={{ background: '#1E2D4A', color: '#64748b' }}>{p.bias}</span>
                  </div>
                  <p className="text-sm leading-7" style={{ color: '#94a3b8' }}>{p.view}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div>
            <p className="text-sm leading-7 mb-6" style={{ color: '#94a3b8' }}>{c.historicalContext?.summary}</p>
            <SectionLabel>Key Events</SectionLabel>
            <div className="relative">
              <div className="absolute left-12 top-0 bottom-0 w-px" style={{ background: '#1E2D4A' }} />
              <div className="space-y-5">
                {(c.historicalContext?.keyEvents ?? []).map((e, i) => (
                  <div key={i} className="flex gap-4 items-start relative">
                    <span className="w-10 text-right flex-shrink-0 text-sm font-mono font-bold pt-0.5" style={{ color: '#3b82f6' }}>{e.year}</span>
                    <div className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1 z-10" style={{ background: '#070B14', borderColor: '#3b82f6' }} />
                    <p className="text-sm leading-relaxed flex-1" style={{ color: '#94a3b8' }}>{e.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INVESTMENT */}
        {tab === 'investment' && (
          <div className="space-y-6">
            <div>
              <SectionLabel>Strengths</SectionLabel>
              <div className="space-y-2.5">
                {(c.investmentNotes?.strengths ?? []).map((s, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-base mt-0.5 flex-shrink-0">✓</span>
                    <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Risks</SectionLabel>
              <div className="space-y-2.5">
                {(c.investmentNotes?.risks ?? []).map((r, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-base mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }}>⚠</span>
                    <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{r}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Key Sectors</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {(c.investmentNotes?.sectors ?? []).map(s => (
                  <span key={s} className="text-sm px-3 py-1.5 rounded-lg border" style={{ background: '#0c1a3a', borderColor: '#1e3a5f', color: '#60a5fa' }}>{s}</span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: '#1E2D4A' }}>
              <SectionLabel>Sources</SectionLabel>
              <div className="space-y-2">
                {(c.sources ?? []).map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    <span>{s.name}</span><span>↗</span>
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
