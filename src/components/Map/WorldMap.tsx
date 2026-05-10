import { useState } from 'react'
import {
  ComposableMap, Geographies, Geography, ZoomableGroup,
} from 'react-simple-maps'
import { useMapStore } from '../../store/useMapStore'
import ConflictZoneLayer from './ConflictZoneLayer'
import TradeRouteLayer from './TradeRouteLayer'
import indicatorsIndex from '../../data/indicators-index.json'

const GEO_URL = '/worldmaphistory_v2/countries-110m.json'

const NUM_TO_ISO3: Record<string, string> = {
  '004':'AFG','008':'ALB','012':'DZA','024':'AGO','028':'ATG','032':'ARG','036':'AUS',
  '040':'AUT','031':'AZE','044':'BHS','048':'BHR','050':'BGD','052':'BRB','112':'BLR',
  '056':'BEL','084':'BLZ','204':'BEN','064':'BTN','068':'BOL','070':'BIH','072':'BWA',
  '076':'BRA','096':'BRN','100':'BGR','854':'BFA','108':'BDI','116':'KHM','120':'CMR',
  '124':'CAN','132':'CPV','140':'CAF','148':'TCD','152':'CHL','156':'CHN','170':'COL',
  '174':'COM','178':'COG','180':'COD','188':'CRI','384':'CIV','191':'HRV','192':'CUB',
  '196':'CYP','203':'CZE','208':'DNK','262':'DJI','214':'DOM','218':'ECU','818':'EGY',
  '222':'SLV','226':'GNQ','232':'ERI','233':'EST','231':'ETH','242':'FJI','246':'FIN',
  '250':'FRA','266':'GAB','270':'GMB','268':'GEO','276':'DEU','288':'GHA','300':'GRC',
  '308':'GRD','320':'GTM','324':'GIN','624':'GNB','328':'GUY','332':'HTI','340':'HND',
  '348':'HUN','356':'IND','360':'IDN','364':'IRN','368':'IRQ','372':'IRL','376':'ISR',
  '380':'ITA','388':'JAM','392':'JPN','400':'JOR','398':'KAZ','404':'KEN','296':'KIR',
  '408':'PRK','410':'KOR','414':'KWT','417':'KGZ','418':'LAO','422':'LBN','426':'LSO',
  '430':'LBR','434':'LBY','440':'LTU','442':'LUX','450':'MDG','454':'MWI','458':'MYS',
  '462':'MDV','466':'MLI','470':'MLT','478':'MRT','484':'MEX','583':'FSM','498':'MDA',
  '496':'MNG','504':'MAR','508':'MOZ','104':'MMR','516':'NAM','520':'NRU','524':'NPL',
  '528':'NLD','554':'NZL','558':'NIC','562':'NER','566':'NGA','578':'NOR','512':'OMN',
  '586':'PAK','585':'PLW','591':'PAN','598':'PNG','600':'PRY','604':'PER','608':'PHL',
  '616':'POL','620':'PRT','634':'QAT','642':'ROU','643':'RUS','646':'RWA','659':'KNA',
  '662':'LCA','670':'VCT','882':'WSM','678':'STP','682':'SAU','686':'SEN','694':'SLE',
  '706':'SOM','710':'ZAF','724':'ESP','144':'LKA','729':'SDN','740':'SUR','752':'SWE',
  '756':'CHE','760':'SYR','762':'TJK','834':'TZA','764':'THA','626':'TLS','768':'TGO',
  '776':'TON','780':'TTO','788':'TUN','792':'TUR','795':'TKM','798':'TUV','800':'UGA',
  '804':'UKR','784':'ARE','826':'GBR','840':'USA','858':'URY','860':'UZB','548':'VUT',
  '862':'VEN','704':'VNM','887':'YEM','894':'ZMB','716':'ZWE','020':'AND','051':'ARM',
  '352':'ISL','438':'LIE','492':'MCO','807':'MKD','480':'MUS','688':'SRB','703':'SVK',
  '705':'SVN','090':'SLB',
}


// Score (1-10) → hex colour for heatmap
function scoreToColor(score: number): string {
  const t = (score - 1) / 9
  if (t < 0.5) {
    const r = Math.round(220 + (217 - 220) * (t * 2))
    const g = Math.round(38  + (119 - 38)  * (t * 2))
    const b = Math.round(38  + (6   - 38)  * (t * 2))
    return `rgb(${r},${g},${b})`
  } else {
    const u = (t - 0.5) * 2
    const r = Math.round(217 + (22  - 217) * u)
    const g = Math.round(119 + (163 - 119) * u)
    const b = Math.round(6   + (74  - 6)   * u)
    return `rgb(${r},${g},${b})`
  }
}

