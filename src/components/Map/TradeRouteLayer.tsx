import { useState } from 'react'
import { Line, Marker } from 'react-simple-maps'
import tradeData from '../../data/trade-routes.json'
import type { TradeRoute, Chokepoint } from '../../types/traderoute'

const routes     = tradeData.routes as TradeRoute[]
const chokepoints = tradeData.chokepoints as Chokepoint[]

const VOLUME_STROKE: Record<string, string> = {
  critical:  '#06b6d4', very_high: '#0ea5e9',
  high:      '#3b82f6', medium:    '#6366f1', low: '#8b5cf6',
}
const VOLUME_WIDTH: Record<string, number> = {
  critical: 2.5, very_high: 2, high: 1.5, medium: 1, low: 0.7,
}
const RISK_COLOR: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#ef4444',
}

interface Props { showRoutes: boolean; showChokepoints: boolean; zoom: number }

export default function TradeRouteLayer({ showRoutes, showChokepoints, zoom }: Props) {
  const [cpTooltip, setCpTooltip] = useState<{ cp: Chokepoint; x: number; y: number } | null>(null)

  const cpSize = Math.max(3, 6 / Math.sqrt(zoom))

  return (
    <>
      {showRoutes && routes.map(route => (
        <Line
          key={route.id}
          from={route.from.coords}
          to={route.to.coords}
          stroke={VOLUME_STROKE[route.volume]}
          strokeWidth={VOLUME_WIDTH[route.volume]}
          strokeOpacity={0.55}
          strokeLinecap="round"
          curve={0.3}
        />
      ))}

      {showChokepoints && chokepoints.map(cp => (
        <Marker
          key={cp.id}
          coordinates={cp.coordinates}
          onClick={() => setCpTooltip(cpTooltip?.cp.id === cp.id ? null : { cp, x: 0, y: 0 })}
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

      {/* Chokepoint tooltip */}
      {cpTooltip && (
        <div
          className="fixed z-50 bg-[#0E1525] border border-[#1E2D4A] rounded-lg p-3 shadow-2xl pointer-events-none max-w-xs"
          style={{ left: cpTooltip.x + 14, top: cpTooltip.y - 10 }}
        >
          <p className="text-xs font-semibold text-white mb-1">{cpTooltip.cp.name}</p>
          <p className="text-xs text-slate-400 mb-1">{cpTooltip.cp.dailyVessels} vessels/day · {cpTooltip.cp.percentGlobalTrade}% global trade</p>
          <p className="text-xs text-slate-500 leading-snug">{cpTooltip.cp.currentThreat}</p>
        </div>
      )}
    </>
  )
}
