import { useState, useMemo } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip as ChartTooltip,
} from 'recharts'
import Fuse from 'fuse.js'
import { useMapStore } from '../../store/useMapStore'
import type { Country } from '../../types/country'
import countryIndex    from '../../data/country-index.json'
import airportsRaw     from '../../data/validated/airports.json'
import seaportsRaw     from '../../data/validated/seaports.json'
import powerPlantsRaw  from '../../data/validated/power-plants.json'
import railHubsRaw     from '../../data/validated/rail-hubs.json'
import datacentersRaw  from '../../data/validated/datacenters.json'
import foodSecurityRaw from '../../data/validated/food-security.json'
import aiAdoptionRaw   from '../../data/validated/ai-adoption.json'
import utilitiesRaw    from '../../data/validated/utilities.json'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  card:    'bg-[#0D1829] border border-[#1E2D4A] rounded-lg',
  section: 'text-[10px] uppercase tracking-widest font-semibold text-slate-500',
  label:   'text-[11px] text-slate-500',
  body:    'text-[12px] text-slate-300 leading-[1.65] break-words',
  value:   'text-[13px] font-semibold text-white',
  mono:    'font-mono text-blue-400',
}

// ─── Data maps ────────────────────────────────────────────────────────────────
const INDICATORS = [
  { key: 'politicalStability',       label: 'Political Stability' },
  { key: 'economicDirection',        label: 'Economic Direction' },
  { key: 'investmentAttractiveness', label: 'Invest. Attractiveness' },
  { key: 'geopoliticalRisk',         label: 'Geopolitical Risk' },
  { key: 'educationQuality',         label: 'Education Quality' },
  { key: 'healthcareQuality',        label: 'Healthcare Quality' },
  { key: 'technologyInvestment',     label: 'Tech Investment' },
]

const REL_BORDER: Record<string, string> = {
  ally: 'border-emerald-600', treaty_ally: 'border-emerald-600',
  strategic_partner: 'border-blue-600', trade_partner: 'border-sky-600',
  neutral: 'border-slate-600', contested: 'border-amber-600',
  rival: 'border-orange-600', enemy: 'border-red-600',
}
const REL_BADGE: Record<string, string> = {
  ally: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  treaty_ally: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  strategic_partner: 'bg-blue-900/60 text-blue-300 border-blue-700',
  trade_partner: 'bg-sky-900/60 text-sky-300 border-sky-700',
  neutral: 'bg-slate-800 text-slate-400 border-slate-600',
  contested: 'bg-amber-900/60 text-amber-300 border-amber-700',
  rival: 'bg-orange-900/60 text-orange-300 border-orange-700',
  enemy: 'bg-red-900/60 text-red-300 border-red-700',
}

const TREND_ICON: Record<string, string>  = { rising: '↑', improving: '↑', stable: '→', declining: '↓' }
const TREND_COL:  Record<string, string>  = { rising: '#f87171', improving: '#4ade80', stable: '#475569', declining: '#f87171' }
const CONF_COL:   Record<string, string>  = { high: '#4ade80', medium: '#f59e0b', low: '#f87171' }
const SCORE_COL = (s: number) => s >= 7 ? '#22c55e' : s >= 4 ? '#f59e0b' : '#ef4444'

type Tab = 'overview' | 'indicators' | 'relationships' | 'perspectives' | 'history' | 'investment' | 'infrastructure'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',        label: 'Overview' },
  { id: 'indicators',      label: 'Indicators' },
  { id: 'relationships',   label: 'Relations' },
  { id: 'perspectives',    label: 'Perspectives' },
  { id: 'history',         label: 'History' },
  { id: 'investment',      label: 'Investment' },
  { id: 'infrastructure',  label: 'Infrastructure' },
]

// ─── Infrastructure color maps (match layer colors) ───────────────────────────
const PLANT_COLOR: Record<string, string> = {
  nuclear: '#a78bfa', coal: '#78716c', gas: '#f59e0b', oil: '#92400e',
  hydro: '#0ea5e9', solar: '#fbbf24', wind: '#34d399', geothermal: '#f97316', other: '#64748b',
}
const PORT_COLOR: Record<string, string> = {
  container: '#06b6d4', oil: '#f59e0b', lng: '#f97316', bulk: '#8b5cf6',
  multipurpose: '#3b82f6', naval: '#ef4444', mixed: '#22c55e',
}
const DC_COLOR: Record<string, string> = {
  hyperscale: '#a78bfa', colocation: '#22d3ee', enterprise: '#64748b', government: '#ef4444',
}
const RAIL_COLOR: Record<string, string> = {
  passenger: '#60a5fa', freight: '#f59e0b', mixed: '#a78bfa',
  high_speed: '#22d3ee', border_crossing: '#f97316', port_interface: '#34d399',
}

