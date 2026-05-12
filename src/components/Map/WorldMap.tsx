import { useState, useEffect, useMemo, useCallback } from 'react'
import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre'
import type { MapMouseEvent, MapEvent } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
// @ts-expect-error topojson-client has no bundled types
import * as topojson from 'topojson-client'
import { useMapStore } from '../../store/useMapStore'
import indicatorsIndex from '../../data/indicators-index.json'
import ConflictZoneLayer from '../../layers/geopolitical/ConflictZoneLayer'
import TradeRouteLayer   from '../../layers/economic/TradeRouteLayer'
import AirportLayer      from '../../layers/infrastructure/AirportLayer'
import PortLayer         from '../../layers/infrastructure/PortLayer'
import PowerLayer        from '../../layers/utilities/PowerLayer'
import RailHubLayer      from '../../layers/infrastructure/RailHubLayer'
import { fixFeatureCollection } from '../../utils/geoUtils'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

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

type IndicatorsMap = Record<string, Record<string, number>>
const allIndicators = indicatorsIndex as IndicatorsMap

function scoreToColor(score: number): string {
  const t = (score - 1) / 9
  if (t < 0.5) {
    const u = t * 2
    return `rgb(${Math.round(220 + (217 - 220) * u)},${Math.round(38 + (119 - 38) * u)},38)`
  }
  const u = (t - 0.5) * 2
  return `rgb(${Math.round(217 + (22 - 217) * u)},${Math.round(119 + (163 - 119) * u)},${Math.round(6 + (74 - 6) * u)})`
}

type TooltipState = {
  kind: 'country'
  name: string; score?: number; x: number; y: number
} | {
  kind: 'route'
  name: string; from: string; to: string; goods: string; value: string; risk: string
  x: number; y: number
}

