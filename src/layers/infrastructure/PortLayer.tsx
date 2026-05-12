import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Marker } from 'react-map-gl/maplibre'
import portsData from '../../data/validated/seaports.json'
import type { LayerProps } from '../_core/types'

interface Seaport {
  id: string
  name: string
  countryId: string
  city: string
  coordinates: [number, number]
  type: string
  annualThroughputTEU?: number | null
  annualThroughputTonnes?: number | null
  berthCount?: number | null
  maxDraftM?: number | null
  strategicImportance: 'critical' | 'high' | 'medium' | 'low'
  riskLevel?: string | null
  geopoliticalNotes?: string | null
  notes?: string | null
}

const ports = portsData as unknown as Seaport[]

// ── Color by port type ────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  container:    '#06b6d4',   // cyan  — global trade
  oil:          '#f59e0b',   // amber — energy
  lng:          '#f97316',   // orange — LNG
  bulk:         '#8b5cf6',   // violet — commodities
  multipurpose: '#3b82f6',   // blue
  naval:        '#ef4444',   // red — military
  mixed:        '#22c55e',   // green — general
}

// ── Size by importance ────────────────────────────────────────────────────────
const IMPORTANCE_SIZE: Record<string, number> = {
  critical: 9,
  high:     7,
  medium:   5,
  low:      4,
}

const RISK_COLOR: Record<string, string> = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#ef4444',
  extreme:  '#dc2626',
  critical: '#dc2626',
}

function formatThroughput(teu?: number | null, tonnes?: number | null): string {
  if (teu != null) {
    if (teu >= 1e6) return `${(teu / 1e6).toFixed(1)}M TEU`
    if (teu >= 1e3) return `${(teu / 1e3).toFixed(0)}K TEU`
    return `${teu} TEU`
  }
  if (tonnes != null) {
    if (tonnes >= 1e9) return `${(tonnes / 1e9).toFixed(1)}Bt`
    if (tonnes >= 1e6) return `${(tonnes / 1e6).toFixed(1)}Mt`
    return `${tonnes}t`
  }
  return '—'
}

// ── Anchor/port icon ─────────────────────────────────────────────────────────
function AnchorIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg
      width={size * 2.4}
      height={size * 2.4}
      viewBox="0 0 24 24"
      fill={color}
      style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
    >
      <path d="M12 2C10.34 2 9 3.34 9 5s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm1 8.93V11h4v2h-4v6.93c2.83-.48 5-2.97 5-5.93h2c0 4.42-3.58 8-8 8s-8-3.58-8-8h2c0 2.96 2.17 5.45 5 5.93V13H7v-2h4v-.07C8.86 10.7 7 8.52 7 6h2c0 1.65 1.35 3 3 3s3-1.35 3-3h2c0 2.52-1.86 4.7-4 4.93z"/>
    </svg>
  )
}

export default function PortLayer({ visible }: LayerProps) {
  const [tooltip, setTooltip] = useState<{
    port: Seaport; x: number; y: number
  } | null>(null)

  if (!visible) return null

  return (
    <>
      {ports.map(port => {
        const color = TYPE_COLOR[port.type] ?? '#3b82f6'
        const size  = IMPORTANCE_SIZE[port.strategicImportance] ?? 5
        const [lng, lat] = port.coordinates

        return (
          <Marker
            key={port.id}
            longitude={lng}
            latitude={lat}
            anchor="center"
            onClick={e => e.originalEvent.stopPropagation()}
          >
            <div
              className="relative cursor-pointer flex items-center justify-center"
              style={{ width: size * 2.4, height: size * 2.4 }}
              onMouseEnter={e => setTooltip({ port, x: e.clientX, y: e.clientY })}
              onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
              onMouseLeave={() => setTooltip(null)}
            >
              <AnchorIcon color={color} size={size} />
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
                    background: `${TYPE_COLOR[tooltip.port.type] ?? '#3b82f6'}22`,
                    color: TYPE_COLOR[tooltip.port.type] ?? '#3b82f6',
                    border: `1px solid ${TYPE_COLOR[tooltip.port.type] ?? '#3b82f6'}44`,
                  }}
                >
                  {tooltip.port.type}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                  style={{
                    background: '#1E2D4A',
                    color: '#64748b',
                  }}
                >
                  {tooltip.port.strategicImportance}
                </span>
                {tooltip.port.riskLevel && tooltip.port.riskLevel !== 'low' && (
                  <span className="text-[10px] font-medium"
                    style={{ color: RISK_COLOR[tooltip.port.riskLevel] ?? '#64748b' }}>
                    ● {tooltip.port.riskLevel} risk
                  </span>
                )}
              </div>
              <p className="text-[13px] font-bold text-white leading-snug">{tooltip.port.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{tooltip.port.city} · {tooltip.port.countryId}</p>
            </div>

            {/* Stats */}
            <div className="px-3.5 py-2.5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Annual throughput</span>
                <span className="text-[12px] font-semibold text-slate-200 tabular-nums">
                  {formatThroughput(tooltip.port.annualThroughputTEU, tooltip.port.annualThroughputTonnes)}
                </span>
              </div>
              {tooltip.port.berthCount != null && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Berths</span>
                  <span className="text-[12px] font-semibold text-slate-200 tabular-nums">{tooltip.port.berthCount}</span>
                </div>
              )}
              {tooltip.port.maxDraftM != null && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Max draft</span>
                  <span className="text-[12px] font-semibold text-slate-200 tabular-nums">{tooltip.port.maxDraftM}m</span>
                </div>
              )}
              {tooltip.port.geopoliticalNotes && (
                <p className="text-[11px] text-slate-500 leading-snug pt-2 border-t break-words"
                  style={{ borderColor: '#1E2D4A' }}>
                  {tooltip.port.geopoliticalNotes}
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
