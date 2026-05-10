import { Source, Layer, Marker } from 'react-map-gl/maplibre'
import { useMapStore } from '../../store/useMapStore'
import conflictsData from '../../data/conflicts.json'
import conflictZonesData from '../../data/conflict-zones.json'
import type { Conflict } from '../../types/conflict'

const conflicts = conflictsData as Conflict[]

const INTENSITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#84cc16',
}

interface Props {
  show: boolean
  labelLayerId?: string
}

export default function ConflictZoneLayer({ show, labelLayerId }: Props) {
  const { selectConflict, selectedConflict } = useMapStore()

  if (!show) return null

  return (
    <>
      {/* Conflict zone polygons */}
      <Source id="conflict-zones" type="geojson" data={conflictZonesData as any}>
        <Layer
          id="conflict-zones-fill"
          type="fill"
          beforeId={labelLayerId}
          paint={{
            'fill-color': ['match', ['get', 'intensity'],
              'critical', '#ef4444',
              'high',     '#f97316',
              'medium',   '#eab308',
              'low',      '#84cc16',
              '#ef4444',
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
              'critical', '#ef4444',
              'high',     '#f97316',
              'medium',   '#eab308',
              'low',      '#84cc16',
              '#ef4444',
            ],
            'line-width': 1,
            'line-opacity': 0.5,
          }}
        />
      </Source>

      {/* Pulsing dot for each conflict — HTML Marker so it stays fixed screen size */}
      {conflicts.filter(c => {
        const [lng, lat] = c.coordinates ?? [0, 0]
        return !isNaN(lng) && !isNaN(lat) && !(lng === 0 && lat === 0)
      }).map(c => {
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
              {/* Pulse ring */}
              <div
                className="conflict-pulse absolute rounded-full"
                style={{
                  inset: 0,
                  border: `1.5px solid ${color}`,
                }}
              />
              {/* Center dot */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 8, height: 8,
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: color,
                  border: isSelected ? '2px solid #fff' : '1.5px solid #070B14',
                  boxShadow: isSelected ? `0 0 6px ${color}` : 'none',
                }}
              />
            </div>
          </Marker>
        )
      })}
    </>
  )
}
