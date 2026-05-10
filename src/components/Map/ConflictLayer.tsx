import { Marker } from 'react-simple-maps'
import { useMapStore } from '../../store/useMapStore'
import type { Conflict } from '../../types/conflict'
import conflictsData from '../../data/conflicts.json'

const conflicts = conflictsData as Conflict[]

const INTENSITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#84cc16',
}
const INTENSITY_BASE: Record<string, number> = {
  critical: 8, high: 6, medium: 5, low: 4,
}

export default function ConflictLayer({ zoom }: { zoom: number }) {
  const { selectConflict, selectedConflict } = useMapStore()

  return (
    <>
      {conflicts.map(c => {
        const color = INTENSITY_COLOR[c.intensity]
        const base  = INTENSITY_BASE[c.intensity]
        // Scale inversely with zoom so markers stay geographically consistent
        const r = Math.max(2, base / Math.sqrt(zoom))
        const isSelected = selectedConflict?.id === c.id

        return (
          <Marker key={c.id} coordinates={c.coordinates} onClick={() => selectConflict(c)}>
            {/* Pulse ring */}
            <circle
              r={r * 2.4}
              fill="none"
              stroke={color}
              strokeWidth={0.8}
              className="conflict-pulse"
              style={{ transformOrigin: '0px 0px' }}
            />
            {/* Core dot */}
            <circle
              r={r}
              fill={color}
              fillOpacity={isSelected ? 1 : 0.85}
              stroke={isSelected ? '#fff' : '#070B14'}
              strokeWidth={isSelected ? 1.5 : 0.8}
              style={{ cursor: 'pointer' }}
            />
          </Marker>
        )
      })}
    </>
  )
}
