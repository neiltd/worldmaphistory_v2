export type LayerGroup =
  | 'geopolitical'
  | 'economic'
  | 'infrastructure'
  | 'utilities'
  | 'intelligence'
  | 'environment'
  | 'investment'

export interface LegendEntry {
  color: string
  label: string
  shape?: 'square' | 'circle' | 'diamond' | 'line'
}

export interface LayerMeta {
  id: string
  label: string
  /** One sentence answering: "Why does this matter for geopolitical analysis?" */
  description: string
  group: LayerGroup
  defaultEnabled: boolean
  legend?: LegendEntry[]
  /** Set to true for layers with no data yet */
  placeholder?: boolean
}

export interface LayerProps {
  visible: boolean
  labelLayerId?: string
}
