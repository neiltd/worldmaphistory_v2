import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Marker } from 'react-map-gl/maplibre'
import railData from '../../data/validated/rail-hubs.json'
import type { LayerProps } from '../_core/types'

interface RailHub {
  id: string
  name: string
  countryId: string
  city: string
  coordinates: [number, number]
  type: string
  dailyPassengers?: number | null
  annualFreightTonnes?: number | null
  connectedCountries?: string[] | null
  gaugeType?: string | null
  lineCount?: number | null
  strategicImportance: 'critical' | 'high' | 'medium' | 'low'
  isPartOfBRI?: boolean | null
  geopoliticalNotes?: string | null
  notes?: string | null
}

const hubs = railData as unknown as RailHub[]

// ── Color by hub type ─────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  passenger:       '#60a5fa',   // blue    — people
  freight:         '#f59e0b',   // amber   — cargo
  mixed:           '#a78bfa',   // violet  — both
  high_speed:      '#22d3ee',   // cyan    — HSR
  border_crossing: '#f97316',   // orange  — strategic
  port_interface:  '#34d399',   // emerald — multimodal
  military:        '#ef4444',   // red     — military
}

const TYPE_LABEL: Record<string, string> = {
  passenger:       'Passenger',
  freight:         'Freight',
  mixed:           'Mixed',
  high_speed:      'High Speed',
  border_crossing: 'Border Crossing',
  port_interface:  'Port Interface',
  military:        'Military',
}

const IMPORTANCE_SIZE: Record<string, number> = {
  critical: 9,
  high:     7,
  medium:   5,
  low:      4,
}

function formatPassengers(n?: number | null): string {
  if (n == null) return '—'
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M/day`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K/day`
  return `${n}/day`
}

function formatFreight(n?: number | null): string {
  if (n == null) return '—'
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}Bt/yr`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}Mt/yr`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}Kt/yr`
  return `${n}t/yr`
}

// ── Rail icon (track symbol) ──────────────────────────────────────────────────
function RailIcon({ color, size, isBRI }: { color: string; size: number; isBRI?: boolean | null }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size * 2.2, height: size * 2.2 }}>
      <svg
        width={size * 2.2}
        height={size * 2.2}
        viewBox="0 0 24 24"
        fill={color}
        style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
      >
        {/* Rail track icon */}
        <path d="M4 15.5C4 16.88 4.88 18.04 6.09 18.45L4 20.54V21h2l2-2h8l2 2h2v-.46l-2.09-2.09C19.12 18.04 20 16.88 20 15.5V5c0-1.1-.89-2-2-2H6C4.9 3 4 3.9 4 5v10.5zm10 .5H10v-2h4v2zm4 0h-2v-2h2v2zm0-4H6V5h12v7zM6 16h2v-2H6v2z"/>
      </svg>
      {/* BRI indicator dot */}
      {isBRI && (
        <div
          className="absolute -top-0.5 -right-0.5 rounded-full"
          style={{ width: 5, height: 5, background: '#ef4444', border: '1px solid #0A0F1E' }}
        />
      )}
    </div>
  )
}

export default function RailHubLayer({ visible }: LayerProps) {
  const [tooltip, setTooltip] = useState<{
    hub: RailHub; x: number; y: number
  } | null>(null)

  if (!visible) return null

  return (
    <>
      {hubs.map(hub => {
        const color = TYPE_COLOR[hub.type] ?? '#64748b'
        const size  = IMPORTANCE_SIZE[hub.strategicImportance] ?? 5
        const [lng, lat] = hub.coordinates

        return (
          <Marker
            key={hub.id}
            longitude={lng}
            latitude={lat}
            anchor="center"
            onClick={e => e.originalEvent.stopPropagation()}
          >
            <div
              className="cursor-pointer"
              onMouseEnter={e => setTooltip({ hub, x: e.clientX, y: e.clientY })}
              onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
              onMouseLeave={() => setTooltip(null)}
            >
              <RailIcon color={color} size={size} isBRI={hub.isPartOfBRI} />
            </div>
          </Marker>
        )
      })}

      {/* Tooltip */}
      {tooltip && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div
            className="rounded-xl shadow-2xl overflow-hidden"
            style={{ background: '#0A0F1E', border: '1px solid #1E2D4A', minWidth: 220, maxWidth: 280 }}
          >
            {/* Header */}
            <div className="px-3.5 pt-3 pb-2 border-b" style={{ borderColor: '#1E2D4A' }}>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                  style={{
                    background: `${TYPE_COLOR[tooltip.hub.type] ?? '#64748b'}22`,
                    color: TYPE_COLOR[tooltip.hub.type] ?? '#64748b',
                    border: `1px solid ${TYPE_COLOR[tooltip.hub.type] ?? '#64748b'}44`,
                  }}
                >
                  {TYPE_LABEL[tooltip.hub.type] ?? tooltip.hub.type}
                </span>
                {tooltip.hub.isPartOfBRI && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: '#7f1d1d44', color: '#f87171', border: '1px solid #7f1d1d' }}>
                    BRI
                  </span>
                )}
              </div>
              <p className="text-[13px] font-bold text-white leading-snug">{tooltip.hub.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{tooltip.hub.city} · {tooltip.hub.countryId}</p>
            </div>

            {/* Stats */}
            <div className="px-3.5 py-2.5 flex flex-col gap-2">
              {(tooltip.hub.dailyPassengers != null) && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Daily passengers</span>
                  <span className="text-[12px] font-semibold text-slate-200 tabular-nums">
                    {formatPassengers(tooltip.hub.dailyPassengers)}
                  </span>
                </div>
              )}
              {(tooltip.hub.annualFreightTonnes != null) && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Annual freight</span>
                  <span className="text-[12px] font-semibold text-slate-200 tabular-nums">
                    {formatFreight(tooltip.hub.annualFreightTonnes)}
                  </span>
                </div>
              )}
              {tooltip.hub.lineCount != null && tooltip.hub.lineCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Lines</span>
                  <span className="text-[12px] font-semibold text-slate-200 tabular-nums">{tooltip.hub.lineCount}</span>
                </div>
              )}
              {tooltip.hub.gaugeType && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Gauge</span>
                  <span className="text-[11px] text-slate-300 capitalize">{tooltip.hub.gaugeType}</span>
                </div>
              )}
              {tooltip.hub.connectedCountries && tooltip.hub.connectedCountries.length > 0 && (
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[11px] text-slate-500 flex-shrink-0">Connected to</span>
                  <span className="text-[11px] text-slate-300 text-right">
                    {tooltip.hub.connectedCountries.join(', ')}
                  </span>
                </div>
              )}
              {tooltip.hub.geopoliticalNotes && (
                <p className="text-[11px] text-slate-500 leading-snug pt-2 border-t break-words"
                  style={{ borderColor: '#1E2D4A' }}>
                  {tooltip.hub.geopoliticalNotes}
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
