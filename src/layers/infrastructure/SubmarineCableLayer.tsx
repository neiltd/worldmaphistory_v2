/**
 * SubmarineCableLayer — renders undersea internet cables as line features.
 * Status: placeholder — renders nothing until data is wired.
 * Data: src/layers/infrastructure/data/cables.sample.json
 */
import type { LayerProps } from '../_core/types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SubmarineCableLayer(_props: LayerProps) {
  // TODO: Load cables.sample.json, build GeoJSON LineString per cable
  // Apply fixGeometry() from geoUtils for antimeridian safety
  // Color by status: active=#06b6d4 planned=#6366f1 damaged=#ef4444 unknown=#475569
  // Line width by capacityTbps
  // Landing points as small circle markers
  // Hover: show cable name, owners, capacity, year, notes
  return null
}
