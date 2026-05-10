import type { LayerMeta } from './types'

/**
 * Central registry of all map layers.
 * Every layer must answer "Why does this matter?" in its description.
 * Add new layers here — the rest of the system reads from this registry.
 */
export const LAYER_REGISTRY: LayerMeta[] = [

  // ── Geopolitical ────────────────────────────────────────────────────────────
  {
    id: 'conflicts',
    label: 'Active Conflicts',
    description: 'Armed conflicts, civil wars, and territorial disputes that destabilize regions and redirect capital flows.',
    group: 'geopolitical',
    defaultEnabled: true,
    legend: [
      { color: '#ef4444', label: 'Critical', shape: 'circle' },
      { color: '#f97316', label: 'High',     shape: 'circle' },
      { color: '#eab308', label: 'Medium',   shape: 'circle' },
      { color: '#84cc16', label: 'Low',      shape: 'circle' },
    ],
  },
  {
    id: 'conflict-zones',
    label: 'Conflict Zones',
    description: 'Geographic footprint of active conflict areas — indicates territorial control and displacement risk.',
    group: 'geopolitical',
    defaultEnabled: true,
  },

  // ── Economic ─────────────────────────────────────────────────────────────────
  {
    id: 'trade-routes',
    label: 'Trade Routes',
    description: 'Major shipping lanes, pipelines, and rail corridors — disruptions directly impact global supply chains.',
    group: 'economic',
    defaultEnabled: false,
    legend: [
      { color: '#06b6d4', label: 'Critical volume',   shape: 'line' },
      { color: '#3b82f6', label: 'High volume',       shape: 'line' },
      { color: '#6366f1', label: 'Medium volume',     shape: 'line' },
      { color: '#8b5cf6', label: 'Low volume',        shape: 'line' },
    ],
  },
  {
    id: 'chokepoints',
    label: 'Strategic Chokepoints',
    description: 'Maritime passages where a small number of vessels control a disproportionate share of global trade.',
    group: 'economic',
    defaultEnabled: false,
    legend: [
      { color: '#22c55e', label: 'Low risk',    shape: 'diamond' },
      { color: '#f59e0b', label: 'Medium risk', shape: 'diamond' },
      { color: '#ef4444', label: 'High risk',   shape: 'diamond' },
    ],
  },

  // ── Infrastructure ───────────────────────────────────────────────────────────
  {
    id: 'airports',
    label: 'Major Airports',
    description: 'International airports by strategic and economic significance — power projection, logistics, and trade hubs.',
    group: 'infrastructure',
    defaultEnabled: false,
    placeholder: true,
  },
  {
    id: 'seaports',
    label: 'Seaports',
    description: 'Container and bulk cargo ports — chokepoints in global manufacturing and commodity supply chains.',
    group: 'infrastructure',
    defaultEnabled: false,
    placeholder: true,
  },
  {
    id: 'submarine-cables',
    label: 'Submarine Cables',
    description: 'Undersea internet cables carrying 95% of global internet traffic — critical and vulnerable digital infrastructure.',
    group: 'infrastructure',
    defaultEnabled: false,
    placeholder: true,
  },

  // ── Utilities ────────────────────────────────────────────────────────────────
  {
    id: 'power-plants',
    label: 'Power Infrastructure',
    description: 'Major energy generation facilities — energy security is a primary driver of geopolitical positioning.',
    group: 'utilities',
    defaultEnabled: false,
    placeholder: true,
  },
  {
    id: 'energy-mix',
    label: 'Energy Mix',
    description: 'Electricity generation by source — reveals fossil fuel dependency, renewables transition, and energy independence risk.',
    group: 'utilities',
    defaultEnabled: false,
    placeholder: true,
  },

  // ── Intelligence ─────────────────────────────────────────────────────────────
  {
    id: 'heatmap',
    label: 'Country Heatmap',
    description: 'Comparative country scoring across 7 geopolitical and economic indicators.',
    group: 'intelligence',
    defaultEnabled: false,
  },
  {
    id: 'intelligence-events',
    label: 'Intelligence Events',
    description: 'Clustered geopolitical events scored by economic impact, population impact, and opportunity.',
    group: 'intelligence',
    defaultEnabled: false,
    placeholder: true,
  },

  // ── Environment ──────────────────────────────────────────────────────────────
  {
    id: 'water-stress',
    label: 'Water Stress',
    description: 'Water scarcity risk — a growing driver of migration, food insecurity, and regional conflict.',
    group: 'environment',
    defaultEnabled: false,
    placeholder: true,
  },
  {
    id: 'food-security',
    label: 'Food Security',
    description: 'Food supply vulnerability — countries with high food insecurity face compounded geopolitical instability.',
    group: 'environment',
    defaultEnabled: false,
    placeholder: true,
  },

  // ── Investment ───────────────────────────────────────────────────────────────
  {
    id: 'investment-signals',
    label: 'Investment Signals',
    description: 'Country-level risk/opportunity signals by sector, backed by source-attributed intelligence.',
    group: 'investment',
    defaultEnabled: false,
    placeholder: true,
  },
]

/** Look up a layer by ID */
export function getLayer(id: string): LayerMeta | undefined {
  return LAYER_REGISTRY.find(l => l.id === id)
}

/** Get all layers for a group */
export function getLayersByGroup(group: LayerMeta['group']): LayerMeta[] {
  return LAYER_REGISTRY.filter(l => l.group === group)
}

/** All layer groups in display order */
export const LAYER_GROUPS: LayerMeta['group'][] = [
  'geopolitical',
  'economic',
  'infrastructure',
  'utilities',
  'intelligence',
  'environment',
  'investment',
]
