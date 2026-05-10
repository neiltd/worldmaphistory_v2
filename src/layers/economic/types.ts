export type TradeVolume = 'critical' | 'very_high' | 'high' | 'medium' | 'low'
export type RiskLevel   = 'low' | 'medium' | 'high'
export type RouteType   = 'shipping' | 'pipeline' | 'rail'

export interface TradeRouteEndpoint {
  name: string
  coords: [number, number]
}

export interface EconomicTradeRoute {
  id: string
  name: string
  from: TradeRouteEndpoint
  to: TradeRouteEndpoint
  volume: TradeVolume
  type: RouteType
  annualValue: string
  keyGoods: string[]
  riskLevel: RiskLevel
  notes: string
}

export interface StrategicChokepoint {
  id: string
  name: string
  coordinates: [number, number]
  importance: 'critical' | 'high' | 'medium'
  dailyVessels: number
  percentGlobalTrade: number
  controlledBy: string[]
  riskLevel: RiskLevel
  summary: string
  currentThreat: string
}
