import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Source, Layer, Marker } from 'react-map-gl/maplibre'
import cablesData from '../../data/validated/submarine-cables.json'
import type { LayerProps } from '../_core/types'
import { fixGeometry, isValidCoord } from '../../utils/geoUtils'

interface LandingPoint {
  name: string
  countryId: string
  coordinates: [number, number]
  city?: string | null
}

interface SubmarineCable {
  id: string
  name: string
  route: [number, number][]
  landingPoints: LandingPoint[]
  status: string
  lengthKm?: number | null
  capacityTbps?: number | null
  yearLaid?: number | null
  owners?: string[] | null
  vulnerabilities?: string | null
  geopoliticalNotes?: string | null
  notes?: string | null
}

const cables = cablesData as unknown as SubmarineCable[]

const STATUS_COLOR: Record<string, string> = {
  active:       '#06b6d4',   // cyan   — operational
  construction: '#f59e0b',   // amber  — being built
  planned:      '#64748b',   // slate  — planned
  damaged:      '#ef4444',   // red    — damaged
  unknown:      '#475569',   // muted
}

type TooltipData = { cable: SubmarineCable; point: LandingPoint; x: number; y: number }

export default function SubmarineCableLayer({ visible, labelLayerId }: LayerProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  // Build GeoJSON — one feature per cable, antimeridian-safe
  const cablesGeo = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: cables
      .filter(c => c.route && c.route.length >= 2)
      .map(c => ({
        type: 'Feature' as const,
        geometry: fixGeometry({ type: 'LineString', coordinates: c.route }),
        properties: {
          id:           c.id,
          name:         c.name,
          status:       c.status,
          capacityTbps: c.capacityTbps ?? null,
          lengthKm:     c.lengthKm ?? null,
          yearLaid:     c.yearLaid ?? null,
          owners:       c.owners?.join(', ') ?? null,
        },
      })),
  }), [])

  if (!visible) return null

  return (
    <>
      {/* Cable route lines */}
      <Source id="submarine-cables" type="geojson" data={cablesGeo}>
        {/* Glow effect — wider, dimmer line underneath */}
        <Layer
          id="submarine-cables-glow"
          type="line"
          beforeId={labelLayerId}
          paint={{
            'line-color': ['match', ['get', 'status'],
              'active',       '#06b6d4',
              'construction', '#f59e0b',
              'damaged',      '#ef4444',
              '#475569',
            ],
            'line-width': 6,
            'line-opacity': 0.08,
          }}
        />
        {/* Main cable line */}
        <Layer
          id="submarine-cables-line"
          type="line"
          beforeId={labelLayerId}
          paint={{
            'line-color': ['match', ['get', 'status'],
              'active',       '#06b6d4',
              'construction', '#f59e0b',
              'planned',      '#64748b',
              'damaged',      '#ef4444',
              '#475569',
            ],
            'line-width': 2,
            'line-opacity': 0.75,
            'line-dasharray': ['match', ['get', 'status'],
              'construction', ['literal', [4, 3]],
              'planned',      ['literal', [2, 4]],
              ['literal', [1]],
            ],
          }}
        />
      </Source>

      {/* Landing point markers */}
      {cables.map(cable =>
        cable.landingPoints
          .filter(lp => isValidCoord(lp.coordinates))
          .map((lp, i) => (
            <Marker
              key={`${cable.id}-lp-${i}`}
              longitude={lp.coordinates[0]}
              latitude={lp.coordinates[1]}
              anchor="center"
              onClick={e => e.originalEvent.stopPropagation()}
            >
              <div
                className="cursor-pointer rounded-full border flex-shrink-0"
                style={{
                  width: 7,
                  height: 7,
                  background: STATUS_COLOR[cable.status] ?? '#475569',
                  borderColor: '#0A0F1E',
                  borderWidth: 1,
                  boxShadow: `0 0 4px ${STATUS_COLOR[cable.status] ?? '#475569'}88`,
                }}
                onMouseEnter={e => setTooltip({ cable, point: lp, x: e.clientX, y: e.clientY })}
                onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                onMouseLeave={() => setTooltip(null)}
              />
            </Marker>
          ))
      )}

      {/* Tooltip */}
      {tooltip && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div
            className="rounded-xl shadow-2xl overflow-hidden"
            style={{ background: '#0A0F1E', border: '1px solid #1E2D4A', minWidth: 230, maxWidth: 300 }}
          >
            {/* Header */}
            <div className="px-3.5 pt-3 pb-2 border-b" style={{ borderColor: '#1E2D4A' }}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                  style={{
                    background: `${STATUS_COLOR[tooltip.cable.status] ?? '#475569'}22`,
                    color: STATUS_COLOR[tooltip.cable.status] ?? '#475569',
                    border: `1px solid ${STATUS_COLOR[tooltip.cable.status] ?? '#475569'}44`,
                  }}
                >
                  {tooltip.cable.status}
                </span>
                {tooltip.cable.capacityTbps && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {tooltip.cable.capacityTbps} Tbps
                  </span>
                )}
              </div>
              <p className="text-[13px] font-bold text-white leading-snug">{tooltip.cable.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Landing: <span className="text-slate-300">{tooltip.point.name}</span>
                {tooltip.point.city && tooltip.point.city !== tooltip.point.name && ` · ${tooltip.point.city}`}
                {' · '}{tooltip.point.countryId}
              </p>
            </div>

            {/* Stats */}
            <div className="px-3.5 py-2.5 flex flex-col gap-2">
              {tooltip.cable.lengthKm && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Length</span>
                  <span className="text-[12px] font-semibold text-slate-200 tabular-nums">
                    {tooltip.cable.lengthKm.toLocaleString()} km
                  </span>
                </div>
              )}
              {tooltip.cable.yearLaid && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Year laid</span>
                  <span className="text-[12px] font-semibold text-slate-200 tabular-nums">{tooltip.cable.yearLaid}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Landing points</span>
                <span className="text-[12px] font-semibold text-slate-200 tabular-nums">{tooltip.cable.landingPoints.length}</span>
              </div>
              {tooltip.cable.owners && tooltip.cable.owners.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-slate-500">Owners</span>
                  <span className="text-[11px] text-slate-300 leading-snug">
                    {tooltip.cable.owners.slice(0, 3).join(', ')}
                    {tooltip.cable.owners.length > 3 && ` +${tooltip.cable.owners.length - 3} more`}
                  </span>
                </div>
              )}
              {tooltip.cable.geopoliticalNotes && (
                <p className="text-[11px] text-slate-500 leading-snug pt-2 border-t break-words"
                  style={{ borderColor: '#1E2D4A' }}>
                  {tooltip.cable.geopoliticalNotes}
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
