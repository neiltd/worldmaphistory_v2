import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Marker } from 'react-map-gl/maplibre'
import plantsData from '../../data/validated/power-plants.json'
import type { LayerProps } from '../_core/types'

interface PowerPlant {
  id: string
  name: string
  countryId: string
  city?: string | null
  coordinates: [number, number]
  type: string
  status: string
  capacityMW?: number | null
  annualOutputGWh?: number | null
  yearCommissioned?: number | null
  yearRetirement?: number | null
  operator?: string | null
  owner?: string | null
  strategicNote?: string | null
  notes?: string | null
}

const plants = plantsData as unknown as PowerPlant[]

// ── Color by fuel type ────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  nuclear:     '#a78bfa',  // violet  — strategic
  coal:        '#78716c',  // stone   — fossil
  gas:         '#f59e0b',  // amber   — fossil
  oil:         '#92400e',  // brown   — fossil
  hydro:       '#0ea5e9',  // sky     — renewable
  solar:       '#fbbf24',  // yellow  — renewable
  wind:        '#34d399',  // emerald — renewable
  geothermal:  '#f97316',  // orange  — renewable
  biomass:     '#84cc16',  // lime    — renewable
  other:       '#64748b',  // slate
}

// ── Size by capacity ──────────────────────────────────────────────────────────
function getSize(capacityMW?: number | null): number {
  if (!capacityMW) return 4
  if (capacityMW >= 5000) return 9
  if (capacityMW >= 2000) return 7
  if (capacityMW >= 1000) return 6
  if (capacityMW >= 500)  return 5
  return 4
}

// ── Status opacity ────────────────────────────────────────────────────────────
const STATUS_OPACITY: Record<string, number> = {
  operating:     1.0,
  construction:  0.7,
  planned:       0.5,
  mothballed:    0.35,
  decommissioned:0.2,
}

function formatCapacity(mw?: number | null): string {
  if (mw == null) return '—'
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`
  return `${mw} MW`
}

// ── Lightning bolt icon ───────────────────────────────────────────────────────
function BoltIcon({ color, size, opacity }: { color: string; size: number; opacity: number }) {
  return (
    <svg
      width={size * 2}
      height={size * 2}
      viewBox="0 0 24 24"
      fill={color}
      opacity={opacity}
      style={{ filter: opacity > 0.5 ? `drop-shadow(0 0 3px ${color}66)` : 'none' }}
    >
      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
    </svg>
  )
}

export default function PowerLayer({ visible }: LayerProps) {
  const [tooltip, setTooltip] = useState<{
    plant: PowerPlant; x: number; y: number
  } | null>(null)

  if (!visible) return null

  // Only show operating and construction — skip decommissioned/planned
  const visiblePlants = plants.filter(p =>
    p.status === 'operating' || p.status === 'construction' || p.status === 'mothballed'
  )

  return (
    <>
      {visiblePlants.map(plant => {
        const color   = TYPE_COLOR[plant.type] ?? '#64748b'
        const size    = getSize(plant.capacityMW)
        const opacity = STATUS_OPACITY[plant.status] ?? 0.5
        const [lng, lat] = plant.coordinates

        return (
          <Marker
            key={plant.id}
            longitude={lng}
            latitude={lat}
            anchor="center"
            onClick={e => e.originalEvent.stopPropagation()}
          >
            <div
              className="cursor-pointer flex items-center justify-center"
              style={{ width: size * 2, height: size * 2 }}
              onMouseEnter={e => setTooltip({ plant, x: e.clientX, y: e.clientY })}
              onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
              onMouseLeave={() => setTooltip(null)}
            >
              <BoltIcon color={color} size={size} opacity={opacity} />
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
                    background: `${TYPE_COLOR[tooltip.plant.type] ?? '#64748b'}22`,
                    color: TYPE_COLOR[tooltip.plant.type] ?? '#64748b',
                    border: `1px solid ${TYPE_COLOR[tooltip.plant.type] ?? '#64748b'}44`,
                  }}
                >
                  {tooltip.plant.type}
                </span>
                {tooltip.plant.status !== 'operating' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1E2D4A] text-slate-500 font-medium uppercase tracking-wide">
                    {tooltip.plant.status}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-bold text-white leading-snug">{tooltip.plant.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {[tooltip.plant.city, tooltip.plant.countryId].filter(Boolean).join(' · ')}
              </p>
            </div>

            {/* Stats */}
            <div className="px-3.5 py-2.5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Capacity</span>
                <span className="text-[12px] font-semibold text-slate-200 tabular-nums">
                  {formatCapacity(tooltip.plant.capacityMW)}
                </span>
              </div>
              {tooltip.plant.yearCommissioned && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Commissioned</span>
                  <span className="text-[12px] font-semibold text-slate-200 tabular-nums">{tooltip.plant.yearCommissioned}</span>
                </div>
              )}
              {tooltip.plant.operator && (
                <div className="flex justify-between items-center gap-3">
                  <span className="text-[11px] text-slate-500 flex-shrink-0">Operator</span>
                  <span className="text-[11px] text-slate-300 text-right truncate">{tooltip.plant.operator}</span>
                </div>
              )}
              {tooltip.plant.strategicNote && (
                <p className="text-[11px] text-slate-500 leading-snug pt-2 border-t break-words"
                  style={{ borderColor: '#1E2D4A' }}>
                  {tooltip.plant.strategicNote}
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