type IndicatorsMap = Record<string, Record<string, number>>
const indicators = indicatorsIndex as IndicatorsMap

export default function WorldMap() {
  const {
    countryData, compareData, selectCountry,
    showConflicts, showTradeRoutes, showChokepoints,
    heatmapIndicator, setMapZoom,
  } = useMapStore()

  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 10], zoom: 1,
  })
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number; score?: number } | null>(null)

  function getFill(numId: string): string {
    const iso3 = NUM_TO_ISO3[numId]

    // Heatmap mode overrides everything
    if (heatmapIndicator !== 'none' && iso3) {
      const score = indicators[iso3]?.[heatmapIndicator]
      if (score !== undefined) return scoreToColor(score)
      return '#1a1f2e'
    }

    // Selected country
    if (iso3 && countryData?.id === iso3) return '#3b82f6'
    if (iso3 && compareData?.id === iso3) return '#8b5cf6'

    // Relationship highlight from selected country
    if (countryData && iso3) {
      const rel = countryData.relationships?.find(r => r.countryId === iso3)
      if (rel) {
        if (rel.sentiment === 'positive') return '#1d4ed8'
        if (rel.sentiment === 'negative') return '#7f1d1d'
        return '#78350f'
      }
    }

    // Has data — slightly lighter
    if (iso3 && indicators[iso3]) return '#131C30'

    return '#0C1220'
  }

  function handleMove(pos: { coordinates: [number, number]; zoom: number }) {
    setPosition(pos)
    setMapZoom(pos.zoom)
  }

  return (
    <div className="relative w-full h-full bg-[#070B14] overflow-hidden select-none">

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        {[
          { label: '+', action: () => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.6, 10) })) },
          { label: '−', action: () => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.6, 1) })) },
          { label: '⊙', action: () => { setPosition({ coordinates: [0, 10], zoom: 1 }); setMapZoom(1) } },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="w-7 h-7 bg-[#0E1525] hover:bg-[#151F35] text-slate-400 hover:text-white rounded-md text-sm font-bold flex items-center justify-center border border-[#1E2D4A] transition-colors"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      {heatmapIndicator === 'none' && (
        <div className="absolute bottom-4 left-3 z-10 bg-[#0E1525]/90 rounded-lg p-2.5 border border-[#1E2D4A] text-xs space-y-1.5">
          {[
            { color: '#3b82f6', label: 'Selected' },
            { color: '#8b5cf6', label: 'Compare' },
            { color: '#1d4ed8', label: 'Ally' },
            { color: '#78350f', label: 'Neutral rel.' },
            { color: '#7f1d1d', label: 'Rival' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              <span className="text-slate-500">{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-[#0E1525] border border-[#1E2D4A] text-xs text-white px-2.5 py-1.5 rounded-lg pointer-events-none shadow-xl"
          style={{ left: tooltip.x + 14, top: tooltip.y - 32 }}
        >
          <span className="font-medium">{tooltip.name}</span>
          {tooltip.score !== undefined && (
            <span className="ml-2 text-slate-400">{tooltip.score}/10</span>
          )}
        </div>
      )}

      <ComposableMap projection="geoMercator" style={{ width: '100%', height: '100%' }} projectionConfig={{ scale: 130 }}>
        <ZoomableGroup zoom={position.zoom} center={position.coordinates} onMoveEnd={handleMove}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const iso3 = NUM_TO_ISO3[geo.id]
                const score = heatmapIndicator !== 'none' && iso3
                  ? indicators[iso3]?.[heatmapIndicator]
                  : undefined

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getFill(geo.id)}
                    stroke="#070B14"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: '#2563eb', cursor: 'pointer' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={(e: React.MouseEvent) => {
                      setTooltip({ name: geo.properties.name, x: e.clientX, y: e.clientY, score })
                    }}
                    onMouseMove={(e: React.MouseEvent) => {
                      setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() => {
                      setTooltip(null)
                      if (iso3) selectCountry(iso3)
                    }}
                  />
                )
              })
            }
          </Geographies>

          <TradeRouteLayer showRoutes={showTradeRoutes} showChokepoints={showChokepoints} zoom={position.zoom} />
          {showConflicts && <ConflictZoneLayer zoom={position.zoom} />}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  )
}
