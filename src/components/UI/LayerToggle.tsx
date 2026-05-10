import { useMapStore } from '../../store/useMapStore'

export default function LayerToggle() {
  const { showConflicts, toggleConflicts, showTradeRoutes, toggleTradeRoutes, showChokepoints, toggleChokepoints } = useMapStore()

  const layers = [
    { label: 'Conflicts',  active: showConflicts,   toggle: toggleConflicts,   dot: '#ef4444', border: '#7f1d1d', bg: '#1c0a0a' },
    { label: 'Routes',     active: showTradeRoutes,  toggle: toggleTradeRoutes, dot: '#06b6d4', border: '#164e63', bg: '#031b21' },
    { label: 'Chokepoints',active: showChokepoints,  toggle: toggleChokepoints, dot: '#f59e0b', border: '#78350f', bg: '#1c0f03' },
  ]

  return (
    <div className="flex items-center gap-1.5">
      {layers.map(l => (
        <button
          key={l.label}
          onClick={l.toggle}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
          style={l.active
            ? { background: l.bg, borderColor: l.border, color: l.dot }
            : { background: '#0E1525', borderColor: '#1E2D4A', color: '#475569' }
          }
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: l.active ? l.dot : '#334155' }} />
          {l.label}
        </button>
      ))}
    </div>
  )
}
