import { create } from 'zustand'
import type { Country } from '../types/country'
import type { Conflict } from '../types/conflict'

export type IndicatorKey =
  | 'none'
  // ── Geopolitical (1–10 scale, higher = better) ──
  | 'politicalStability'
  | 'economicDirection'
  | 'investmentAttractiveness'
  | 'geopoliticalRisk'
  | 'educationQuality'
  | 'healthcareQuality'
  | 'technologyInvestment'
  // ── Energy (0–100%, normalised to 0–10) ──
  | 'renewableShare'      // higher = cleaner grid ↑
  | 'fossilFuelShare'     // higher = more fossil ↓ (inverted)
  | 'nuclearShare'        // higher = more nuclear
  // ── Food & Resources (normalised to 0–10) ──
  | 'foodSecurityScore'   // GFSI 0–100, higher = more secure ↑
  | 'waterStressScore'    // Aqueduct 0–5, higher = more stress ↓ (inverted)

export const INDICATOR_LABELS: Record<IndicatorKey, string> = {
  none:                     'No heatmap',
  politicalStability:       'Political Stability',
  economicDirection:        'Economic Direction',
  investmentAttractiveness: 'Investment Attractiveness',
  geopoliticalRisk:         'Geopolitical Risk',
  educationQuality:         'Education Quality',
  healthcareQuality:        'Healthcare Quality',
  technologyInvestment:     'Technology Investment',
  renewableShare:           'Renewable Energy %',
  fossilFuelShare:          'Fossil Fuel % ↓',
  nuclearShare:             'Nuclear Energy %',
  foodSecurityScore:        'Food Security (GFSI)',
  waterStressScore:         'Water Stress ↓',
}

// Groups for the heatmap selector UI
export const INDICATOR_GROUPS: { label: string; keys: IndicatorKey[] }[] = [
  { label: 'Geopolitical', keys: ['politicalStability','economicDirection','investmentAttractiveness','geopoliticalRisk','educationQuality','healthcareQuality','technologyInvestment'] },
  { label: 'Energy',       keys: ['renewableShare','fossilFuelShare','nuclearShare'] },
  { label: 'Food & Water', keys: ['foodSecurityScore','waterStressScore'] },
]

// Indicators where HIGH score = BAD (color scale is inverted — red on top)
export const INVERTED_INDICATORS = new Set<IndicatorKey>(['fossilFuelShare', 'waterStressScore'])

interface MapStore {
  // Country selection
  selectedCountryId: string | null
  countryData: Country | null
  loading: boolean
  error: string | null
  selectCountry: (id: string) => Promise<void>
  clearSelection: () => void

  // Comparison (second country)
  compareCountryId: string | null
  compareData: Country | null
  compareLoading: boolean
  setCompare: (id: string) => Promise<void>
  clearCompare: () => void

  // Layer toggles
  showConflicts: boolean
  showTradeRoutes: boolean
  showChokepoints: boolean
  toggleConflicts: () => void
  toggleTradeRoutes: () => void
  toggleChokepoints: () => void

  // Heatmap
  heatmapIndicator: IndicatorKey
  setHeatmapIndicator: (key: IndicatorKey) => void

  // Conflict popup
  selectedConflict: Conflict | null
  selectConflict: (conflict: Conflict) => void
  clearConflict: () => void

  // Map zoom (for scaling markers)
  mapZoom: number
  setMapZoom: (zoom: number) => void

  // Extensible layer visibility for future layers (keyed by layer registry ID)
  layerVisibility: Record<string, boolean>
  setLayerVisible: (id: string, visible: boolean) => void
  toggleLayerById: (id: string) => void
  isLayerVisible: (id: string) => boolean
}

export const useMapStore = create<MapStore>((set) => ({
  selectedCountryId: null,
  countryData: null,
  loading: false,
  error: null,

  selectCountry: async (id: string) => {
    set({ selectedCountryId: id, loading: true, error: null, countryData: null, selectedConflict: null })
    try {
      const module = await import(`../data/countries/${id}.json`)
      set({ countryData: module.default as Country, loading: false })
    } catch {
      set({ error: 'No detailed data available for this country yet.', loading: false })
    }
  },

  clearSelection: () => set({ selectedCountryId: null, countryData: null, error: null }),

  compareCountryId: null,
  compareData: null,
  compareLoading: false,

  setCompare: async (id: string) => {
    set({ compareCountryId: id, compareLoading: true, compareData: null })
    try {
      const module = await import(`../data/countries/${id}.json`)
      set({ compareData: module.default as Country, compareLoading: false })
    } catch {
      set({ compareLoading: false })
    }
  },

  clearCompare: () => set({ compareCountryId: null, compareData: null }),

  showConflicts: true,
  showTradeRoutes: false,
  showChokepoints: false,
  toggleConflicts:   () => set((s) => ({ showConflicts: !s.showConflicts })),
  toggleTradeRoutes: () => set((s) => ({ showTradeRoutes: !s.showTradeRoutes })),
  toggleChokepoints: () => set((s) => ({ showChokepoints: !s.showChokepoints })),

  heatmapIndicator: 'none',
  setHeatmapIndicator: (key) => set({ heatmapIndicator: key }),

  selectedConflict: null,
  selectConflict: (conflict) => set({ selectedConflict: conflict, selectedCountryId: null, countryData: null }),
  clearConflict: () => set({ selectedConflict: null }),

  mapZoom: 1,
  setMapZoom: (zoom) => set({ mapZoom: zoom }),

  layerVisibility: {},
  setLayerVisible: (id, visible) =>
    set(s => ({ layerVisibility: { ...s.layerVisibility, [id]: visible } })),
  toggleLayerById: (id) =>
    set(s => ({ layerVisibility: { ...s.layerVisibility, [id]: !s.layerVisibility[id] } })),
  isLayerVisible: (id: string): boolean => {
    const s = useMapStore.getState()
    if (id === 'conflicts' || id === 'conflict-zones') return s.showConflicts
    if (id === 'trade-routes') return s.showTradeRoutes
    if (id === 'chokepoints')  return s.showChokepoints
    return s.layerVisibility[id] ?? false
  },
}))
