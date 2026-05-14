/**
 * useMapInteraction — MapLibre hover, tooltip, and click selection handling.
 *
 * Responsibilities:
 *   - Hover: identify which feature the cursor is over (country or trade route)
 *   - Tooltip: build tooltip data from hovered feature properties
 *   - Click: dispatch country selection to the store
 *   - Leave: clear tooltip on mouse exit
 *   - Interactive layers: compute which layer IDs MapLibre should query on events
 *
 * Returns stable callback refs (useCallback) — safe to pass directly to
 * react-map-gl event props without causing Map re-mounts.
 *
 * No rendering. No side effects beyond store dispatch on click.
 * No AI logic. No business logic.
 *
 * ─── Future event-stream note ─────────────────────────────────────────────────
 * When real-time intelligence events are active, hovering a country may need
 * to show event count or latest event summary alongside the indicator score.
 * Add an optional `eventIndex?: Record<string, number>` param — the tooltip
 * builder extends naturally without changing the callback signatures that
 * WorldMap passes to <Map>.
 *
 * ─── MapLibre bottleneck note ─────────────────────────────────────────────────
 * interactiveLayerIds causes MapLibre to run feature-querying on every mousemove.
 * At the current layer count (2 interactive: countries-fill + trade-routes-line)
 * this is negligible. If many layers become interactive simultaneously, consider
 * debouncing the mousemove handler (~16ms) or using MapLibre's queryRenderedFeatures
 * selectively by visible viewport bounds rather than querying all features.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useMemo } from 'react'
import type { MapMouseEvent } from 'react-map-gl/maplibre'
import { useMapStore } from '../store/useMapStore'
import { allIndicators } from '../lib/geo/indicators'

// ── Tooltip data shape ────────────────────────────────────────────────────────
// Exported so WorldMap can type its tooltip rendering without re-declaring.
// All fields come from GeoJSON feature properties — no store lookups on hover.
export type TooltipState =
  | { kind: 'country'; name: string; score?: number; x: number; y: number }
  | { kind: 'route';   name: string; from: string; to: string; goods: string; value: string; risk: string; x: number; y: number }
  | {
      kind: 'event'
      headline:        string
      eventDate:       string
      eventType:       string
      coordQuality:    string   // 'source_exact' | 'source_approx' | 'country_centroid' | 'missing'
      coordSource:     string   // e.g. 'acled-field', 'nominatim', 'gadm-centroid'
      confidenceLabel: string   // 'high' | 'medium' | 'low'
      fatalities:      number
      x: number; y: number
    }

export interface MapInteractionResult {
  tooltip: TooltipState | null
  interactiveIds: string[]
  handleMouseMove: (e: MapMouseEvent) => void
  handleMouseLeave: () => void
  handleClick: (e: MapMouseEvent) => void
}

export function useMapInteraction(): MapInteractionResult {
  const { selectCountry, heatmapIndicator, layerVisibility, isLayerVisible } = useMapStore()
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Only include layers that are both interactive and currently enabled.
  // countries-fill is always interactive (country click/hover).
  // trade-routes-line is only interactive when the layer is visible.
  //
  // layerVisibility is a new object reference on every toggle, so this memo
  // correctly re-runs when any layer is toggled.
  const interactiveIds = useMemo(() => {
    const ids: string[] = ['countries-fill']
    if (isLayerVisible('trade-routes'))          ids.push('trade-routes-line')
    // intelligence-events-points is the interactive circle layer.
    // The halo layer (intelligence-events-halo) is decorative only — not interactive.
    if (isLayerVisible('intelligence-events'))   ids.push('intelligence-events-points')
    return ids
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerVisibility])

  const handleMouseMove = useCallback((e: MapMouseEvent) => {
    const f = e.features?.[0]
    if (!f) {
      setTooltip(null)
      return
    }

    if (f.layer.id === 'countries-fill') {
      const iso3: string | undefined = f.properties?.iso3
      const score = heatmapIndicator !== 'none' && iso3
        ? allIndicators[iso3]?.[heatmapIndicator]
        : undefined
      setTooltip({
        kind: 'country',
        name: f.properties?.name ?? '',
        score,
        x: e.point.x,
        y: e.point.y,
      })
    } else if (f.layer.id === 'trade-routes-line') {
      setTooltip({
        kind: 'route',
        name:   f.properties?.name    ?? '',
        from:   f.properties?.fromName  ?? '',
        to:     f.properties?.toName    ?? '',
        goods:  f.properties?.keyGoods  ?? '',
        value:  f.properties?.annualValue ?? '',
        risk:   f.properties?.riskLevel  ?? 'medium',
        x: e.point.x,
        y: e.point.y,
      })
    } else if (f.layer.id === 'intelligence-events-points') {
      // All tooltip data was baked into GeoJSON properties at build time —
      // no store lookup needed here. Frontend reads only, never enriches.
      setTooltip({
        kind:            'event',
        headline:        f.properties?.headline        ?? '',
        eventDate:       f.properties?.eventDate       ?? '',
        eventType:       f.properties?.eventType       ?? '',
        coordQuality:    f.properties?.coordQuality    ?? 'source_approx',
        coordSource:     f.properties?.coordSource     ?? '',
        confidenceLabel: f.properties?.confidenceLabel ?? 'medium',
        fatalities:      typeof f.properties?.fatalities === 'number' ? f.properties.fatalities : 0,
        x: e.point.x,
        y: e.point.y,
      })
    }
  }, [heatmapIndicator])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  const handleClick = useCallback((e: MapMouseEvent) => {
    const f = e.features?.[0]
    if (!f) return
    if (f.layer.id === 'countries-fill') {
      const iso3: string | undefined = f.properties?.iso3
      if (iso3) selectCountry(iso3)
    }
  }, [selectCountry])

  return { tooltip, interactiveIds, handleMouseMove, handleMouseLeave, handleClick }
}
