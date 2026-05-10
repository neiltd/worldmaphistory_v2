import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Source, Layer, Marker } from 'react-map-gl/maplibre'
import tradeData from '../../data/trade-routes.json'
import type { TradeRoute, Chokepoint } from '../../types/traderoute'

const routes     = tradeData.routes as TradeRoute[]
const chokepoints = tradeData.chokepoints as Chokepoint[]

const RISK_COLOR: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#ef4444',
}

interface Props {
  showRoutes: boolean
  showChokepoints: boolean
  labelLayerId?: string
}

export default function TradeRouteLayer({ showRoutes, showChokepoints, labelLayerId }: Props) {
  const [cpTooltip, setCpTooltip] = useState<{ cp: Chokepoint; x: number; y: number } | null>(null)

  // Build GeoJSON FeatureCollection for route lines — computed once
  const routesGeo = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: routes.map(r => ({
      type: 'Feature' as const,
      geometry: { type: 'LineString' as const, coordinates: [r.from.coords, r.to.coords] },
      properties: {
        id: r.id,
        name: r.name,
        volume: r.volume,
        riskLevel: r.riskLevel,
        keyGoods: r.keyGoods.join(', '),
        annualValue: r.annualValue,
        fromName: r.from.name,
        toName: r.to.name,
      },
    })),
  }), [])

  return (
    <>
      {showRoutes && (
        <Source id="trade-routes" type="geojson" data={routesGeo}>
          <Layer
            id="trade-routes-line"
            type="line"
            beforeId={labelLayerId}
            paint={{
              'line-color': ['match', ['get', 'volume'],
                'critical',  '#06b6d4',
                'very_high', '#0ea5e9',
                'high',      '#3b82f6',
                'medium',    '#6366f1',
                '#8b5cf6',
              ],
              'line-width': ['match', ['get', 'volume'],
                'critical',  3,
                'very_high', 2.5,
                'high',      2,
                'medium',    1.5,
                1,
              ],
              'line-opacity': 0.6,
            }}
          />
        </Source>
      )}

      {/* Chokepoint diamond markers — HTML so they stay fixed size */}
      {showChokepoints && chokepoints.map(cp => (
        <Marker
          key={cp.id}
          longitude={cp.coordinates[0]}
          latitude={cp.coordinates[1]}
          anchor="center"
          onClick={e => e.originalEvent.stopPropagation()}
        >
          <div
            style={{
              width: 10, height: 10,
              background: RISK_COLOR[cp.riskLevel],
              transform: 'rotate(45deg)',
              border: '1px solid #070B14',
              cursor: 'pointer',
            }}
            onMouseEnter={e => setCpTooltip({ cp, x: e.clientX, y: e.clientY })}
            onMouseMove={e => setCpTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
            onMouseLeave={() => setCpTooltip(null)}
          />
        </Marker>
      ))}

      {/* Chokepoint tooltip rendered via portal */}
      {cpTooltip && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: cpTooltip.x + 14, top: cpTooltip.y - 10 }}
        >
          <div className="rounded-lg p-3 shadow-2xl border text-xs max-w-56"
            style={{ background: '#0E1525', borderColor: '#1E2D4A' }}>
            <p className="font-semibold text-white mb-1.5">{cpTooltip.cp.name}</p>
            <div className="space-y-1 text-slate-400">
              <p>{cpTooltip.cp.dailyVessels} vessels/day</p>
              <p>{cpTooltip.cp.percentGlobalTrade}% of global trade</p>
              <p className="text-slate-500 leading-snug">{cpTooltip.cp.currentThreat}</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
