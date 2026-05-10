/**
 * PortLayer — renders major seaports as markers.
 * Status: placeholder — renders nothing until data is wired.
 * Data: src/layers/infrastructure/data/ports.sample.json
 */
import type { LayerProps } from '../_core/types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PortLayer(_props: LayerProps) {
  // TODO: Load ports.sample.json, render Marker per port
  // Icon: anchor symbol, color by type (container=blue, oil=amber, lng=orange)
  // Size by annualThroughput or strategicImportance
  // Click: show port detail tooltip (name, type, throughput, notes)
  return null
}
