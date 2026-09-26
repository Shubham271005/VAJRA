export type Hazard = 'Cloudburst' | 'Flash Flood' | 'Thunderstorm'
export type RiskLevel = 'HIGH' | 'MODERATE' | 'WATCH'

export const forecast = [
  { hour: 0, label: 'NOW', cloudburst: 52, flood: 43, storm: 68 },
  { hour: 1, label: '+1 HR', cloudburst: 61, flood: 51, storm: 77 },
  { hour: 2, label: '+2 HR', cloudburst: 74, flood: 62, storm: 87 },
  { hour: 3, label: '+3 HR', cloudburst: 82, flood: 67, storm: 91 },
  { hour: 4, label: '+4 HR', cloudburst: 77, flood: 64, storm: 84 },
  { hour: 5, label: '+5 HR', cloudburst: 63, flood: 55, storm: 72 },
  { hour: 6, label: '+6 HR', cloudburst: 48, flood: 44, storm: 58 }
]

export const signals = [
  { key:'IWV', name:'Integrated Water Vapour', value: 42.8, unit:'kg/m²', trend:'+34%', status:'RISING', series:[34,35,36,37,39,41,42.8] },
  { key:'CAPE', name:'Convective Available Potential Energy', value: 2140, unit:'J/kg', trend:'+18%', status:'HIGH', series:[1680,1750,1810,1900,1990,2070,2140] },
  { key:'CIN', name:'Convective Inhibition', value: 34, unit:'J/kg', trend:'-29%', status:'DECREASING', series:[55,51,48,44,41,37,34] },
  { key:'WCONV', name:'Low-level Wind Convergence', value: 8.7, unit:'10⁻⁴ s⁻¹', trend:'+21%', status:'HIGH', series:[5.5,6.1,6.4,7.0,7.5,8.2,8.7] },
  { key:'VWS', name:'Vertical Wind Shear', value: 19.4, unit:'m/s', trend:'+11%', status:'ELEVATED', series:[15,15.7,16.3,17.2,18.1,18.7,19.4] },
  { key:'CTT', name:'Cloud Top Temperature', value: -52, unit:'°C', trend:'-8°C', status:'COOLING', series:[-37,-39,-41,-43,-46,-49,-52] }
]

