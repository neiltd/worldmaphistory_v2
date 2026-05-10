import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Line, Marker } from 'react-simple-maps'
import tradeData from '../../data/trade-routes.json'
import type { TradeRoute, Chokepoint } from '../../types/traderoute'

const routes      = tradeData.routes as TradeRoute[]
const chokepoints = tradeData.chokepoints as Chokepoint[]

const VOLUME_STROKE: Record<string, string> = {
  critical: '#06b6d4', very_high: '#0ea5e9',
  high: '#3b82f6', medium: '#6366f1', low: '#8b5cf6',
}
const VOLUME_WIDTH: Record<string, number> = {
  critical: 2.5, very_high: 2, high: 1.5, medium: 1, low: 0.7,
}
const RISK_COLOR: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#ef4444',
}

type TooltipData =
  | { kind: 'route'; route: TradeRoute; x: number; y: number }
  | { kind: 'chokepoint'; cp: Chokepoint; x: number; y: number }

interface Props { showRoutes: boolean; showChokepoints: boolean; zoom: number }

export default function TradeRouteLayer({ showRoutes, showChokepoints, zoom }: Props) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const cpSize = Math.max(3, 6 / Math.sqrt(zoom))

  // Midpoint between two coords for route label marker
  function midpoint(a: [number, number], b: [number, number]): [number, number] {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  }

  return (
    <>
      {showRoutes && routes.map(route => (
        <g key={route.id}>
          <Line
            from={route.from.coords}
            to={route.to.coords}
            stroke={VOLUME_STROKE[route.volume]}
            strokeWidth={VOLUME_WIDTH[route.volume]}
            strokeOpacity={tooltip?.kind === 'route' && tooltip.route.id === route.id ? 0.9 : 0.5}
            strokeLinecap="round"
            curve={0.3}
          />
          {/* Invisible wider hit area on the midpoint for hover */}
          <Marker
            coordinates={midpoint(route.from.coords, route.to.coords)}
            onMouseEnter={(e: React.MouseEvent) =>
              setTooltip({ kind: 'route', route, x: e.clientX, y: e.clientY })
            }
            onMouseMove={(e: React.MouseEvent) =>
              setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
            }
            onMouseLeave={() => setTooltip(null)}
          >
            <circle r={8 / zoom} fill="transparent" style={{ cursor: 'pointer' }} />
          </Marker>
        </g>
      ))}

      {showChokepoints && chokepoints.map(cp => (
        <Marker
          key={cp.id}
          coordinates={cp.coordinates}
          onMouseEnter={(e: React.MouseEvent) =>
            setTooltip({ kind: 'chokepoint', cp, x: e.clientX, y: e.clientY })
          }
          onMouseMove={(e: React.MouseEvent) =>
            setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
          }
          onMouseLeave={() => setTooltip(null)}
        >
          <rect
            x={-cpSize} y={-cpSize}
            width={cpSize * 2} height={cpSize * 2}
            fill={RISK_COLOR[cp.riskLevel]}
            fillOpacity={0.9}
            stroke="#070B14"
            strokeWidth={0.8}
            transform="rotate(45)"
            style={{ cursor: 'pointer' }}
          />
        </Marker>
      ))}

      {/* Tooltip rendered via portal — outside SVG so HTML div works correctly */}
      {tooltip && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <div
            className="rounded-lg p-3 shadow-2xl border text-xs max-w-56"
            style={{ background: '#0E1525', borderColor: '#1E2D4A' }}
          >
            {tooltip.kind === 'route' ? (
              <>
                <p className="font-semibold text-white mb-1.5">{tooltip.route.name}</p>
                <div className="space-y-1 text-slate-400">
                  <p>{tooltip.route.from.name} → {tooltip.route.to.name}</p>
                  <p>
                    <span className="text-slate-500">Cargo: </span>
                    {tooltip.route.keyGoods?.join(', ') ?? '—'}
                  </p>
                  <p>
                    <span className="text-slate-500">Value: </span>
                    <span className="text-slate-300">{tooltip.route.annualValue ?? '—'}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="text-slate-500">Risk: </span>
                    <span style={{ color: RISK_COLOR[tooltip.route.riskLevel] }}>
                      {tooltip.route.riskLevel}
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold text-white mb-1.5">{tooltip.cp.name}</p>
                <div className="space-y-1 text-slate-400">
                  <p>{tooltip.cp.dailyVessels} vessels/day</p>
                  <p>{tooltip.cp.percentGlobalTrade}% of global trade</p>
                  <p className="text-slate-500 leading-snug">{tooltip.cp.currentThreat}</p>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
