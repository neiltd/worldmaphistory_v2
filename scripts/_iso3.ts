// ISO 3166-1 alpha-3 country codes — used by validation pipeline
// Source: ISO 3166 Maintenance Agency
export const ISO3_CODES = new Set([
  'AFG','ALB','DZA','AND','AGO','ATG','ARG','ARM','AUS','AUT','AZE',
  'BHS','BHR','BGD','BRB','BLR','BEL','BLZ','BEN','BTN','BOL','BIH',
  'BWA','BRA','BRN','BGR','BFA','BDI','CPV','KHM','CMR','CAN','CAF',
  'TCD','CHL','CHN','COL','COM','COG','COD','CRI','CIV','HRV','CUB',
  'CYP','CZE','DNK','DJI','DOM','ECU','EGY','SLV','GNQ','ERI','EST',
  'SWZ','ETH','FJI','FIN','FRA','GAB','GMB','GEO','DEU','GHA','GRC',
  'GRD','GTM','GIN','GNB','GUY','HTI','HND','HUN','ISL','IND','IDN',
  'IRN','IRQ','IRL','ISR','ITA','JAM','JPN','JOR','KAZ','KEN','KIR',
  'PRK','KOR','KWT','KGZ','LAO','LVA','LBN','LSO','LBR','LBY','LIE',
  'LTU','LUX','MDG','MWI','MYS','MDV','MLI','MLT','MHL','MRT','MUS',
  'MEX','FSM','MDA','MCO','MNG','MNE','MAR','MOZ','MMR','NAM','NRU',
  'NPL','NLD','NZL','NIC','NER','NGA','MKD','NOR','OMN','PAK','PLW',
  'PAN','PNG','PRY','PER','PHL','POL','PRT','QAT','ROU','RUS','RWA',
  'KNA','LCA','VCT','WSM','SMR','STP','SAU','SEN','SRB','SLE','SGP',
  'SVK','SVN','SLB','SOM','ZAF','SSD','ESP','LKA','SDN','SUR','SWE',
  'CHE','SYR','TWN','TJK','TZA','THA','TLS','TGO','TON','TTO','TUN',
  'TUR','TKM','TUV','UGA','UKR','ARE','GBR','USA','URY','UZB','VUT',
  'VEN','VNM','YEM','ZMB','ZWE','PSE','XKX',
])

export function isValidISO3(code: string): boolean {
  return ISO3_CODES.has(code.toUpperCase())
}

export function normalizeISO3(code: string): string {
  return code.toUpperCase().trim()
}
