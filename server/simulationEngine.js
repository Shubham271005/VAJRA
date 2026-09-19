// 3 Deterministic simulation states that accurately mimic convective lifecycle in the Himalayas
const SCENARIOS = [
  {
    id: 'stage-1-approaching',
    name: 'Convective Initiation & Pre-Burst Convergence',
    simulatedTimestamp: '06 SEP 2026 • 18:30 IST',
    forecast: [
      { hour: 0, label: 'NOW', cloudburst: 52, flood: 43, storm: 68 },
      { hour: 1, label: '+1 HR', cloudburst: 61, flood: 51, storm: 77 },
      { hour: 2, label: '+2 HR', cloudburst: 74, flood: 62, storm: 87 },
      { hour: 3, label: '+3 HR', cloudburst: 82, flood: 67, storm: 91 },
      { hour: 4, label: '+4 HR', cloudburst: 77, flood: 64, storm: 84 },
      { hour: 5, label: '+5 HR', cloudburst: 63, flood: 55, storm: 72 },
      { hour: 6, label: '+6 HR', cloudburst: 48, flood: 44, storm: 58 }
    ],
    signals: [
      { key: 'IWV', name: 'Integrated Water Vapour', value: 42.8, unit: 'kg/m²', trend: '+34%', status: 'RISING', series: [34, 35, 36, 37, 39, 41, 42.8] },
      { key: 'CAPE', name: 'Convective Available Potential Energy', value: 2140, unit: 'J/kg', trend: '+18%', status: 'HIGH', series: [1680, 1750, 1810, 1900, 1990, 2070, 2140] },
      { key: 'CIN', name: 'Convective Inhibition', value: 34, unit: 'J/kg', trend: '-29%', status: 'DECREASING', series: [55, 51, 48, 44, 41, 37, 34] },
      { key: 'WCONV', name: 'Low-level Wind Convergence', value: 8.7, unit: '10⁻⁴ s⁻¹', trend: '+21%', status: 'HIGH', series: [5.5, 6.1, 6.4, 7.0, 7.5, 8.2, 8.7] },
      { key: 'VWS', name: 'Vertical Wind Shear', value: 19.4, unit: 'm/s', trend: '+11%', status: 'ELEVATED', series: [15, 15.7, 16.3, 17.2, 18.1, 18.7, 19.4] },
      { key: 'CTT', name: 'Cloud Top Temperature', value: -52, unit: '°C', trend: '-8°C', status: 'COOLING', series: [-37, -39, -41, -43, -46, -49, -52] }
    ],
    places: [
      { id: 'zone-high', name: 'Village A (Ridge)', lat: 30.393, long: 79.070, hazard: 'Cloudburst', prob: 82, level: 'HIGH', lead: '3 hrs', signals: 'IWV surge + CAPE increase' },
      { id: 'zone-mod', name: 'Kedarnath Road', lat: 30.352, long: 79.060, hazard: 'Flash Flood', prob: 67, level: 'MODERATE', lead: '4 hrs', signals: 'Rainfall + DEM runoff' },
      { id: 'zone-watch', name: 'Village B', lat: 30.420, long: 79.120, hazard: 'Thunderstorm', prob: 48, level: 'WATCH', lead: '5 hrs', signals: 'CAPE + CTT cooling' },
      { id: 'town', name: 'Rudraprayag Control Zone', lat: 30.285, long: 78.981, hazard: 'Cloudburst', prob: 74, level: 'MODERATE', lead: '2 hrs', signals: 'IWV + convergence' }
    ],
    centers: [
      { lat: 30.393, long: 79.07, r: 0.045, level: 'HIGH', hazard: 'Cloudburst' },
      { lat: 30.352, long: 79.06, r: 0.035, level: 'MODERATE', hazard: 'Flash Flood' },
      { lat: 30.42, long: 79.12, r: 0.032, level: 'WATCH', hazard: 'Thunderstorm' },
      { lat: 30.285, long: 78.981, r: 0.025, level: 'MODERATE', hazard: 'Cloudburst' }
    ],
    alerts: [
      { id: 1, severity: 'HIGH', event: 'Cloudburst', location: 'Rudraprayag District', prob: 82, lead: '3 hrs', trigger: 'IWV + CAPE', status: 'ACTIVE', actionRecommended: 'Pre-position SDRF search teams and notify downstream outposts' },
      { id: 2, severity: 'MODERATE', event: 'Flash Flood', location: 'Kedarnath Road Corridor', prob: 67, lead: '4 hrs', trigger: 'Rainfall + DEM runoff', status: 'MONITOR', actionRecommended: 'Halt vehicular traffic across vulnerable culverts' },
      { id: 3, severity: 'HIGH', event: 'Thunderstorm', location: 'Village A Ridge Sector', prob: 91, lead: '2 hrs', trigger: 'CAPE + CTT', status: 'ACTIVE', actionRecommended: 'Broadcast lightning safety sirens across panchayat units' },
      { id: 4, severity: 'WATCH', event: 'Flash Flood', location: 'Village B Catchment', prob: 48, lead: '5 hrs', trigger: 'Slope + runoff', status: 'WATCH', actionRecommended: 'Monitor automatic river-level sensors along Mandakini feeder' }
    ],
    explainability: {
      summary: 'Deep convective cell approaching Rudraprayag district with severe moisture pooling and rapid cloud top glaciation.',
      rows: [
        ['IWV surge detected', '+34% over recent observation window', 'Strong contribution'],
        ['CAPE increasing', 'Convective instability rising above 2,100 J/kg', 'Strong contribution'],
        ['CIN weakening', 'Convective inhibition eroded to 34 J/kg', 'Moderate contribution'],
        ['Low-level wind convergence', 'Orographic forcing along Mandakini valley', 'Moderate contribution'],
        ['Cloud Top Temperature', 'Rapid cloud development signal (dropped to -52°C)', 'Strong contribution']
      ],
      overallConfidence: 'HIGH',
      confidenceScore: 88,
      hazardSplit: {
        cloudburst: 'HIGH (82%)',
        flood: 'MODERATE-HIGH (67%)',
        storm: 'HIGH (91%)'
      }
    }
  },
  {
    id: 'stage-2-intensifying',
    name: 'Peak Orographic Burst & Severe Convection',
    simulatedTimestamp: '06 SEP 2026 • 19:15 IST',
    forecast: [
      { hour: 0, label: 'NOW', cloudburst: 76, flood: 58, storm: 88 },
      { hour: 1, label: '+1 HR', cloudburst: 89, flood: 74, storm: 95 },
      { hour: 2, label: '+2 HR', cloudburst: 93, flood: 85, storm: 92 },
      { hour: 3, label: '+3 HR', cloudburst: 86, flood: 89, storm: 79 },
      { hour: 4, label: '+4 HR', cloudburst: 71, flood: 82, storm: 66 },
      { hour: 5, label: '+5 HR', cloudburst: 55, flood: 70, storm: 51 },
      { hour: 6, label: '+6 HR', cloudburst: 39, flood: 56, storm: 40 }
    ],
    signals: [
      { key: 'IWV', name: 'Integrated Water Vapour', value: 47.4, unit: 'kg/m²', trend: '+45%', status: 'RISING', series: [36, 38, 40, 42, 44, 46, 47.4] },
      { key: 'CAPE', name: 'Convective Available Potential Energy', value: 2480, unit: 'J/kg', trend: '+32%', status: 'HIGH', series: [1800, 1920, 2050, 2180, 2300, 2410, 2480] },
      { key: 'CIN', name: 'Convective Inhibition', value: 18, unit: 'J/kg', trend: '-58%', status: 'DECREASING', series: [48, 42, 36, 30, 25, 21, 18] },
      { key: 'WCONV', name: 'Low-level Wind Convergence', value: 11.4, unit: '10⁻⁴ s⁻¹', trend: '+42%', status: 'HIGH', series: [6.8, 7.5, 8.4, 9.2, 10.1, 10.8, 11.4] },
      { key: 'VWS', name: 'Vertical Wind Shear', value: 22.8, unit: 'm/s', trend: '+24%', status: 'ELEVATED', series: [16.5, 17.4, 18.6, 19.8, 21.0, 21.9, 22.8] },
      { key: 'CTT', name: 'Cloud Top Temperature', value: -64, unit: '°C', trend: '-16°C', status: 'COOLING', series: [-42, -46, -50, -54, -58, -61, -64] }
    ],
    places: [
      { id: 'zone-high', name: 'Village A (Ridge)', lat: 30.393, long: 79.070, hazard: 'Cloudburst', prob: 93, level: 'HIGH', lead: '1 hr', signals: 'Severe CTT cooling (-64°C) + IWV 47.4' },
      { id: 'zone-mod', name: 'Kedarnath Road', lat: 30.352, long: 79.060, hazard: 'Flash Flood', prob: 85, level: 'HIGH', lead: '2 hrs', signals: 'Steep slope convergence + intense rainfall' },
      { id: 'zone-watch', name: 'Village B', lat: 30.420, long: 79.120, hazard: 'Thunderstorm', prob: 79, level: 'HIGH', lead: '1 hr', signals: 'High CAPE + extreme lightning signature' },
      { id: 'town', name: 'Rudraprayag Control Zone', lat: 30.285, long: 78.981, hazard: 'Cloudburst', prob: 84, level: 'HIGH', lead: '2 hrs', signals: 'Moisture pooling + downstream runoff' }
    ],
    centers: [
      { lat: 30.393, long: 79.07, r: 0.058, level: 'HIGH', hazard: 'Cloudburst' },
      { lat: 30.352, long: 79.06, r: 0.048, level: 'HIGH', hazard: 'Flash Flood' },
      { lat: 30.42, long: 79.12, r: 0.042, level: 'HIGH', hazard: 'Thunderstorm' },
      { lat: 30.285, long: 78.981, r: 0.038, level: 'HIGH', hazard: 'Cloudburst' }
    ],
    alerts: [
      { id: 1, severity: 'HIGH', event: 'Cloudburst', location: 'Village A Ridge Sector', prob: 93, lead: '1 hr', trigger: 'Extreme CTT + IWV Surge', status: 'ACTIVE', actionRecommended: 'Issue immediate red alert and trigger village evacuation protocol' },
      { id: 2, severity: 'HIGH', event: 'Flash Flood', location: 'Kedarnath Road Corridor', prob: 85, lead: '2 hrs', trigger: 'Saturated Soil + DEM Runoff', status: 'ACTIVE', actionRecommended: 'Immediately close Mandakini riverside pilgrim camps' },
      { id: 3, severity: 'HIGH', event: 'Thunderstorm', location: 'Village B Catchment', prob: 79, lead: '1 hr', trigger: 'CAPE 2480 J/kg + Strong Shear', status: 'ACTIVE', actionRecommended: 'Warn power transmission grids and high-altitude shelters' },
      { id: 4, severity: 'HIGH', event: 'Flash Flood', location: 'Rudraprayag Confluence', prob: 78, lead: '3 hrs', trigger: 'Hydro-routed upstream surge', status: 'ACTIVE', actionRecommended: 'Clear riverside ghats and low-lying market stalls' }
    ],
    explainability: {
      summary: 'Atmospheric instability reached peak threshold. Severe convective cell locked into Mandakini valley orographic chimney.',
      rows: [
        ['Extreme CTT glaciation', 'Overshooting tops detected at -64°C by INSAT TIR1', 'Strong contribution'],
        ['Moisture convergence maximum', 'Low-level convergence spiked to 11.4 x 10⁻⁴ s⁻¹', 'Strong contribution'],
        ['CAPE super-instability', 'CAPE exceeds 2,400 J/kg with complete CIN erosion', 'Strong contribution'],
        ['Steep DEM runoff amplification', 'SRTM slope > 35° accelerates flash flood transition', 'Strong contribution'],
        ['VWS maintenance', 'Shear maintains organized multicellular storm structure', 'Moderate contribution']
      ],
      overallConfidence: 'VERY HIGH',
      confidenceScore: 94,
      hazardSplit: {
        cloudburst: 'CRITICAL (93%)',
        flood: 'HIGH (85%)',
        storm: 'VERY HIGH (95%)'
      }
    }
  },
  {
    id: 'stage-3-drainage',
    name: 'Post-Burst Runoff & Hydrological Routing Phase',
    simulatedTimestamp: '06 SEP 2026 • 20:00 IST',
    forecast: [
      { hour: 0, label: 'NOW', cloudburst: 65, flood: 86, storm: 62 },
      { hour: 1, label: '+1 HR', cloudburst: 51, flood: 91, storm: 49 },
      { hour: 2, label: '+2 HR', cloudburst: 42, flood: 88, storm: 38 },
      { hour: 3, label: '+3 HR', cloudburst: 34, flood: 79, storm: 30 },
      { hour: 4, label: '+4 HR', cloudburst: 28, flood: 68, storm: 24 },
      { hour: 5, label: '+5 HR', cloudburst: 22, flood: 54, storm: 19 },
      { hour: 6, label: '+6 HR', cloudburst: 18, flood: 41, storm: 15 }
    ],
    signals: [
      { key: 'IWV', name: 'Integrated Water Vapour', value: 39.2, unit: 'kg/m²', trend: '-12%', status: 'DECREASING', series: [47, 46, 44, 43, 41, 40, 39.2] },
      { key: 'CAPE', name: 'Convective Available Potential Energy', value: 1620, unit: 'J/kg', trend: '-28%', status: 'DECREASING', series: [2400, 2250, 2100, 1950, 1800, 1710, 1620] },
      { key: 'CIN', name: 'Convective Inhibition', value: 62, unit: 'J/kg', trend: '+45%', status: 'RISING', series: [20, 26, 33, 41, 49, 56, 62] },
      { key: 'WCONV', name: 'Low-level Wind Convergence', value: 5.2, unit: '10⁻⁴ s⁻¹', trend: '-38%', status: 'DECREASING', series: [11.0, 9.8, 8.7, 7.6, 6.7, 5.9, 5.2] },
      { key: 'VWS', name: 'Vertical Wind Shear', value: 17.1, unit: 'm/s', trend: '-14%', status: 'ELEVATED', series: [22, 21.2, 20.3, 19.4, 18.5, 17.8, 17.1] },
      { key: 'CTT', name: 'Cloud Top Temperature', value: -41, unit: '°C', trend: '+14°C', status: 'WARMING', series: [-62, -58, -53, -49, -46, -43, -41] }
    ],
    places: [
      { id: 'zone-high', name: 'Village A (Ridge)', lat: 30.393, long: 79.070, hazard: 'Flash Flood', prob: 74, level: 'MODERATE', lead: '1 hr', signals: 'Runoff draining to valley' },
      { id: 'zone-mod', name: 'Kedarnath Road', lat: 30.352, long: 79.060, hazard: 'Flash Flood', prob: 91, level: 'HIGH', lead: '1 hr', signals: 'Peak river channel swelling + debris hazard' },
      { id: 'zone-watch', name: 'Village B', lat: 30.420, long: 79.120, hazard: 'Cloudburst', prob: 42, level: 'WATCH', lead: '3 hrs', signals: 'Cell decaying, stratiform rain' },
      { id: 'town', name: 'Rudraprayag Control Zone', lat: 30.285, long: 78.981, hazard: 'Flash Flood', prob: 88, level: 'HIGH', lead: '2 hrs', signals: 'Mandakini surge reaching confluence' }
    ],
    centers: [
      { lat: 30.352, long: 79.06, r: 0.060, level: 'HIGH', hazard: 'Flash Flood' },
      { lat: 30.285, long: 78.981, r: 0.052, level: 'HIGH', hazard: 'Flash Flood' },
      { lat: 30.393, long: 79.07, r: 0.038, level: 'MODERATE', hazard: 'Cloudburst' },
      { lat: 30.42, long: 79.12, r: 0.024, level: 'WATCH', hazard: 'Thunderstorm' }
    ],
    alerts: [
      { id: 2, severity: 'HIGH', event: 'Flash Flood', location: 'Kedarnath Road Corridor', prob: 91, lead: '1 hr', trigger: 'Channel Swell + Debris Flow', status: 'ACTIVE', actionRecommended: 'Maintain total vehicular closure and initiate bank reinforcements' },
      { id: 4, severity: 'HIGH', event: 'Flash Flood', location: 'Rudraprayag Confluence', prob: 88, lead: '2 hrs', trigger: 'Hydro-routed upstream surge', status: 'ACTIVE', actionRecommended: 'Sound siren at confluence ghats and enforce riverfront buffer zone' },
      { id: 1, severity: 'MODERATE', event: 'Cloudburst', location: 'Village A Ridge Sector', prob: 51, lead: '2 hrs', trigger: 'Stratiform transition', status: 'MONITOR', actionRecommended: 'Assess ridge slope stabilization and cleared drainage paths' },
      { id: 3, severity: 'WATCH', event: 'Thunderstorm', location: 'Village B Catchment', prob: 38, lead: '3 hrs', trigger: 'Dissipating storm cell', status: 'WATCH', actionRecommended: 'Resume normal vigilance standby' }
    ],
    explainability: {
      summary: 'Atmospheric convective engine is relaxing as instability is exhausted. Threat shifts heavily to DEM-directed hydrological flood routing.',
      rows: [
        ['Hydrological lag in effect', 'Precipitation volume routing through Mandakini riverbed', 'Strong contribution'],
        ['DEM slope flow accumulation', 'Steep topography (SRTM 30m) channels mountain runoff downstream', 'Strong contribution'],
        ['Atmospheric CIN rebuilding', 'Convective inhibition rose to 62 J/kg, suppressing new cells', 'Moderate contribution'],
        ['Cloud Top Warming', 'CTT warmed to -41°C, indicating anvil dissipation', 'Moderate contribution'],
        ['Soil moisture saturation', 'Antecedent moisture index remains at 94%, preventing absorption', 'Strong contribution']
      ],
      overallConfidence: 'HIGH',
      confidenceScore: 91,
      hazardSplit: {
        cloudburst: 'DECREASING (51%)',
        flood: 'CRITICAL (91%)',
        storm: 'LOW-MODERATE (38%)'
      }
    }
  }
];

