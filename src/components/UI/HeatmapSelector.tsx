import { useMapStore, INDICATOR_LABELS, type IndicatorKey } from '../../store/useMapStore'

const OPTIONS = Object.entries(INDICATOR_LABELS) as [IndicatorKey, string][]

export default function HeatmapSelector() {
  const { heatmapIndicator, setHeatmapIndicator } = useMapStore()

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-600 hidden lg:block">Heatmap</span>
      <select
        value={heatmapIndicator}
        onChange={e => setHeatmapIndicator(e.target.value as IndicatorKey)}
        className="bg-[#0E1525] border border-[#1E2D4A] text-xs text-slate-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:border-blue-700 transition-colors"
      >
        {OPTIONS.map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
      {heatmapIndicator !== 'none' && (
        <div className="flex items-center gap-1">
          <div className="w-12 h-2 rounded-full" style={{
            background: 'linear-gradient(to right, #dc2626, #d97706, #16a34a)'
          }} />
          <span className="text-xs text-slate-600">Low→High</span>
        </div>
      )}
    </div>
  )
}
