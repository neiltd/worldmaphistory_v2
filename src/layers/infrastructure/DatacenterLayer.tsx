import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Marker } from 'react-map-gl/maplibre'
import dcData from '../../data/validated/datacenters.json'
import type { LayerProps } from '../_core/types'

interface Datacenter {
  id: string
  name: string
  countryId: string
  city: string
  coordinates: [number, number]
  type: string
  status: string
  tierLevel?: string | null
  capacityMW?: number | null
  floorSpaceM2?: number | null
  pue?: number | null
  operator?: string | null
  owner?: string | null
  yearOpened?: number | null
  cloudRegion?: string | null
  geopoliticalNotes?: string | null
  notes?: string | null
}

const datacenters = dcData as unknown as Datacenter[]

// ── Color by operator type ────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  hyperscale:  '#a78bfa',  // violet  — Big Tech (AWS, Google, Azure, Meta)
  colocation:  '#22d3ee',  // cyan    — Equinix, Digital Realty, NTT
  enterprise:  '#64748b',  // slate   — private corporate
  government:  '#ef4444',  // red     — state-owned, sensitive
  edge:        '#34d399',  // emerald — edge nodes
}

const TYPE_LABEL: Record<string, string> = {
  hyperscale: 'Hyperscale',
  colocation: 'Colocation',
  enterprise: 'Enterprise',
  government: 'Government',
  edge:       'Edge',
}

const STATUS_OPACITY: Record<string, number> = {
  operational: 1.0,
  construction: 0.6,
  planned:      0.35,
  decommissioned: 0.15,
}

// ── Operator → short brand name ───────────────────────────────────────────────
function brandLabel(operator?: string | null): string {
  if (!operator) return ''
  if (/amazon|aws/i.test(operator)) return 'AWS'
  if (/google/i.test(operator)) return 'GCP'
  if (/microsoft|azure/i.test(operator)) return 'Azure'
  if (/meta/i.test(operator)) return 'Meta'
  if (/alibaba/i.test(operator)) return 'Alibaba'
  if (/equinix/i.test(operator)) return 'Equinix'
  if (/digital realty/i.test(operator)) return 'DigitalRealty'
  if (/ntt/i.test(operator)) return 'NTT'
  if (/huawei/i.test(operator)) return 'Huawei'
  return operator.split(' ')[0]   // first word of operator name
}

// ── Server stack icon ─────────────────────────────────────────────────────────
function ServerIcon({ color, size, opacity }: { color: string; size: number; opacity: number }) {
  return (
    <svg
      width={size * 2.2}
      height={size * 2.2}
      viewBox="0 0 24 24"
      fill={color}
      opacity={opacity}
      style={{ filter: opacity > 0.5 ? `drop-shadow(0 0 3px ${color}66)` : 'none' }}
    >
      <path d="M20 3H4v10h16V3zm-2 8H6V5h12v6zM4 17h16v4H4zm2 1h2v2H6zm12-1H4v2h16v-2zM6 4h2v4H6zm0 14h2v2H6z"/>
    </svg>
  )
}

export default function DatacenterLayer({ visible }: LayerProps) {
  const [tooltip, setTooltip] = useState<{
    dc: Datacenter; x: number; y: number
  } | null>(null)

  if (!visible) return null

  const visibleDCs = datacenters.filter(d => d.status !== 'decommissioned')

  return (
    <>
      {visibleDCs.map(dc => {
        const color   = TYPE_COLOR[dc.type] ?? '#64748b'
        const size    = dc.type === 'hyperscale' ? 7 : dc.type === 'government' ? 7 : 5
        const opacity = STATUS_OPACITY[dc.status] ?? 0.5
        const [lng, lat] = dc.coordinates

        return (
          <Marker
            key={dc.id}
            longitude={lng}
            latitude={lat}
            anchor="center"
            onClick={e => e.originalEvent.stopPropagation()}
          >
            <div
              className="cursor-pointer flex items-center justify-center"
              style={{ width: size * 2.2, height: size * 2.2 }}
              onMouseEnter={e => setTooltip({ dc, x: e.clientX, y: e.clientY })}
              onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
              onMouseLeave={() => setTooltip(null)}
            >
              <ServerIcon color={color} size={size} opacity={opacity} />
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
            style={{ background: '#0A0F1E', border: '1px solid #1E2D4A', minWidth: 230, maxWidth: 290 }}
          >
            {/* Header */}
            <div className="px-3.5 pt-3 pb-2 border-b" style={{ borderColor: '#1E2D4A' }}>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                  style={{
                    background: `${TYPE_COLOR[tooltip.dc.type] ?? '#64748b'}22`,
                    color: TYPE_COLOR[tooltip.dc.type] ?? '#64748b',
                    border: `1px solid ${TYPE_COLOR[tooltip.dc.type] ?? '#64748b'}44`,
                  }}
                >
                  {TYPE_LABEL[tooltip.dc.type] ?? tooltip.dc.type}
                </span>
                {tooltip.dc.status !== 'operational' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E2D4A] text-slate-500 font-medium uppercase tracking-wide">
                    {tooltip.dc.status}
                  </span>
                )}
                {tooltip.dc.tierLevel && (
                  <span className="text-[10px] text-slate-600 font-mono">Tier {tooltip.dc.tierLevel}</span>
                )}
              </div>
              <p className="text-[13px] font-bold text-white leading-snug">{tooltip.dc.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{tooltip.dc.city} · {tooltip.dc.countryId}</p>
            </div>

            {/* Stats */}
            <div className="px-3.5 py-2.5 flex flex-col gap-2">
              {tooltip.dc.operator && (
                <div className="flex justify-between items-center gap-3">
                  <span className="text-[11px] text-slate-500 flex-shrink-0">Operator</span>
                  <span className="text-[11px] text-slate-300 text-right font-medium truncate">
                    {brandLabel(tooltip.dc.operator)}
                  </span>
                </div>
              )}
              {tooltip.dc.cloudRegion && (
                <div className="flex justify-between items-center gap-3">
                  <span className="text-[11px] text-slate-500 flex-shrink-0">Cloud region</span>
                  <span className="text-[11px] font-mono text-slate-300">{tooltip.dc.cloudRegion}</span>
                </div>
              )}
              {tooltip.dc.capacityMW && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Capacity</span>
                  <span className="text-[12px] font-semibold text-slate-200 tabular-nums">{tooltip.dc.capacityMW} MW</span>
                </div>
              )}
              {tooltip.dc.yearOpened && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Opened</span>
                  <span className="text-[12px] font-semibold text-slate-200 tabular-nums">{tooltip.dc.yearOpened}</span>
                </div>
              )}
              {tooltip.dc.pue && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">PUE</span>
                  <span className="text-[12px] font-semibold text-slate-200 tabular-nums">{tooltip.dc.pue}</span>
                </div>
              )}
              {tooltip.dc.geopoliticalNotes && (
                <p className="text-[11px] text-slate-500 leading-snug pt-2 border-t break-words"
                  style={{ borderColor: '#1E2D4A' }}>
                  {tooltip.dc.geopoliticalNotes}
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