export const DISTRICT_LOCATIONS = [
  {
    id: 'rudraprayag',
    name: 'Rudraprayag Control Zone',
    district: 'Rudraprayag',
    lat: 30.285,
    long: 78.981,
    elevation: '890 m',
    type: 'District EOC & Confluence',
    description: 'Confluence of Alaknanda & Mandakini rivers; critical downstream monitoring node.'
  },
  {
    id: 'kedarnath-road',
    name: 'Kedarnath Road Corridor',
    district: 'Rudraprayag',
    lat: 30.352,
    long: 79.060,
    elevation: '1,980 m',
    type: 'Steep Gorge Transit Corridor',
    description: 'High-risk steep valley terrain prone to sudden debris flows and tributary surges.'
  },
  {
    id: 'village-a',
    name: 'Village A (Ridge Sector)',
    district: 'Rudraprayag',
    lat: 30.393,
    long: 79.070,
    elevation: '2,240 m',
    type: 'Orographic Crest & Settlement',
    description: 'High-altitude ridge with strong orographic updraft trigger for cloudburst cells.'
  },
  {
    id: 'village-b',
    name: 'Village B (Upper Catchment)',
    district: 'Rudraprayag',
    lat: 30.420,
    long: 79.120,
    elevation: '2,650 m',
    type: 'Alpine Upper Catchment',
    description: 'Catchment headwaters with direct snow/rain drainage into the Mandakini river system.'
  }
];

