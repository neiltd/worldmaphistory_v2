import { useMapStore } from '../../store/useMapStore'

const INTENSITY_STYLE: Record<string, string> = {
  critical: 'text-red-400 bg-red-950/50 border-red-900',
  high:     'text-orange-400 bg-orange-950/50 border-orange-900',
  medium:   'text-yellow-400 bg-yellow-950/50 border-yellow-900',
  low:      'text-lime-400 bg-lime-950/50 border-lime-900',
}
const STATUS_COLOR: Record<string, string> = {
  active: 'text-red-400', escalating: 'text-orange-400',
  'de-escalating': 'text-yellow-400', ceasefire: 'text-blue-400',
}
const TYPE_LABEL: Record<string, string> = {
  armed_conflict: 'Armed Conflict', civil_war: 'Civil War',
  territorial_dispute: 'Territorial Dispute', naval_tension: 'Naval Tension',
  frozen_conflict: 'Frozen Conflict',
}

export default function ConflictCard() {
  const { selectedConflict: c, clearConflict } = useMapStore()
  if (!c) return null

  return (
    <div className="absolute bottom-4 left-3 z-30 w-76 max-w-xs bg-[#0E1525]/95 border border-[#1E2D4A] rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
      <div className="px-3.5 pt-3 pb-2 border-b border-[#1E2D4A] flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${INTENSITY_STYLE[c.intensity]}`}>
              {c.intensity.toUpperCase()}
            </span>
            <span className={`text-xs ${STATUS_COLOR[c.status]}`}>● {c.status.replace('-', ' ')}</span>
          </div>
          <h3 className="text-sm font-bold text-white leading-tight truncate">{c.name}</h3>
          <p className="text-xs text-slate-600 mt-0.5">{TYPE_LABEL[c.type]} · Since {c.startYear}</p>
        </div>
        <button onClick={clearConflict} className="text-slate-600 hover:text-white text-xl leading-none flex-shrink-0">×</button>
      </div>

      <div className="px-3.5 py-3 max-h-72 overflow-y-auto space-y-3">
        <div>
          <p className="text-xs text-slate-600 mb-1 uppercase tracking-wider font-medium">Parties</p>
          {c.parties.map((p, i) => (
            <p key={i} className="text-xs text-slate-300 mb-0.5">
              <span className="text-slate-200 font-medium">{p.countryName}</span>
              <span className="text-slate-600"> — {p.role}</span>
            </p>
          ))}
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1 uppercase tracking-wider font-medium">Now</p>
          <p className="text-xs text-slate-400 leading-snug">{c.currentStatus}</p>
        </div>
        <div className="bg-red-950/30 border border-red-900/30 rounded-lg p-2">
          <p className="text-xs text-red-400 font-medium mb-0.5">Casualties</p>
          <p className="text-xs text-slate-400 leading-snug">{c.casualties}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1 uppercase tracking-wider font-medium">International</p>
          <p className="text-xs text-slate-400 leading-snug">{c.internationalInvolvement}</p>
        </div>
      </div>
    </div>
  )
}
