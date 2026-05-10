import { create } from 'zustand'
import type { Country } from '../types/country'
import type { Conflict } from '../types/conflict'

interface MapStore {
  // Country selection
  selectedCountryId: string | null
  countryData: Country | null
  loading: boolean
  error: string | null
  selectCountry: (id: string) => Promise<void>
  clearSelection: () => void

  // Layer toggles
  showConflicts: boolean
  showTradeRoutes: boolean
  showChokepoints: boolean
  toggleConflicts: () => void
  toggleTradeRoutes: () => void
  toggleChokepoints: () => void

  // Conflict card
  selectedConflict: Conflict | null
  selectConflict: (conflict: Conflict) => void
  clearConflict: () => void
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
      set({ error: `No detailed data available for this country yet.`, loading: false })
    }
  },

  clearSelection: () =>
    set({ selectedCountryId: null, countryData: null, error: null }),

  // Layers — conflicts and chokepoints on by default, routes off
  showConflicts: true,
  showTradeRoutes: false,
  showChokepoints: false,
  toggleConflicts:   () => set((s) => ({ showConflicts: !s.showConflicts })),
  toggleTradeRoutes: () => set((s) => ({ showTradeRoutes: !s.showTradeRoutes })),
  toggleChokepoints: () => set((s) => ({ showChokepoints: !s.showChokepoints })),

  // Conflict popup
  selectedConflict: null,
  selectConflict: (conflict) => set({ selectedConflict: conflict, selectedCountryId: null, countryData: null }),
  clearConflict: () => set({ selectedConflict: null }),
}))
