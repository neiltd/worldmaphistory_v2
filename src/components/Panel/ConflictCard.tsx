import { useMapStore } from '../../store/useMapStore'

const INTENSITY_COLOR: Record<string, string> = {
  critical: 'text-red-400 bg-red-900/40 border-red-800',
  high:     'text-orange-400 bg-orange-900/40 border-orange-800',
  medium:   'text-yellow-400 bg-yellow-900/40 border-yellow-800',
  low:      'text-lime-400 bg-lime-900/40 border-lime-800',
}

const TYPE_LABEL: Record<string, string> = {
  armed_conflict:      'Armed Conflict',
  civil_war:           'Civil War',
  territorial_dispute: 'Territorial Dispute',
  naval_tension:       'Naval / Maritime Tension',
  frozen_conflict:     'Frozen Conflict',
}

const STATUS_COLOR: Record<string, string> = {
  active:          'text-red-400',
  escalating:      'text-orange-400',
  'de-escalating': 'text-yellow-400',
  ceasefire:       'text-blue-400',
}

export default function ConflictCard() {
  const { selectedConflict: c, clearConflict } = useMapStore()
  if (!c) return null

  return (
    <div className="absolute bottom-20 left-4 z-30 w-80 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-3 pb-2 border-b border-slate-800">
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${INTENSITY_COLOR[c.intensity]}`}>
              {c.intensity.toUpperCase()}
            </span>
            <span className={`text-xs font-medium ${STATUS_COLOR[c.status]}`}>
              ● {c.status.replace('-', ' ')}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white leading-tight">{c.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{TYPE_LABEL[c.type]} · Since {c.startYear}</p>
        </div>
        <button onClick={clearConflict} className="text-slate-500 hover:text-white text-xl leading-none flex-shrink-0">×</button>
      </div>

      <div className="px-4 py-3 max-h-80 overflow-y-auto">
        {/* Parties */}
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Parties</p>
          {c.parties.map((p, i) => (
            <div key={i} className="flex items-start gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-300 min-w-0 flex-shrink-0">{p.countryName}</span>
              <span className="text-xs text-slate-500">— {p.role}</span>
            </div>
          ))}
        </div>

        {/* Current status */}
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Situation Now</p>
          <p className="text-xs text-slate-300 leading-relaxed">{c.currentStatus}</p>
        </div>

        {/* Casualties */}
        <div className="mb-3 bg-red-950/30 border border-red-900/40 rounded-lg p-2.5">
          <p className="text-xs text-red-400 font-medium mb-0.5">Casualties</p>
          <p className="text-xs text-slate-300 leading-snug">{c.casualties}</p>
        </div>

        {/* International */}
        <div className="mb-2">
          <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">International Involvement</p>
          <p className="text-xs text-slate-400 leading-relaxed">{c.internationalInvolvement}</p>
        </div>

        {/* Summary */}
        <div className="pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-500 leading-relaxed">{c.summary}</p>
        </div>
      </div>
    </div>
  )
}
