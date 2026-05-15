/**
 * SubmarineCableLayer — submarine cable visualization.
 *
 * Cable LINES were already Source + Layer (GPU) — unchanged.
 * Landing POINTS migrated from React Marker (~120 DOM elements) to GPU circles.
 *
 * Two separate GeoJSON Sources:
 *   'submarine-cables'       — cable route LineStrings (existing, unchanged)
 *   'cable-landing-points'   — landing point Points (new)
 *
 * Both cable and landing point data are baked into each landing point feature's
 * properties so the generic infrastructure tooltip can render cable context
 * (name, capacity, owners) alongside landing point location context (name, city).
 *
 * strategicImportance is not yet populated on cable records (0/12).
 * No halo layer added — will be added when data is populated.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/maplibre'
import { fixGeometry, isValidCoord } from '../../utils/geoUtils'
import cablesData from '../../data/validated/submarine-cables.json'
import type { LayerProps } from '../_core/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cables = cablesData as any[]

const STATUS_COLOR: Record<string, string> = {
  active:       '#06b6d4',
  construction: '#f59e0b',
  planned:      '#64748b',
  damaged:      '#ef4444',
  unknown:      '#475569',
}

export default function SubmarineCableLayer({ visible, labelLayerId }: LayerProps) {

  // ── Cable route LineStrings (unchanged from original) ─────────────────────
  const cablesGeo = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: cables
      .filter(c => c.route && c.route.length >= 2)
      .map(c => ({
        type: 'Feature' as const,
        geometry: fixGeometry({ type: 'LineString', coordinates: c.route }),
        properties: {
          id:           c.id,
          name:         c.name,
          status:       c.status,
          capacityTbps: c.capacityTbps ?? null,
          lengthKm:     c.lengthKm ?? null,
          yearLaid:     c.yearLaid ?? null,
          owners:       c.owners?.join(', ') ?? null,
        },
      })),
  }), [])

  // ── Landing point circles — cable + point data baked into each feature ────
  const landingGeo = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: cables.flatMap((cable: any) =>
      (cable.landingPoints ?? [])
        .filter((lp: any) => isValidCoord(lp.coordinates))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((lp: any) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: lp.coordinates as [number, number] },
          properties: {
            // Tooltip fields — cable name as primary, landing point as subtitle
            name:       cable.name,
            subtitle:   [
              `Landing: ${lp.name}`,
              lp.city && lp.city !== lp.name ? lp.city : null,
              lp.countryId,
            ].filter(Boolean).join(' · '),
            importance: cable.strategicImportance ?? '',
            note:       cable.geopoliticalNotes ?? '',
            ...(cable.capacityTbps   ? { tag_Capacity:      `${cable.capacityTbps} Tbps` }      : {}),
            ...(cable.lengthKm       ? { tag_Length:        `${cable.lengthKm.toLocaleString()} km` } : {}),
            ...(cable.yearLaid       ? { tag_YearLaid:      String(cable.yearLaid) }             : {}),
            tag_LandingPoints: String((cable.landingPoints ?? []).length),
            ...(cable.owners?.length
              ? {
                  tag_Owners: cable.owners.slice(0, 3).join(', ') +
                    (cable.owners.length > 3 ? ` +${cable.owners.length - 3}` : ''),
                }
              : {}),
            // Paint input
            color: STATUS_COLOR[cable.status] ?? '#475569',
          },
        }))
    ),
  }), [])

  if (!visible) return null

  return (
    <>
      {/* ── Cable route lines (unchanged) ──────────────────────────────── */}
      <Source id="submarine-cables" type="geojson" data={cablesGeo}>
        <Layer
          id="submarine-cables-glow"
          type="line"
          beforeId={labelLayerId}
          paint={{
            'line-color': ['match', ['get', 'status'],
              'active', '#06b6d4', 'construction', '#f59e0b', 'damaged', '#ef4444', '#475569',
            ],
            'line-width': 6,
            'line-opacity': 0.08,
          }}
        />
        <Layer
          id="submarine-cables-line"
          type="line"
          beforeId={labelLayerId}
          paint={{
            'line-color': ['match', ['get', 'status'],
              'active', '#06b6d4', 'construction', '#f59e0b',
              'planned', '#64748b', 'damaged', '#ef4444', '#475569',
            ],
            'line-width': 2,
            'line-opacity': 0.75,
            'line-dasharray': ['match', ['get', 'status'],
              'construction', ['literal', [4, 3]],
              'planned',      ['literal', [2, 4]],
              ['literal', [1]],
            ],
          }}
        />
      </Source>

      {/* ── Landing point circles ───────────────────────────────────────── */}
      <Source id="cable-landing-points" type="geojson" data={landingGeo}>
        <Layer
          id="cable-landing-circles"
          type="circle"
          paint={{
            'circle-radius':         4,
            'circle-color':          ['get', 'color'] as unknown as string,
            'circle-opacity':        0.85,
            'circle-stroke-width':   1,
            'circle-stroke-color':   '#0A0F1E',
            'circle-stroke-opacity': 0.6,
          }}
        />
      </Source>
    </>
  )
}
