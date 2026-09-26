export type Hazard = 'Cloudburst' | 'Flash Flood' | 'Thunderstorm';
export type RiskLevel = 'HIGH' | 'MODERATE' | 'WATCH';

export interface ForecastPoint {
  hour: number;
  label: string;
  cloudburst: number;
  flood: number;
  storm: number;
}

export interface SignalItem {
  key: string;
  name: string;
  value: number;
  unit: string;
  trend: string;
  status: string;
  series: number[];
}

export interface AlertItem {
  id: number;
  severity: RiskLevel;
  event: Hazard;
  location: string;
  prob: number;
  lead: string;
  trigger: string;
  status: 'ACTIVE' | 'MONITOR' | 'WATCH' | 'ACKNOWLEDGED';
  acknowledgedAt?: string;
  actionRecommended: string;
}

export interface PlaceZone {
  id: string;
  name: string;
  lat: number;
  long: number;
  hazard: Hazard;
  prob: number;
  level: RiskLevel;
  lead: string;
  signals: string;
}

export interface RiskCenter {
  lat: number;
  long: number;
  r: number;
  level: RiskLevel;
  hazard: Hazard;
}

export interface ExplainabilityData {
  summary: string;
  rows: [string, string, string][];
  overallConfidence: 'HIGH' | 'VERY HIGH' | 'MODERATE';
  confidenceScore: number;
  hazardSplit: {
    cloudburst: string;
    flood: string;
    storm: string;
  };
}

export interface SimulationStepResult {
  step: number;
  name: string;
  source: string;
  status: 'completed';
  executionTimeMs: number;
  details: string;
}

export interface SimulationOutput {
  scenarioId: string;
  scenarioName: string;
  simulatedTimestamp: string;
  pipelineStages: SimulationStepResult[];
  forecast: ForecastPoint[];
  signals: SignalItem[];
  alerts: AlertItem[];
  places: PlaceZone[];
  centers: RiskCenter[];
  explainability: ExplainabilityData;
}