export class SimulationEngine {
  constructor() {
    this.scenarioIndex = 0;
    this.totalSimulationsRun = 0;
  }

  getCurrentScenario() {
    const raw = SCENARIOS[this.scenarioIndex];
    return {
      scenarioId: raw.id,
      scenarioName: raw.name,
      simulatedTimestamp: raw.simulatedTimestamp,
      pipelineStages: this.generatePipelineSteps(),
      forecast: JSON.parse(JSON.stringify(raw.forecast)),
      signals: JSON.parse(JSON.stringify(raw.signals)),
      alerts: JSON.parse(JSON.stringify(raw.alerts)),
      places: JSON.parse(JSON.stringify(raw.places)),
      centers: JSON.parse(JSON.stringify(raw.centers)),
      explainability: JSON.parse(JSON.stringify(raw.explainability))
    };
  }

  advanceSimulation() {
    this.scenarioIndex = (this.scenarioIndex + 1) % SCENARIOS.length;
    this.totalSimulationsRun += 1;
    return this.getCurrentScenario();
  }

  resetSimulation() {
    this.scenarioIndex = 0;
    return this.getCurrentScenario();
  }

  getStats() {
    return {
      status: 'ONLINE',
      engine: 'VAJRA Deterministic Spatiotemporal Simulator v2.4',
      scenarioIndex: this.scenarioIndex,
      scenarioName: SCENARIOS[this.scenarioIndex].name,
      totalSimulationsRun: this.totalSimulationsRun,
      activeTimestamp: SCENARIOS[this.scenarioIndex].simulatedTimestamp,
      supportedHazards: ['Cloudburst', 'Flash Flood', 'Thunderstorm']
    };
  }