export const alerts = [
 { id: 1, locationId: 'kedarnath', district: 'Rudraprayag', elevation: '3,584 m', lat: 30.735, long: 79.067, severity: 'HIGH' as RiskLevel, event: 'Cloudburst' as Hazard, location: 'Kedarnath / Chorabari Sector', prob: 96, lead: '30 mins', trigger: 'Glaciated CTT -54°C + Peak Rain 48.7 mm/hr', status: 'ACTIVE' as const, actionRecommended: 'Issue immediate red alert and trigger shrine evacuation protocol.', protocol: 'SOP-RED-01 (Mandatory Valley Evacuation & Pilgrim Shelter Halt)', rainfall: 48.7, slope: '34°', timeDispatched: '06 SEP 2026 • 18:30 IST' },
 { id: 2, locationId: 'gaurikund', district: 'Rudraprayag', elevation: '1,982 m', lat: 30.652, long: 79.043, severity: 'HIGH' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Rambara - Gaurikund Gorge', prob: 92, lead: '1 hr', trigger: 'Peak Rain 67.2 mm/hr + Steep Slopes (38°)', status: 'ACTIVE' as const, actionRecommended: 'Immediately close Mandakini riverside pilgrim camps and stage SDRF rafts.', protocol: 'SOP-RED-02 (Riverfront Clearance, Highway Closure & Barrage Warning)', rainfall: 67.2, slope: '38°', timeDispatched: '06 SEP 2026 • 18:30 IST' },
 { id: 3, locationId: 'guptkashi', district: 'Rudraprayag', elevation: '1,319 m', lat: 30.523, long: 79.077, severity: 'HIGH' as RiskLevel, event: 'Thunderstorm' as Hazard, location: 'Guptkashi - Phata Ridge', prob: 88, lead: '1 hr', trigger: 'Thermodynamic CAPE 2480 J/kg + Strong Shear 28 m/s', status: 'ACTIVE' as const, actionRecommended: 'Warn power transmission grids and ground helicopter flights.', protocol: 'SOP-RED-03 (Severe Squall Alert & Heli-Yatra Flight Grounding)', rainfall: 32.5, slope: '18°', timeDispatched: '06 SEP 2026 • 18:30 IST' },
 { id: 4, locationId: 'rudraprayag', district: 'Rudraprayag', elevation: '890 m', lat: 30.285, long: 78.981, severity: 'HIGH' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Rudraprayag Control Zone', prob: 84, lead: '3 hrs', trigger: 'Hydrologic Flood Routing Surge Wave from Upper Mandakini', status: 'ACTIVE' as const, actionRecommended: 'Clear riverside ghats, sound sirens, and enforce riverfront buffer zone.', protocol: 'SOP-RED-02 (Riverfront Clearance, Highway Closure & Barrage Warning)', rainfall: 28.4, slope: '12°', timeDispatched: '06 SEP 2026 • 18:30 IST' },
 { id: 5, locationId: 'joshimath', district: 'Chamoli', elevation: '1,890 m', lat: 30.556, long: 79.566, severity: 'MODERATE' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Joshimath - Dhauliganga Valley', prob: 76, lead: '2 hrs', trigger: 'Steep orographic funneling + rapid stream catchment rise', status: 'MONITOR' as const, actionRecommended: 'Issue alert to downstream hydropower intakes and Tapovan barrages.', protocol: 'SOP-ORANGE-02 (Hydrological Watch & Low-Lying Ghat Barricading)', rainfall: 22.1, slope: '29°', timeDispatched: '06 SEP 2026 • 18:30 IST' },
 { id: 6, locationId: 'badrinath', district: 'Chamoli', elevation: '3,133 m', lat: 30.744, long: 79.493, severity: 'MODERATE' as RiskLevel, event: 'Cloudburst' as Hazard, location: 'Badrinath - Alaknanda Gorge', prob: 72, lead: '2 hrs', trigger: 'Convective cell locking against Nar-Narayan massifs', status: 'MONITOR' as const, actionRecommended: 'Halt pilgrim road movements along vulnerable scree slopes.', protocol: 'SOP-ORANGE-01 (Pre-position SDRF Teams & Catchment Surveillance)', rainfall: 24.3, slope: '31°', timeDispatched: '06 SEP 2026 • 18:30 IST' },
 { id: 7, locationId: 'gangotri', district: 'Uttarkashi', elevation: '3,100 m', lat: 30.994, long: 78.939, severity: 'MODERATE' as RiskLevel, event: 'Cloudburst' as Hazard, location: 'Gangotri - Bhagirathi Gorge', prob: 68, lead: '2 hrs', trigger: 'Upper tropospheric moisture convergence + glaciation', status: 'MONITOR' as const, actionRecommended: 'Pre-position emergency recovery equipment at high altitude outposts.', protocol: 'SOP-ORANGE-01 (Pre-position SDRF Teams & Catchment Surveillance)', rainfall: 19.8, slope: '27°', timeDispatched: '06 SEP 2026 • 18:30 IST' },
 { id: 8, locationId: 'dharchula', district: 'Pithoragarh', elevation: '915 m', lat: 29.845, long: 80.535, severity: 'MODERATE' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Dharchula - Kali River Border', prob: 65, lead: '3 hrs', trigger: 'Cross-border tributary catchment swell', status: 'MONITOR' as const, actionRecommended: 'Coordinate with irrigation barrages for controlled release warnings.', protocol: 'SOP-ORANGE-02 (Hydrological Watch & Low-Lying Ghat Barricading)', rainfall: 18.5, slope: '22°', timeDispatched: '06 SEP 2026 • 18:30 IST' },
 { id: 9, locationId: 'mussoorie', district: 'Dehradun', elevation: '2,005 m', lat: 30.459, long: 78.066, severity: 'WATCH' as RiskLevel, event: 'Thunderstorm' as Hazard, location: 'Mussoorie - First Ridge Line', prob: 54, lead: '3 hrs', trigger: 'Orographic squall line development along southern ridge', status: 'WATCH' as const, actionRecommended: 'Broadcast lightning warnings for high ridge lookouts.', protocol: 'SOP-ORANGE-03 (Power Substation Isolation & Ridge Staging)', rainfall: 12.0, slope: '25°', timeDispatched: '06 SEP 2026 • 18:30 IST' },
 { id: 10, locationId: 'nainital_lake', district: 'Nainital', elevation: '2,084 m', lat: 29.391, long: 79.454, severity: 'WATCH' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Nainital - Lake Catchment Basin', prob: 48, lead: '4 hrs', trigger: 'Sustained rain-gauge accumulation over lake drainage', status: 'WATCH' as const, actionRecommended: 'Monitor lake sluice level gates and lower catchment nullahs.', protocol: 'SOP-ORANGE-02 (Hydrological Watch & Low-Lying Ghat Barricading)', rainfall: 11.2, slope: '19°', timeDispatched: '06 SEP 2026 • 18:30 IST' },
 { id: 11, locationId: 'almora_town', district: 'Almora', elevation: '1,638 m', lat: 29.597, long: 79.659, severity: 'WATCH' as RiskLevel, event: 'Thunderstorm' as Hazard, location: 'Almora - Kumaon Central Ridge', prob: 42, lead: '3 hrs', trigger: 'Thermal updraft triggering isolated convective lightning', status: 'WATCH' as const, actionRecommended: 'Maintain standard regional emergency operations watch.', protocol: 'SOP-ORANGE-03 (Power Substation Isolation & Ridge Staging)', rainfall: 9.6, slope: '14°', timeDispatched: '06 SEP 2026 • 18:30 IST' },
 { id: 12, locationId: 'rishikesh', district: 'Dehradun', elevation: '372 m', lat: 30.087, long: 78.268, severity: 'WATCH' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Rishikesh - Ganga Gorge Outflow', prob: 38, lead: '5 hrs', trigger: 'Integrated Ganga confluence discharge downstream propagation', status: 'WATCH' as const, actionRecommended: 'Maintain loudspeaker alerts for riverbed ghats and rafting transit nodes.', protocol: 'SOP-ORANGE-02 (Hydrological Watch & Low-Lying Ghat Barricading)', rainfall: 8.5, slope: '6°', timeDispatched: '06 SEP 2026 • 18:30 IST' }
]

export const places = [
 {id:'kedarnath',name:'Kedarnath / Chorabari Sector',lat:30.735,long:79.067,hazard:'Cloudburst' as Hazard,prob:88,level:'HIGH' as RiskLevel,lead:'1 hr',signals:'Glaciated CTT -43°C + Peak Rain 45.7 mm/hr'},
 {id:'gaurikund',name:'Rambara - Gaurikund Gorge',lat:30.652,long:79.043,hazard:'Flash Flood' as Hazard,prob:88,level:'HIGH' as RiskLevel,lead:'2 hrs',signals:'Peak Rain 67.2 mm/hr + Steep Slopes (38°)'},
 {id:'guptkashi',name:'Guptkashi - Phata Ridge',lat:30.523,long:79.077,hazard:'Thunderstorm' as Hazard,prob:84,level:'HIGH' as RiskLevel,lead:'1 hr',signals:'Thermodynamic CAPE 2480 J/kg + Strong Shear'},
 {id:'rudraprayag',name:'Rudraprayag Control Zone',lat:30.285,long:78.981,hazard:'Flash Flood' as Hazard,prob:82,level:'HIGH' as RiskLevel,lead:'4 hrs',signals:'Hydrologic Flood Routing Surge Wave'}
]

export const pipeline = [
 ['INSAT Satellite','IWV, cloud-top temperature and precipitation-linked observations.'],
 ['IMDAA Reanalysis','CAPE, CIN, humidity and wind fields provide atmospheric context.'],
 ['DEM / Terrain','Elevation, slope and drainage behavior shape downstream flood exposure.'],
 ['Preprocessing & Fusion','Align observations into a common spatiotemporal grid.'],
 ['Transformer + ConvLSTM','Proposed model learns temporal evolution and local spatial structure.'],
 ['Multi-Task Prediction','Jointly estimates thunderstorm, cloudburst and flash-flood risk.'],
 ['Probability Risk Map','Converts model scores into interpretable grid-based hazard layers.'],
 ['DEM Flood Overlay','Prioritizes terrain-connected flow paths and exposed locations.'],
 ['Explainable Alert','Bundles probabilities, lead time, trigger signals and actions.']
] as const