export interface DistrictLocationItem {
  id: string;
  name: string;
  district: string;
  lat: number;
  long: number;
  elevation: string;
  type: string;
  description: string;
}

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
      { id: 'kedarnath', name: 'Kedarnath / Chorabari Sector', lat: 30.735, long: 79.067, hazard: 'Cloudburst' as Hazard, prob: 88, level: 'HIGH' as RiskLevel, lead: '1 hr', signals: 'Glaciated CTT -43°C + Peak Rain 45.7 mm/hr' },
      { id: 'gaurikund', name: 'Rambara - Gaurikund Gorge', lat: 30.652, long: 79.043, hazard: 'Flash Flood' as Hazard, prob: 88, level: 'HIGH' as RiskLevel, lead: '2 hrs', signals: 'Peak Rain 67.2 mm/hr + Steep Slopes (38°)' },
      { id: 'guptkashi', name: 'Guptkashi - Phata Ridge', lat: 30.523, long: 79.077, hazard: 'Thunderstorm' as Hazard, prob: 84, level: 'HIGH' as RiskLevel, lead: '1 hr', signals: 'Thermodynamic CAPE 2480 J/kg + Strong Shear' },
      { id: 'rudraprayag', name: 'Rudraprayag Control Zone', lat: 30.285, long: 78.981, hazard: 'Flash Flood' as Hazard, prob: 82, level: 'HIGH' as RiskLevel, lead: '4 hrs', signals: 'Hydrologic Flood Routing Surge Wave' }
    ],
    centers: [
      { lat: 30.735, long: 79.067, r: 0.045, level: 'HIGH' as RiskLevel, hazard: 'Cloudburst' as Hazard },
      { lat: 30.652, long: 79.043, r: 0.040, level: 'HIGH' as RiskLevel, hazard: 'Flash Flood' as Hazard },
      { lat: 30.523, long: 79.077, r: 0.035, level: 'HIGH' as RiskLevel, hazard: 'Thunderstorm' as Hazard },
      { lat: 30.285, long: 78.981, r: 0.030, level: 'HIGH' as RiskLevel, hazard: 'Flash Flood' as Hazard }
    ],
    alerts: [
      { id: 1, severity: 'HIGH' as RiskLevel, event: 'Cloudburst' as Hazard, location: 'Kedarnath / Chorabari Sector', prob: 88, lead: '1 hr', trigger: 'Glaciated CTT -43°C + Peak Rain 45.7 mm/hr', status: 'ACTIVE' as const, actionRecommended: 'IMMEDIATE EVACUATION: Move pilgrims above Mandakini flood plain to high ground behind shrine sanctuary' },
      { id: 2, severity: 'HIGH' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Rambara - Gaurikund Gorge', prob: 88, lead: '2 hrs', trigger: 'Peak Rain 67.2 mm/hr + Steep Slopes (38°)', status: 'ACTIVE' as const, actionRecommended: 'HALT ALL TRANSIT: Close Gaurikund-Kedarnath trek corridor and clear Rambara bridge settlements' },
      { id: 3, severity: 'HIGH' as RiskLevel, event: 'Thunderstorm' as Hazard, location: 'Guptkashi - Phata Ridge', prob: 84, lead: '1 hr', trigger: 'CAPE 2480 J/kg + High Shear', status: 'ACTIVE' as const, actionRecommended: 'GROUND HELICOPTER FLIGHTS: Ground shuttle operations and secure hilltop communication arrays' },
      { id: 4, severity: 'HIGH' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Rudraprayag Control Zone', prob: 82, lead: '4 hrs', trigger: 'Hydrologic Flood Routing Surge Wave', status: 'ACTIVE' as const, actionRecommended: 'RIVERFRONT CLEARANCE: Clear Alaknanda-Mandakini confluence ghats and alert downstream barrages' }
    ],
    explainability: {
      summary: 'Deep convective cell approaching Rudraprayag district with severe moisture pooling and rapid cloud top glaciation.',
      rows: [
        ['IWV surge detected', '+34% over recent observation window', 'Strong contribution'],
        ['CAPE increasing', 'Convective instability rising above 2,100 J/kg', 'Strong contribution'],
        ['CIN weakening', 'Convective inhibition eroded to 34 J/kg', 'Moderate contribution'],
        ['Low-level wind convergence', 'Orographic forcing along Mandakini valley', 'Moderate contribution'],
        ['Cloud Top Temperature', 'Rapid cloud development signal (dropped to -52°C)', 'Strong contribution']
      ] as [string, string, string][],
      overallConfidence: 'HIGH' as const,
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
      { id: 'kedarnath', name: 'Kedarnath / Chorabari Sector', lat: 30.735, long: 79.067, hazard: 'Cloudburst' as Hazard, prob: 96, level: 'HIGH' as RiskLevel, lead: '30 mins', signals: 'Severe CTT cooling (-64°C) + IWV 47.4' },
      { id: 'gaurikund', name: 'Rambara - Gaurikund Gorge', lat: 30.652, long: 79.043, hazard: 'Flash Flood' as Hazard, prob: 92, level: 'HIGH' as RiskLevel, lead: '1 hr', signals: 'Steep slope convergence + extreme rainfall' },
      { id: 'guptkashi', name: 'Guptkashi - Phata Ridge', lat: 30.523, long: 79.077, hazard: 'Thunderstorm' as Hazard, prob: 88, level: 'HIGH' as RiskLevel, lead: '1 hr', signals: 'High CAPE + extreme lightning signature' },
      { id: 'rudraprayag', name: 'Rudraprayag Control Zone', lat: 30.285, long: 78.981, hazard: 'Flash Flood' as Hazard, prob: 84, level: 'HIGH' as RiskLevel, lead: '3 hrs', signals: 'Moisture pooling + downstream flood surge' }
    ],
    centers: [
      { lat: 30.735, long: 79.067, r: 0.058, level: 'HIGH' as RiskLevel, hazard: 'Cloudburst' as Hazard },
      { lat: 30.652, long: 79.043, r: 0.048, level: 'HIGH' as RiskLevel, hazard: 'Flash Flood' as Hazard },
      { lat: 30.523, long: 79.077, r: 0.042, level: 'HIGH' as RiskLevel, hazard: 'Thunderstorm' as Hazard },
      { lat: 30.285, long: 78.981, r: 0.038, level: 'HIGH' as RiskLevel, hazard: 'Flash Flood' as Hazard }
    ],
    alerts: [
      { id: 1, severity: 'HIGH' as RiskLevel, event: 'Cloudburst' as Hazard, location: 'Kedarnath / Chorabari Sector', prob: 96, lead: '30 mins', trigger: 'Extreme CTT + IWV Surge', status: 'ACTIVE' as const, actionRecommended: 'Issue immediate red alert and trigger shrine evacuation protocol' },
      { id: 2, severity: 'HIGH' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Rambara - Gaurikund Gorge', prob: 92, lead: '1 hr', trigger: 'Saturated Soil + Torrential Runoff', status: 'ACTIVE' as const, actionRecommended: 'Immediately close Mandakini riverside pilgrim camps' },
      { id: 3, severity: 'HIGH' as RiskLevel, event: 'Thunderstorm' as Hazard, location: 'Guptkashi - Phata Ridge', prob: 88, lead: '1 hr', trigger: 'CAPE 2480 J/kg + Strong Shear', status: 'ACTIVE' as const, actionRecommended: 'Warn power transmission grids and high-altitude shelters' },
      { id: 4, severity: 'HIGH' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Rudraprayag Control Zone', prob: 84, lead: '3 hrs', trigger: 'Hydro-routed upstream surge', status: 'ACTIVE' as const, actionRecommended: 'Clear riverside ghats and low-lying market stalls' }
    ],
    explainability: {
      summary: 'Atmospheric instability reached peak threshold. Severe convective cell locked into Mandakini valley orographic chimney.',
      rows: [
        ['Extreme CTT glaciation', 'Overshooting tops detected at -64°C by INSAT TIR1', 'Strong contribution'],
        ['Moisture convergence maximum', 'Low-level convergence spiked to 11.4 x 10⁻⁴ s⁻¹', 'Strong contribution'],
        ['CAPE super-instability', 'CAPE exceeds 2,400 J/kg with complete CIN erosion', 'Strong contribution'],
        ['Steep DEM runoff amplification', 'SRTM slope > 35° accelerates flash flood transition', 'Strong contribution'],
        ['VWS maintenance', 'Shear maintains organized multicellular storm structure', 'Moderate contribution']
      ] as [string, string, string][],
      overallConfidence: 'VERY HIGH' as const,
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
      { id: 'kedarnath', name: 'Kedarnath / Chorabari Sector', lat: 30.735, long: 79.067, hazard: 'Flash Flood' as Hazard, prob: 78, level: 'MODERATE' as RiskLevel, lead: '1 hr', signals: 'Glacial runoff draining to gorge' },
      { id: 'gaurikund', name: 'Rambara - Gaurikund Gorge', lat: 30.652, long: 79.043, hazard: 'Flash Flood' as Hazard, prob: 94, level: 'HIGH' as RiskLevel, lead: '1 hr', signals: 'Peak river channel swelling + debris flow' },
      { id: 'guptkashi', name: 'Guptkashi - Phata Ridge', lat: 30.523, long: 79.077, hazard: 'Thunderstorm' as Hazard, prob: 46, level: 'WATCH' as RiskLevel, lead: '2 hrs', signals: 'Cell decaying, stratiform rain' },
      { id: 'rudraprayag', name: 'Rudraprayag Control Zone', lat: 30.285, long: 78.981, hazard: 'Flash Flood' as Hazard, prob: 90, level: 'HIGH' as RiskLevel, lead: '2 hrs', signals: 'Mandakini surge reaching confluence' }
    ],
    centers: [
      { lat: 30.652, long: 79.043, r: 0.060, level: 'HIGH' as RiskLevel, hazard: 'Flash Flood' as Hazard },
      { lat: 30.285, long: 78.981, r: 0.052, level: 'HIGH' as RiskLevel, hazard: 'Flash Flood' as Hazard },
      { lat: 30.735, long: 79.067, r: 0.038, level: 'MODERATE' as RiskLevel, hazard: 'Cloudburst' as Hazard },
      { lat: 30.523, long: 79.077, r: 0.024, level: 'WATCH' as RiskLevel, hazard: 'Thunderstorm' as Hazard }
    ],
    alerts: [
      { id: 2, severity: 'HIGH' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Rambara - Gaurikund Gorge', prob: 94, lead: '1 hr', trigger: 'Channel Swell + Debris Flow', status: 'ACTIVE' as const, actionRecommended: 'Maintain total vehicular closure and initiate bank reinforcements' },
      { id: 4, severity: 'HIGH' as RiskLevel, event: 'Flash Flood' as Hazard, location: 'Rudraprayag Confluence', prob: 90, lead: '2 hrs', trigger: 'Hydro-routed upstream surge', status: 'ACTIVE' as const, actionRecommended: 'Sound siren at confluence ghats and enforce riverfront buffer zone' },
      { id: 1, severity: 'MODERATE' as RiskLevel, event: 'Cloudburst' as Hazard, location: 'Kedarnath / Chorabari Sector', prob: 51, lead: '2 hrs', trigger: 'Stratiform transition', status: 'MONITOR' as const, actionRecommended: 'Assess ridge slope stabilization and cleared drainage paths' },
      { id: 3, severity: 'WATCH' as RiskLevel, event: 'Thunderstorm' as Hazard, location: 'Guptkashi - Phata Ridge', prob: 38, lead: '3 hrs', trigger: 'Dissipating storm cell', status: 'WATCH' as const, actionRecommended: 'Resume normal vigilance standby' }
    ],
    explainability: {
      summary: 'Atmospheric convective engine is relaxing as instability is exhausted. Threat shifts heavily to DEM-directed hydrological flood routing.',
      rows: [
        ['Hydrological lag in effect', 'Precipitation volume routing through Mandakini riverbed', 'Strong contribution'],
        ['DEM slope flow accumulation', 'Steep topography (SRTM 30m) channels mountain runoff downstream', 'Strong contribution'],
        ['Atmospheric CIN rebuilding', 'Convective inhibition rose to 62 J/kg, suppressing new cells', 'Moderate contribution'],
        ['Cloud Top Warming', 'CTT warmed to -41°C, indicating anvil dissipation', 'Moderate contribution'],
        ['Soil moisture saturation', 'Antecedent moisture index remains at 94%, preventing absorption', 'Strong contribution']
      ] as [string, string, string][],
      overallConfidence: 'HIGH' as const,
      confidenceScore: 91,
      hazardSplit: {
        cloudburst: 'DECREASING (51%)',
        flood: 'CRITICAL (91%)',
        storm: 'LOW-MODERATE (38%)'
      }
    }
  }
];

export const DISTRICT_LOCATIONS: DistrictLocationItem[] = [
  {
    id: 'kedarnath',
    name: 'Kedarnath / Chorabari Sector',
    district: 'Rudraprayag',
    lat: 30.735,
    long: 79.067,
    elevation: '3,584 m',
    type: 'Glacial Catchment & Shrine Sanctuary',
    description: 'Upper Mandakini headwaters & Chorabari moraine lake; primary ground-zero cloudburst trigger zone.'
  },
  {
    id: 'gaurikund',
    name: 'Rambara - Gaurikund Gorge',
    district: 'Rudraprayag',
    lat: 30.652,
    long: 79.043,
    elevation: '1,980 m',
    type: 'Steep Gorge Transit Corridor',
    description: 'Narrow mountain gorge with severe hydraulic channelling, tributary confluence & debris torrent vulnerability.'
  },
  {
    id: 'guptkashi',
    name: 'Guptkashi - Phata Ridge',
    district: 'Rudraprayag',
    lat: 30.523,
    long: 79.077,
    elevation: '1,319 m',
    type: 'Orographic Crest & Helipad Outpost',
    description: 'Mid-valley ridge sector subjected to intense thermodynamic CAPE buoyancy, lightning & cross-valley wind shear.'
  },
  {
    id: 'rudraprayag',
    name: 'Rudraprayag Control Zone',
    district: 'Rudraprayag',
    lat: 30.285,
    long: 78.981,
    elevation: '890 m',
    type: 'District EOC & Confluence',
    description: 'Confluence of Alaknanda & Mandakini rivers; critical downstream evacuation node and hydro-surge terminus.'
  }
];

export class SimulationEngine {
  private scenarioIndex: number = 0;
  private totalSimulationsRun: number = 0;

  public getCurrentScenario(): SimulationOutput {
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

  public advanceSimulation(): SimulationOutput {
    this.scenarioIndex = (this.scenarioIndex + 1) % SCENARIOS.length;
    this.totalSimulationsRun += 1;
    return this.getCurrentScenario();
  }

  public resetSimulation(): SimulationOutput {
    this.scenarioIndex = 0;
    return this.getCurrentScenario();
  }

  public getStats() {
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

  public generatePipelineSteps(): SimulationStepResult[] {
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