export default function WorldMap() {
  const {
    countryData, compareData, selectCountry,
    showConflicts, showTradeRoutes, showChokepoints,
    heatmapIndicator, isLayerVisible,
  } = useMapStore()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [countriesGeo, setCountriesGeo] = useState<any>(null)
  const [labelLayerId, setLabelLayerId] = useState<string | undefined>()
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  // Fetch + convert topojson → GeoJSON once on mount
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}countries-110m.json`)
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((topo: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const geo = topojson.feature(topo, topo.objects.countries) as any
        // Fix antimeridian crossings in country polygons (e.g. Fiji, Russia, USA/Alaska)
        const fixed = fixFeatureCollection(geo)
        setCountriesGeo({
          ...fixed,
          features: fixed.features.map((f: any) => ({
            ...f,
            properties: {
              numId: String(f.id),
              iso3: NUM_TO_ISO3[String(f.id)] ?? null,
              name: f.properties?.name ?? '',
            },
          })),
        })
      })
  }, [])

  // Find first symbol layer in style to insert fills underneath labels
  function handleMapLoad(e: MapEvent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layers = (e.target.getStyle().layers ?? []) as any[]
    const first = layers.find((l: any) => l.type === 'symbol')
    setLabelLayerId(first?.id)
  }

  // Compute per-country fill color, stored as a GeoJSON property
  const geoWithColors = useMemo(() => {
    if (!countriesGeo) return null

    const relMap: Record<string, string> = {}
    if (countryData) {
      for (const rel of countryData.relationships ?? []) {
        if (rel.sentiment === 'positive') relMap[rel.countryId] = '#1e3a8a'
        else if (rel.sentiment === 'negative') relMap[rel.countryId] = '#7f1d1d'
        else relMap[rel.countryId] = '#78350f'
      }
    }

    return {
      ...countriesGeo,
      features: countriesGeo.features.map((f: any) => {
        const iso3: string | null = f.properties?.iso3
        let color = '#0C1220'

        if (heatmapIndicator !== 'none' && iso3) {
          const score = allIndicators[iso3]?.[heatmapIndicator]
          color = score !== undefined ? scoreToColor(score) : '#1a1f2e'
        } else if (iso3 === countryData?.id) {
          color = '#2563eb'
        } else if (iso3 === compareData?.id) {
          color = '#8b5cf6'
        } else if (iso3 && relMap[iso3]) {
          color = relMap[iso3]
        } else if (iso3 && allIndicators[iso3]) {
          color = '#131C30'
        }

        return { ...f, properties: { ...f.properties, color } }
      }),
    }
  }, [countriesGeo, countryData, compareData, heatmapIndicator])

  const interactiveIds = useMemo(() => {
    const ids = ['countries-fill']
    if (showTradeRoutes) ids.push('trade-routes-line')
    return ids
  }, [showTradeRoutes])

  const handleMouseMove = useCallback((e: MapMouseEvent) => {
    const f = e.features?.[0]
    if (!f) { setTooltip(null); return }

    if (f.layer.id === 'countries-fill') {
      const iso3 = f.properties?.iso3
      const score = heatmapIndicator !== 'none' && iso3
        ? allIndicators[iso3]?.[heatmapIndicator]
        : undefined
      setTooltip({ kind: 'country', name: f.properties?.name ?? '', score, x: e.point.x, y: e.point.y })
    } else if (f.layer.id === 'trade-routes-line') {
      setTooltip({
        kind: 'route',
        name: f.properties?.name ?? '',
        from: f.properties?.fromName ?? '',
        to: f.properties?.toName ?? '',
        goods: f.properties?.keyGoods ?? '',
        value: f.properties?.annualValue ?? '',
        risk: f.properties?.riskLevel ?? 'medium',
        x: e.point.x,
        y: e.point.y,
      })
    }
  }, [heatmapIndicator])

  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  const handleClick = useCallback((e: MapMouseEvent) => {
    const f = e.features?.[0]
    if (!f) return
    if (f.layer.id === 'countries-fill') {
      const iso3 = f.properties?.iso3
      if (iso3) selectCountry(iso3)
    }
  }, [selectCountry])

  const RISK_COLOR: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' }

  return (
    <div className="relative w-full h-full">
      <Map
        mapStyle={MAP_STYLE}
        initialViewState={{ longitude: 0, latitude: 10, zoom: 1.5 }}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={interactiveIds}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onLoad={handleMapLoad}
      >
        {/* Country fill layer — inserted before tile labels */}
        {geoWithColors && (
          <Source id="countries" type="geojson" data={geoWithColors} generateId>
            <Layer
              id="countries-fill"
              type="fill"
              beforeId={labelLayerId}
              paint={{
                'fill-color': ['get', 'color'],
                'fill-opacity': 0.82,
              }}
            />
          </Source>
        )}

        <ConflictZoneLayer visible={showConflicts} labelLayerId={labelLayerId} />
        <TradeRouteLayer visible={showTradeRoutes} showChokepoints={showChokepoints} labelLayerId={labelLayerId} />
        <AirportLayer visible={isLayerVisible('airports')} />
        <PortLayer    visible={isLayerVisible('seaports')} />
        <PowerLayer   visible={isLayerVisible('power-plants')} />
        <RailHubLayer visible={isLayerVisible('rail-hubs')} />

        <NavigationControl position="top-right" showCompass={false} />
      </Map>

      {/* Legend */}
      {heatmapIndicator === 'none' && (
        <div className="absolute bottom-4 left-3 z-10 rounded-lg p-2.5 border text-xs space-y-1.5"
          style={{ background: '#0E1525CC', borderColor: '#1E2D4A' }}>
          {[
            { color: '#2563eb', label: 'Selected' },
            { color: '#8b5cf6', label: 'Compare' },
            { color: '#1e3a8a', label: 'Ally' },
            { color: '#78350f', label: 'Neutral' },
            { color: '#7f1d1d', label: 'Rival' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              <span className="text-slate-500">{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Heatmap legend */}
      {heatmapIndicator !== 'none' && (
        <div className="absolute bottom-4 left-3 z-10 rounded-lg p-2.5 border text-xs"
          style={{ background: '#0E1525CC', borderColor: '#1E2D4A' }}>
          <div className="w-32 h-2 rounded-full mb-1"
            style={{ background: 'linear-gradient(to right, #dc2626, #d97706, #16a34a)' }} />
          <div className="flex justify-between text-slate-500">
            <span>Low 1</span><span>High 10</span>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50"
          style={{ left: tooltip.x + 14, top: tooltip.y - 36 }}
        >
          <div className="rounded-lg shadow-xl border text-xs" style={{ background: '#0E1525', borderColor: '#1E2D4A' }}>
            {tooltip.kind === 'country' ? (
              <div className="px-2.5 py-1.5">
                <span className="font-medium text-white">{tooltip.name}</span>
                {tooltip.score !== undefined && (
                  <span className="ml-2 text-slate-400">{tooltip.score.toFixed(1)}/10</span>
                )}
              </div>
            ) : (
              <div className="px-3 py-2 space-y-1 max-w-52">
                <p className="font-semibold text-white">{tooltip.name}</p>
                <p className="text-slate-400">{tooltip.from} → {tooltip.to}</p>
                <p className="text-slate-500">{tooltip.goods}</p>
                <p className="text-slate-400">
                  {tooltip.value} ·{' '}
                  <span style={{ color: RISK_COLOR[tooltip.risk] }}>{tooltip.risk} risk</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