  generatePipelineSteps() {
    return [
      {
        step: 1,
        name: 'Processing satellite frames',
        source: 'INSAT-3D/3DR TIR1 & WV Bands',
        status: 'completed',
        executionTimeMs: 142,
        details: 'Extracted Integrated Water Vapour (IWV) & Cloud Top Temperature (-52°C to -64°C)'
      },
      {
        step: 2,
        name: 'Fusing atmospheric signals',
        source: 'NCMRWF IMDAA Regional Reanalysis (12km)',
        status: 'completed',
        executionTimeMs: 185,
        details: 'Computed CAPE (2,140–2,480 J/kg), CIN erosion, low-level wind convergence & shear'
      },
      {
        step: 3,
        name: 'Running spatiotemporal AI model',
        source: 'ConvLSTM + Spatial Transformer Multi-Task Net',
        status: 'completed',
        executionTimeMs: 230,
        details: 'Inferred multi-hazard probability tensor across 0–6 hour lead time window'
      },
      {
        step: 4,
        name: 'Generating probability maps',
        source: 'Probabilistic Spatial Grid Aggregator',
        status: 'completed',
        executionTimeMs: 110,
        details: 'Calibrated raster risk field for Cloudburst, Thunderstorm and Runoff zones'
      },
      {
        step: 5,
        name: 'Applying DEM terrain logic',
        source: 'SRTM 30m Digital Elevation Model + Flow Routing',
        status: 'completed',
        executionTimeMs: 165,
        details: 'Incorporated slope steepness, valley channeling and Mandakini flow accumulation'
      },
      {
        step: 6,
        name: 'Generating explainable alert',
        source: 'VAJRA Attribution & Decision Advisory Engine',
        status: 'completed',
        executionTimeMs: 95,
        details: 'Synthesized signal attribution, lead time confidence, and civil protection advisories'
      }
    ];
  }
}