function formatMW(mw?: number | null) {
  if (!mw) return null
  return mw >= 1000 ? `${(mw / 1000).toFixed(1)} GW` : `${mw} MW`
}
function formatTEU(teu?: number | null, tonnes?: number | null) {
  if (teu) return teu >= 1e6 ? `${(teu / 1e6).toFixed(1)}M TEU` : `${(teu / 1e3).toFixed(0)}K TEU`
  if (tonnes) return tonnes >= 1e6 ? `${(tonnes / 1e6).toFixed(1)}Mt` : `${(tonnes / 1e3).toFixed(0)}Kt`
  return null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function flag(iso2: string) {
  return iso2.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0))).join('')
}
function pop(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  return n.toLocaleString()
}

// ─── Section wrapper — consistent spacing + header ────────────────────────────
function Sec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={`${T.section} mb-2.5`}>{label}</p>
      {children}
    </div>
  )
}

// ─── CompareSearch ────────────────────────────────────────────────────────────
interface Entry { id: string; iso2: string; name: string; region: string }
const allEntries = countryIndex as Entry[]
const fuse = new Fuse(allEntries, { keys: ['name'], threshold: 0.3 })

function CompareSearch() {
  const { setCompare, compareData, clearCompare, compareLoading } = useMapStore()
  const [q, setQ] = useState('')
  const [res, setRes] = useState<Entry[]>([])

  if (compareData) {
    return (
      <div className={`flex items-center gap-2 mt-3 px-3 py-2 ${T.card} min-w-0`}>
        <span className="flex-shrink-0 text-base">{flag(compareData.iso2)}</span>
        <span className="text-[12px] text-purple-300 flex-1 truncate min-w-0">{compareData.name}</span>
        <button onClick={clearCompare} className="flex-shrink-0 text-slate-500 hover:text-white text-lg leading-none">×</button>
      </div>
    )
  }

  return (
    <div className="relative mt-3">
      <input
        value={q}
        onChange={e => { setQ(e.target.value); setRes(e.target.value ? fuse.search(e.target.value).slice(0, 6).map(r => r.item) : []) }}
        placeholder="Compare with another country…"
        className={`w-full text-[12px] px-3 py-2 ${T.card} text-slate-300 placeholder-slate-600 outline-none bg-[#0D1829]`}
      />
      {compareLoading && <p className="text-[11px] text-slate-500 mt-1">Loading…</p>}
      {res.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0F1E] border border-[#1E2D4A] rounded-lg overflow-hidden z-20 shadow-2xl">
          {res.map(e => (
            <button key={e.id} onClick={() => { setCompare(e.id); setQ(''); setRes([]) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#0D1829] text-left min-w-0">
              <span className="flex-shrink-0">{flag(e.iso2)}</span>
              <div className="min-w-0">
                <p className="text-[12px] text-slate-200 truncate">{e.name}</p>
                <p className="text-[11px] text-slate-500">{e.region}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CountryPanel() {
  const { countryData, compareData, loading, error, clearSelection } = useMapStore()
  const [tab, setTab] = useState<Tab>('overview')

  // ── All hooks MUST be called before any early returns (Rules of Hooks) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const infra = useMemo(() => {
    const id = countryData?.id
    if (!id) return { airports: [], seaports: [], plants: [], railHubs: [], datacenters: [], foodSecurity: null, aiAdoption: null, utility: null }
    return {
      airports:    (airportsRaw    as any[]).filter(d => d.countryId === id),
      seaports:    (seaportsRaw    as any[]).filter(d => d.countryId === id),
      plants:      (powerPlantsRaw as any[]).filter(d => d.countryId === id && d.status !== 'decommissioned'),
      railHubs:    (railHubsRaw    as any[]).filter(d => d.countryId === id),
      datacenters: (datacentersRaw as any[]).filter(d => d.countryId === id),
      foodSecurity:(foodSecurityRaw as any[]).find(d => d.countryId === id) ?? null,
      aiAdoption:  (aiAdoptionRaw  as any[]).find(d => d.countryId === id) ?? null,
      utility:     (utilitiesRaw   as any[]).find(d => d.countryId === id) ?? null,
    }
  }, [countryData?.id])

  // ── Loading / error / empty states ──
  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[12px] text-slate-500">Loading intelligence data…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
      <span className="text-4xl">🗺️</span>
      <p className={`${T.body} text-slate-500`}>{error}</p>
      <button onClick={clearSelection} className="text-[11px] text-blue-400 hover:text-blue-300 underline">Back to map</button>
    </div>
  )

  if (!countryData) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
      <span className="text-5xl">🌍</span>
      <div>
        <p className="text-[13px] font-medium text-slate-400 mb-1.5">Click any country</p>
        <p className={`${T.label} leading-relaxed`}>
          214 countries with geopolitical context, relationships,<br />competing perspectives, and investment intelligence.
        </p>
      </div>
    </div>
  )

  const c: Country = countryData
  const cc = compareData

  const infraCount = infra.airports.length + infra.seaports.length + infra.plants.length +
                     infra.railHubs.length + infra.datacenters.length

  const radarData = INDICATORS.map(({ key, label }) => ({
    subject: label.split(' ')[0],
    A: c.indicators[key as keyof typeof c.indicators]?.score ?? 5,
    B: cc?.indicators[key as keyof typeof cc.indicators]?.score,
  }))

  return (
    // Outer: fixed-height flex column — only body scrolls
    <div className="flex flex-col h-full min-h-0 bg-[#0A0F1E]">

      {/* ── HEADER — never scrolls ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-[#1E2D4A]">
        <div className="flex items-start gap-3 min-w-0">
          {/* Flag */}
          <span className="text-3xl flex-shrink-0 leading-none mt-0.5">{flag(c.iso2)}</span>
          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-white leading-tight break-words">{c.name}</h2>
            <p className={`${T.label} mt-1 break-words`}>{c.subregion} · {c.capital}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Updated {c.lastUpdated}</p>
          </div>
          {/* Close */}
          <button onClick={clearSelection}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white hover:bg-[#1E2D4A] rounded transition-colors text-lg leading-none">
            ×
          </button>
        </div>
        <CompareSearch />
      </div>

      {/* ── TABS — never scrolls, never wraps ─────────────────────────────── */}
      <div className="flex-shrink-0 flex overflow-x-auto border-b border-[#1E2D4A]"
        style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-4 py-2.5 text-[11px] font-medium whitespace-nowrap
              transition-colors border-b-2 flex items-center gap-1.5 ${
              tab === t.id
                ? 'text-blue-400 border-blue-500'
                : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}>
            {t.label}
            {t.id === 'infrastructure' && infraCount > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none"
                style={{ background: tab === 'infrastructure' ? '#1e3a8a' : '#1E2D4A', color: tab === 'infrastructure' ? '#93c5fd' : '#475569' }}>
                {infraCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── BODY — only this scrolls ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 flex flex-col gap-5">

        {/* ════ OVERVIEW ════ */}
        {tab === 'overview' && <>

          {/* Summary */}
          <p className={T.body}>{c.summary}</p>

          {/* Demographics — auto-fit grid, works at any panel width */}
          <Sec label="Demographics">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
              {[
                ['Population',  pop(c.demographics.population)],
                ['Median Age',  `${c.demographics.medianAge} yrs`],
                ['Urban',       `${c.demographics.urbanizationRate}%`],
                ['Alliances',   `${c.alliances.length}`],
              ].map(([lbl, val]) => (
                <div key={lbl} className={`${T.card} p-3 flex flex-col gap-1.5`}>
                  <span className={T.section}>{lbl}</span>
                  <span className="text-[14px] font-bold text-white leading-none break-words">{val}</span>
                </div>
              ))}
            </div>
          </Sec>

          {/* Religion */}
          <Sec label="Religion">
            <div className="flex flex-col gap-2.5">
              {c.demographics.religions.map(r => (
                <div key={r.name} className="flex items-center gap-3 min-w-0">
                  <div className="flex-1 min-w-0 h-1.5 bg-[#1E2D4A] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${r.percent}%` }} />
                  </div>
                  <span className="flex-shrink-0 text-[11px] text-slate-400 text-right tabular-nums"
                    style={{ minWidth: '8rem' }}>
                    {r.name} <span className="text-slate-300 font-medium">{r.percent}%</span>
                  </span>
                </div>
              ))}
            </div>
          </Sec>

          {/* Alliances */}
          <Sec label="Alliances & Memberships">
            <div className="flex flex-wrap gap-1.5">
              {c.alliances.map(a => (
                <span key={a}
                  className="text-[11px] px-2.5 py-1 bg-[#0D1829] border border-[#1E2D4A] rounded-full text-slate-400 break-words">
                  {a}
                </span>
              ))}
            </div>
          </Sec>
        </>}

        {/* ════ INDICATORS ════ */}
        {tab === 'indicators' && <>

          {/* Radar chart */}
          <div style={{ height: 220, minHeight: 180, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 35, bottom: 10, left: 35 }}>
                <PolarGrid stroke="#1E2D4A" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10 }} />
                <Radar name={c.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.18}
                  dot={{ fill: '#3b82f6', r: 2.5 }} />
                {cc && <Radar name={cc.name} dataKey="B" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.12}
                  dot={{ fill: '#a78bfa', r: 2.5 }} />}
                <ChartTooltip
                  contentStyle={{ background: '#0D1829', border: '1px solid #1E2D4A', borderRadius: 6, fontSize: 11 }}
                  labelStyle={{ color: '#64748b' }} itemStyle={{ color: '#94a3b8' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Compare legend */}
          {cc && (
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-[11px] text-slate-400 break-words">{c.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-400 flex-shrink-0" />
                <span className="text-[11px] text-slate-400 break-words">{cc.name}</span>
              </div>
            </div>
          )}

          {/* Score bars */}
          <Sec label="Scores 1–10">
            <div className="flex flex-col gap-3">
              {INDICATORS.map(({ key, label }) => {
                const ind = c.indicators[key as keyof typeof c.indicators]
                if (!ind) return null
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
                      <span className="text-[11px] text-slate-400 min-w-0 flex-1 break-words">{label}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px]" style={{ color: CONF_COL[ind.confidence] }}>{ind.confidence}</span>
                        <span className="text-[10px]" style={{ color: TREND_COL[ind.trend] }}>
                          {TREND_ICON[ind.trend]} {ind.trend}
                        </span>
                        <span className="text-[12px] font-bold tabular-nums text-white w-4 text-right">
                          {ind.score}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#1E2D4A] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${(ind.score / 10) * 100}%`, background: SCORE_COL(ind.score) }} />
                    </div>
                    {ind.note && <p className="text-[11px] text-slate-600 mt-1.5 leading-snug break-words">{ind.note}</p>}
                  </div>
                )
              })}
            </div>
          </Sec>
        </>}

        {/* ════ RELATIONSHIPS ════ */}
        {tab === 'relationships' && <>
          <p className={T.label}>{c.relationships?.length ?? 0} key bilateral relationships</p>
          {(c.relationships ?? []).map((r, i) => (
            <div key={i}
              className={`${T.card} p-3 border-l-2 ${REL_BORDER[r.type] ?? 'border-slate-600'}`}
              style={{ borderLeftWidth: 3 }}>
              <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
                <span className="text-[13px] font-semibold text-white break-words min-w-0 flex-1 leading-snug">
                  {r.countryName}
                </span>
                <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${REL_BADGE[r.type] ?? REL_BADGE.neutral}`}>
                  {r.type.replace(/_/g, ' ')}
                </span>
              </div>
              <p className={`${T.body} text-slate-400`}>{r.summary}</p>
            </div>
          ))}
        </>}

        {/* ════ PERSPECTIVES ════ */}
        {tab === 'perspectives' && <>
          <div className="px-3 py-2.5 bg-[#0D1829] border border-[#1E2D4A] rounded-lg">
            <p className={`${T.label} leading-relaxed`}>
              Competing narratives presented without endorsement.<br />
              Read all views before drawing conclusions.
            </p>
          </div>
          {(c.perspectives ?? []).map((p, i) => (
            <div key={i} className={`${T.card} p-3`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                <span className="text-[12px] font-semibold text-blue-300 break-words">{p.source}</span>
                <span className="text-[10px] px-2 py-0.5 bg-[#1E2D4A] rounded text-slate-500">{p.bias}</span>
              </div>
              <p className={T.body}>{p.view}</p>
            </div>
          ))}
        </>}

        {/* ════ HISTORY ════ */}
        {tab === 'history' && <>
          <p className={T.body}>{c.historicalContext?.summary}</p>
          <Sec label="Key Events">
            <div className="relative flex flex-col gap-3.5">
              {/* Timeline line */}
              <div className="absolute left-[3.25rem] top-1 bottom-1 w-px bg-[#1E2D4A]" />
              {(c.historicalContext?.keyEvents ?? []).map((e, i) => (
                <div key={i} className="flex items-start gap-3 min-w-0">
                  {/* Year */}
                  <span className={`flex-shrink-0 w-11 text-right text-[11px] ${T.mono} pt-0.5 tabular-nums`}>
                    {e.year}
                  </span>
                  {/* Dot */}
                  <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-[#0A0F1E] border-2 border-blue-500 mt-1 relative z-10" />
                  {/* Event */}
                  <p className={`${T.body} min-w-0 flex-1`}>{e.event}</p>
                </div>
              ))}
            </div>
          </Sec>
        </>}

        {/* ════ INVESTMENT ════ */}
        {tab === 'investment' && <>

          <Sec label="Strengths">
            <div className="flex flex-col gap-2">
              {(c.investmentNotes?.strengths ?? []).map((s, i) => (
                <div key={i} className="flex gap-2.5 min-w-0">
                  <span className="flex-shrink-0 text-emerald-500 font-bold text-[12px] mt-0.5">✓</span>
                  <p className={`${T.body} min-w-0`}>{s}</p>
                </div>
              ))}
            </div>
          </Sec>

          <Sec label="Risks">
            <div className="flex flex-col gap-2">
              {(c.investmentNotes?.risks ?? []).map((r, i) => (
                <div key={i} className="flex gap-2.5 min-w-0">
                  <span className="flex-shrink-0 text-red-500 font-bold text-[12px] mt-0.5">⚠</span>
                  <p className={`${T.body} min-w-0`}>{r}</p>
                </div>
              ))}
            </div>
          </Sec>

          <Sec label="Key Sectors">
            <div className="flex flex-wrap gap-1.5">
              {(c.investmentNotes?.sectors ?? []).map(s => (
                <span key={s}
                  className="text-[11px] px-2.5 py-1 bg-blue-950/50 text-blue-300 rounded-full border border-blue-800/60 break-words">
                  {s}
                </span>
              ))}
            </div>
          </Sec>

          <Sec label="Sources">
            <div className="flex flex-col gap-1.5">
              {(c.sources ?? []).map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] text-blue-400 hover:text-blue-300 underline break-words leading-relaxed">
                  {s.name} ↗
                </a>
              ))}
            </div>
          </Sec>
        </>}

        {/* ════ INFRASTRUCTURE ════ */}
        {tab === 'infrastructure' && <>

          {infraCount === 0 && (
            <p className={T.label}>No infrastructure data available for this country yet.</p>
          )}

          {/* Airports */}
          {infra.airports.length > 0 && (
            <Sec label={`Airports (${infra.airports.length})`}>
              <div className="flex flex-col gap-2">
                {infra.airports.map((a: any) => (
                  <div key={a.id} className={`${T.card} px-3 py-2 flex items-start justify-between gap-2`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {a.iata && <span className="text-[10px] font-mono text-slate-500">{a.iata}</span>}
                        <span className="text-[12px] font-medium text-slate-200 truncate">{a.name}</span>
                      </div>
                      {a.geopoliticalNotes && <p className="text-[10px] text-slate-600 mt-0.5 leading-snug line-clamp-2">{a.geopoliticalNotes}</p>}
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-semibold uppercase"
                      style={{ background: '#1E2D4A', color: a.strategicImportance === 'critical' ? '#f97316' : a.strategicImportance === 'high' ? '#3b82f6' : '#64748b' }}>
                      {a.strategicImportance}
                    </span>
                  </div>
                ))}
              </div>
            </Sec>
          )}

          {/* Seaports */}
          {infra.seaports.length > 0 && (
            <Sec label={`Seaports (${infra.seaports.length})`}>
              <div className="flex flex-col gap-2">
                {infra.seaports.map((p: any) => (
                  <div key={p.id} className={`${T.card} px-3 py-2 flex items-start justify-between gap-2`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-slate-200 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: PORT_COLOR[p.type] ?? '#64748b' }}>{p.type}</span>
                        {formatTEU(p.annualThroughputTEU, p.annualThroughputTonnes) && (
                          <span className="text-[10px] text-slate-600">{formatTEU(p.annualThroughputTEU, p.annualThroughputTonnes)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Sec>
          )}

          {/* Power Plants */}
          {infra.plants.length > 0 && (
            <Sec label={`Power Plants (${infra.plants.length})`}>
              <div className="flex flex-col gap-2">
                {infra.plants.map((p: any) => (
                  <div key={p.id} className={`${T.card} px-3 py-2 flex items-start justify-between gap-2`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-slate-200 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: PLANT_COLOR[p.type] ?? '#64748b' }}>{p.type}</span>
                        {formatMW(p.capacityMW) && <span className="text-[10px] text-slate-600">{formatMW(p.capacityMW)}</span>}
                      </div>
                    </div>
                    {p.status !== 'operating' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 bg-[#1E2D4A] text-slate-500 uppercase">{p.status}</span>
                    )}
                  </div>
                ))}
              </div>
            </Sec>
          )}

          {/* Datacenters */}
          {infra.datacenters.length > 0 && (
            <Sec label={`Datacenters (${infra.datacenters.length})`}>
              <div className="flex flex-col gap-2">
                {infra.datacenters.map((d: any) => (
                  <div key={d.id} className={`${T.card} px-3 py-2 flex items-start justify-between gap-2`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-slate-200 truncate">{d.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: DC_COLOR[d.type] ?? '#64748b' }}>{d.type}</span>
                        {d.operator && <span className="text-[10px] text-slate-600 truncate">{d.operator}</span>}
                      </div>
                    </div>
                    {d.cloudRegion && (
                      <span className="text-[9px] font-mono text-slate-600 flex-shrink-0">{d.cloudRegion}</span>
                    )}
                  </div>
                ))}
              </div>
            </Sec>
          )}

          {/* Rail Hubs */}
          {infra.railHubs.length > 0 && (
            <Sec label={`Rail Hubs (${infra.railHubs.length})`}>
              <div className="flex flex-col gap-2">
                {infra.railHubs.map((r: any) => (
                  <div key={r.id} className={`${T.card} px-3 py-2 flex items-start justify-between gap-2`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-slate-200 truncate">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: RAIL_COLOR[r.type] ?? '#64748b' }}>
                          {r.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    {r.isPartOfBRI && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-semibold"
                        style={{ background: '#7f1d1d44', color: '#f87171', border: '1px solid #7f1d1d' }}>BRI</span>
                    )}
                  </div>
                ))}
              </div>
            </Sec>
          )}

          {/* Food Security + AI Adoption */}
          {(infra.foodSecurity || infra.aiAdoption || infra.utility) && (
            <Sec label="Country Indicators">
              <div className="flex flex-col gap-2">
                {infra.foodSecurity && (
                  <div className={`${T.card} px-3 py-2 flex justify-between items-center`}>
                    <span className={T.label}>Food Security (GFSI)</span>
                    <span className="text-[13px] font-bold tabular-nums"
                      style={{ color: infra.foodSecurity.overallScore >= 60 ? '#22c55e' : infra.foodSecurity.overallScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                      {infra.foodSecurity.overallScore?.toFixed(1)}<span className="text-[10px] text-slate-600">/100</span>
                    </span>
                  </div>
                )}
                {infra.aiAdoption?.aiReadinessScore && (
                  <div className={`${T.card} px-3 py-2 flex justify-between items-center`}>
                    <span className={T.label}>AI Readiness</span>
                    <span className="text-[13px] font-bold text-violet-400 tabular-nums">
                      {infra.aiAdoption.aiReadinessScore.toFixed(1)}<span className="text-[10px] text-slate-600">/100</span>
                    </span>
                  </div>
                )}
                {infra.utility?.electricityMix && (
                  <div className={`${T.card} px-3 py-2`}>
                    <p className={`${T.label} mb-2`}>Energy Mix ({infra.utility.year})</p>
                    <div className="flex flex-col gap-1.5">
                      {Object.entries(infra.utility.electricityMix as Record<string,number>)
                        .filter(([, v]) => v != null && (v as number) > 0)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 5)
                        .map(([src, pct]) => (
                          <div key={src} className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] text-slate-500 w-14 flex-shrink-0 capitalize">{src}</span>
                            <div className="flex-1 h-1.5 bg-[#1E2D4A] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PLANT_COLOR[src] ?? '#3b82f6' }} />
                            </div>
                            <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </Sec>
          )}

        </>}

      </div>
    </div>
  )
}
