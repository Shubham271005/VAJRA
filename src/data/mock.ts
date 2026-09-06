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
 {id:1,severity:'HIGH',event:'Cloudburst',location:'Rudraprayag',prob:82,lead:'3 hrs',trigger:'IWV + CAPE',status:'ACTIVE'},
 {id:2,severity:'MODERATE',event:'Flash Flood',location:'Kedarnath Road',prob:67,lead:'4 hrs',trigger:'Rainfall + DEM',status:'MONITOR'},
 {id:3,severity:'HIGH',event:'Thunderstorm',location:'Village A',prob:91,lead:'2 hrs',trigger:'CAPE + CTT',status:'ACTIVE'},
 {id:4,severity:'WATCH',event:'Flash Flood',location:'Village B',prob:48,lead:'5 hrs',trigger:'Slope + runoff',status:'WATCH'}
]

export const places = [
 {id:'zone-high',name:'Village A',lat:30.393,long:79.070,hazard:'Cloudburst' as Hazard,prob:82,level:'HIGH' as RiskLevel,lead:'3 hrs',signals:'IWV surge + CAPE increase'},
 {id:'zone-mod',name:'Kedarnath Road',lat:30.352,long:79.060,hazard:'Flash Flood' as Hazard,prob:67,level:'MODERATE' as RiskLevel,lead:'4 hrs',signals:'Rainfall + DEM runoff'},
 {id:'zone-watch',name:'Village B',lat:30.420,long:79.120,hazard:'Thunderstorm' as Hazard,prob:48,level:'WATCH' as RiskLevel,lead:'5 hrs',signals:'CAPE + CTT cooling'},
 {id:'town',name:'Rudraprayag Control Zone',lat:30.285,long:78.981,hazard:'Cloudburst' as Hazard,prob:74,level:'MODERATE' as RiskLevel,lead:'2 hrs',signals:'IWV + convergence'}
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
