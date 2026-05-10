import { Source, Layer, Marker } from 'react-map-gl/maplibre'
import { useMapStore } from '../../store/useMapStore'
import conflictsData from '../../data/conflicts.json'
import conflictZonesData from '../../data/conflict-zones.json'
import type { Conflict } from '../../types/conflict'
import { fixFeatureCollection, isValidCoord } from '../../utils/geoUtils'
import type { LayerProps } from '../_core/types'

const conflicts = conflictsData as Conflict[]
const safeZones = fixFeatureCollection(conflictZonesData)

const INTENSITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#84cc16',
}

export default function ConflictZoneLayer({ visible, labelLayerId }: LayerProps) {
  const { selectConflict, selectedConflict } = useMapStore()

  if (!visible) return null

  return (
    <>
      <Source id="conflict-zones" type="geojson" data={safeZones}>
        <Layer
          id="conflict-zones-fill"
          type="fill"
          beforeId={labelLayerId}
          paint={{
            'fill-color': ['match', ['get', 'intensity'],
              'critical', '#ef4444', 'high', '#f97316',
              'medium', '#eab308', 'low', '#84cc16', '#ef4444',
            ],
            'fill-opacity': 0.15,
          }}
        />
        <Layer
          id="conflict-zones-line"
          type="line"
          beforeId={labelLayerId}
          paint={{
            'line-color': ['match', ['get', 'intensity'],
              'critical', '#ef4444', 'high', '#f97316',
              'medium', '#eab308', 'low', '#84cc16', '#ef4444',
            ],
            'line-width': 1,
            'line-opacity': 0.5,
          }}
        />
      </Source>

      {conflicts.filter(c => isValidCoord(c.coordinates)).map(c => {
        const color = INTENSITY_COLOR[c.intensity] ?? '#ef4444'
        const isSelected = selectedConflict?.id === c.id
        return (
          <Marker
            key={c.id}
            longitude={c.coordinates[0]}
            latitude={c.coordinates[1]}
            anchor="center"
            onClick={e => { e.originalEvent.stopPropagation(); selectConflict(c) }}
          >
            <div className="relative cursor-pointer" style={{ width: 16, height: 16 }}>
              <div className="conflict-pulse absolute rounded-full"
                style={{ inset: 0, border: `1.5px solid ${color}` }} />
              <div className="absolute rounded-full" style={{
                width: 8, height: 8, top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: color,
                border: isSelected ? '2px solid #fff' : '1.5px solid #070B14',
                boxShadow: isSelected ? `0 0 6px ${color}` : 'none',
              }} />
            </div>
          </Marker>
        )
      })}
    </>
  )
}
