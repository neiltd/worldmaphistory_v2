import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Marker } from 'react-map-gl/maplibre'
import airportsData from '../../data/validated/airports.json'
import type { LayerProps } from '../_core/types'

interface Airport {
  id: string
  name: string
  countryId: string
  city: string
  iata?: string | null
  icao?: string | null
  coordinates: [number, number]
  passengerVolume?: number | null
  cargoVolume?: number | null
  strategicImportance: 'critical' | 'high' | 'medium' | 'low'
  geopoliticalNotes?: string | null
  notes?: string | null
}

const airports = airportsData as unknown as Airport[]

// ── Visual config by strategic importance ─────────────────────────────────────
const STYLE: Record<string, { color: string; size: number; ring: number }> = {
  critical: { color: '#f97316', size: 8,  ring: 14 },
  high:     { color: '#3b82f6', size: 6,  ring: 11 },
  medium:   { color: '#64748b', size: 5,  ring: 9  },
  low:      { color: '#334155', size: 4,  ring: 7  },
}

function formatVolume(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return String(n)
}

// ── Plane icon SVG ────────────────────────────────────────────────────────────
function PlaneIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg
      width={size * 2.2}
      height={size * 2.2}
      viewBox="0 0 24 24"
      fill={color}
      style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
    >
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  )
}

export default function AirportLayer({ visible }: LayerProps) {
  const [tooltip, setTooltip] = useState<{
    airport: Airport; x: number; y: number
  } | null>(null)

  if (!visible) return null

  return (
    <>
      {airports.map(ap => {
        const style = STYLE[ap.strategicImportance] ?? STYLE.medium
        const [lng, lat] = ap.coordinates

        return (
          <Marker
            key={ap.id}
            longitude={lng}
            latitude={lat}
            anchor="center"
            onClick={e => e.originalEvent.stopPropagation()}
          >
            <div
              className="relative cursor-pointer flex items-center justify-center"
              style={{ width: style.ring, height: style.ring }}
              onMouseEnter={e => setTooltip({ airport: ap, x: e.clientX, y: e.clientY })}
              onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Outer ring for critical/high airports */}
              {(ap.strategicImportance === 'critical' || ap.strategicImportance === 'high') && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `1px solid ${style.color}55` }}
                />
              )}
              <PlaneIcon color={style.color} size={style.size} />
            </div>
          </Marker>
        )
      })}

      {/* Tooltip — portal so it renders outside the SVG/map canvas */}
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
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                  style={{
                    background: `${STYLE[tooltip.airport.strategicImportance]?.color}22`,
                    color: STYLE[tooltip.airport.strategicImportance]?.color,
                    border: `1px solid ${STYLE[tooltip.airport.strategicImportance]?.color}44`,
                  }}
                >
                  {tooltip.airport.strategicImportance}
                </span>
                {tooltip.airport.iata && (
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {tooltip.airport.iata}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-bold text-white leading-snug">{tooltip.airport.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{tooltip.airport.city} · {tooltip.airport.countryId}</p>
            </div>

            {/* Stats */}
            <div className="px-3.5 py-2.5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Passengers/yr</span>
                <span className="text-[12px] font-semibold text-slate-200 tabular-nums">
                  {formatVolume(tooltip.airport.passengerVolume)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Cargo/yr (t)</span>
                <span className="text-[12px] font-semibold text-slate-200 tabular-nums">
                  {formatVolume(tooltip.airport.cargoVolume)}
                </span>
              </div>

              {/* Geopolitical note */}
              {tooltip.airport.geopoliticalNotes && (
                <p className="text-[11px] text-slate-500 leading-snug pt-2 border-t break-words"
                  style={{ borderColor: '#1E2D4A' }}>
                  {tooltip.airport.geopoliticalNotes}
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
