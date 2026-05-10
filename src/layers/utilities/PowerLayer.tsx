/**
 * PowerLayer — energy infrastructure and electricity mix visualization.
 * Status: placeholder — renders nothing until data is wired.
 * Data: src/layers/utilities/data/utilities.sample.json
 */
import type { LayerProps } from '../_core/types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PowerLayer(_props: LayerProps) {
  // TODO: Two sub-modes:
  // 1. Country fill heatmap by fossil fuel dependency (coal+gas+oil %)
  // 2. Individual power plant markers (when data available)
  // Color by energy type: coal=#78350f gas=#92400e nuclear=#1e3a8a
  //   hydro=#1e40af solar=#92400e wind=#065f46
  return null
}
