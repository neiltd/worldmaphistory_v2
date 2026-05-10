import { useState } from 'react'
import { Geographies, Geography, Marker } from 'react-simple-maps'
import { useMapStore } from '../../store/useMapStore'
import type { Conflict } from '../../types/conflict'
import conflictsData from '../../data/conflicts.json'
import conflictZonesData from '../../data/conflict-zones.json'

const conflicts = conflictsData as Conflict[]

// Zone fill colours by intensity
const ZONE_FILL: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#84cc16',
}
// Pulse dot colours
const DOT_FILL = ZONE_FILL

interface ZoneProperties {
  id: string
  name: string
  intensity: string
  type: string
  description: string
}

export default function ConflictZoneLayer({ zoom }: { zoom: number }) {
  const { selectConflict, selectedConflict } = useMapStore()
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)

  const dotSize = 7 / zoom

  function handleZoneClick(id: string) {
    const conflict = conflicts.find(c => c.id === id)
    if (conflict) selectConflict(conflict)
  }

  return (
    <>
      {/* Filled zone polygons */}
      <Geographies geography={conflictZonesData}>
        {({ geographies }) =>
          geographies.map(geo => {
            const props = geo.properties as unknown as ZoneProperties
            const isSelected = selectedConflict?.id === props.id
            const isHovered  = hoveredZone === props.id
            const color = ZONE_FILL[props.intensity] ?? '#ef4444'

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={color}
                fillOpacity={isSelected ? 0.35 : isHovered ? 0.28 : 0.18}
                stroke={color}
                strokeWidth={isSelected ? 1.5 : 0.8}
                strokeOpacity={isSelected ? 0.9 : 0.5}
                strokeDasharray={props.type === 'frontline' ? '4 2' : undefined}
                style={{
                  default: { outline: 'none', cursor: 'pointer' },
                  hover:   { outline: 'none', cursor: 'pointer' },
                  pressed: { outline: 'none' },
                }}
                onMouseEnter={() => setHoveredZone(props.id)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(props.id)}
              />
            )
          })
        }
      </Geographies>

      {/* Pulsing centre dot for each conflict */}
      {conflicts.map(c => {
        const color = DOT_FILL[c.intensity]
        const r     = dotSize
        const isSelected = selectedConflict?.id === c.id

        return (
          <Marker key={c.id} coordinates={c.coordinates} onClick={() => selectConflict(c)}>
            <circle r={r * 2.5} fill="none" stroke={color} strokeWidth={0.8}
              className="conflict-pulse" style={{ transformOrigin: '0px 0px' }} />
            <circle r={r} fill={color} fillOpacity={isSelected ? 1 : 0.9}
              stroke={isSelected ? '#fff' : '#070B14'} strokeWidth={isSelected ? 1.5 : 0.8}
              style={{ cursor: 'pointer' }} />
          </Marker>
        )
      })}
    </>
  )
}
