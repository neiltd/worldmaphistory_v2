/**
 * Intelligence store — runtime state for hub-imported data.
 *
 * Separate from useMapStore intentionally:
 *   - useMapStore owns: map interaction, layer visibility, country selection
 *   - useIntelligenceStore owns: imported events, indicators, manifest
 *
 * The store loads data lazily (first call to loadImports() triggers fetch).
 * Subsequent calls return cached state — no redundant file reads.
 *
 * ─── Future agent integration point ──────────────────────────────────────────
 * When agents produce enriched events, they write updated import files.
 * Call refreshImports() to reload. The store propagates changes to all
 * subscribed components without requiring them to know about the hub.
 *
 * ─── Future real-time integration point ──────────────────────────────────────
 * If the hub eventually pushes via WebSocket, the WS handler calls
 * appendEvents(newEvents) — the store merges and deduplicates without
 * a full reload.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand'
import type { ImportedEvent, EnergyIndicator, ImportManifest } from '../data/schemas/imports'
import { loadAllImports } from '../lib/adapters/imports'

interface IntelligenceStore {
  // Load state
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null

  // Imported data
  events:           ImportedEvent[]
  energyIndicators: EnergyIndicator[]
  macroIndicators:  Record<string, Record<string, number>>  // ISO3 → { key: value }
  manifest:         ImportManifest | null

  // Derived lookups (built once on load, used for O(1) map queries)
  // ISO3 → events involving that country
  eventsByIso3:     Record<string, ImportedEvent[]>
  // indicatorKey → latest value in series
  latestEnergy:     Record<string, number>

  // Actions
  loadImports:    () => Promise<void>
  refreshImports: () => Promise<void>

  // Future: appendEvents(newEvents: ImportedEvent[]): void
  // Future: updateEnergyTick(key: string, value: number): void
}

// ── Derived index builders ────────────────────────────────────────────────────

function buildEventsByIso3(events: ImportedEvent[]): Record<string, ImportedEvent[]> {
  const index: Record<string, ImportedEvent[]> = {}
  for (const evt of events) {
    for (const iso3 of evt.iso3) {
      if (!index[iso3]) index[iso3] = []
      index[iso3].push(evt)
    }
  }
  return index
}

function buildLatestEnergy(indicators: EnergyIndicator[]): Record<string, number> {
  const latest: Record<string, number> = {}
  for (const ind of indicators) {
    if (ind.series.length > 0) {
      // series is most-recent-first from the hub
      latest[ind.indicatorKey] = ind.series[0].value
    }
  }
  return latest
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useIntelligenceStore = create<IntelligenceStore>((set, get) => ({
  status: 'idle',
  error: null,

  events:           [],
  energyIndicators: [],
  macroIndicators:  {},
  manifest:         null,
  eventsByIso3:     {},
  latestEnergy:     {},

  loadImports: async () => {
    // Don't reload if already loaded
    if (get().status === 'ready' || get().status === 'loading') return

    set({ status: 'loading', error: null })
    try {
      const data = await loadAllImports()
      set({
        status:           'ready',
        events:           data.events,
        energyIndicators: data.energyIndicators,
        macroIndicators:  data.macroIndicators,
        manifest:         data.manifest,
        eventsByIso3:     buildEventsByIso3(data.events),
        latestEnergy:     buildLatestEnergy(data.energyIndicators),
      })
    } catch (e) {
      set({ status: 'error', error: (e as Error).message })
    }
  },

  refreshImports: async () => {
    // Force a reload regardless of current state
    set({ status: 'idle' })
    await get().loadImports()
  },
}))

// ── Selector helpers (memoize expensive queries outside the store) ─────────────

/** Get all events for a specific country, sorted newest first. */
export function getEventsForCountry(
  store: IntelligenceStore,
  iso3: string
): ImportedEvent[] {
  return (store.eventsByIso3[iso3] ?? []).sort(
    (a, b) => b.eventDate.localeCompare(a.eventDate)
  )
}

/** Get the most recent N events across all countries, sorted newest first. */
export function getRecentEvents(
  store: IntelligenceStore,
  limit = 20
): ImportedEvent[] {
  return [...store.events]
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
    .slice(0, limit)
}

/** Get all countries that have active events (for heatmap / marker rendering). */
export function getActiveCountries(store: IntelligenceStore): Set<string> {
  return new Set(store.events.flatMap(e => e.iso3))
}
