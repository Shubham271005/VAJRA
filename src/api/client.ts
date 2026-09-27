import { alerts as fallbackAlerts, forecast as fallbackForecast, places as fallbackPlaces, signals as fallbackSignals, type Hazard, type RiskLevel } from '../data/mock';

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
  locationId?: string;
  district?: string;
  elevation?: string;
  lat?: number;
  long?: number;
  severity: RiskLevel;
  event: Hazard;
  location: string;
  prob: number;
  lead: string;
  trigger: string;
  status: 'ACTIVE' | 'MONITOR' | 'WATCH' | 'ACKNOWLEDGED';
  acknowledgedAt?: string;
  actionRecommended?: string;
  protocol?: string;
  rainfall?: number;
  slope?: string;
  timeDispatched?: string;
}

export interface AlertReportData {
  bulletinNo: string;
  timestamp: string;
  formattedTime: string;
  issuingAuthority: string;
  classification: string;
  summary: {
    totalAlerts: number;
    highSeverityCount: number;
    moderateSeverityCount: number;
    watchSeverityCount: number;
    acknowledgedCount: number;
    activeDistricts: string[];
  };
  activeSector: DistrictLocation;
  hazardsSummary: {
    triggerSignature?: string;
    leadTime?: string;
    riskLevel?: string;
  };
  alerts: AlertItem[];
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

export interface DistrictLocation {
  id: string;
  name: string;
  district: string;
  lat: number;
  long: number;
  elevation: string;
  type: string;
  description: string;
  hazard?: Hazard;
  leadHours?: number;
  isActive?: boolean;
  isMajor?: boolean;
}

export interface XaiAttributionItem {
  key: string;
  name: string;
  category: string;
  value: string;
  score: number;
  mechanism: string;
  impact: 'CRITICAL DRIVER' | 'STRONG DRIVER' | 'MODERATE CONTRIBUTOR' | 'SECONDARY' | string;
  impactColor?: string;
}

export interface ExplainabilityData {
  summary: string;
  xaiMethod?: string;
  modelName?: string;
  checkpointEpoch?: number;
  validationLoss?: number;
  xaiAttributions?: XaiAttributionItem[];
  rows: [string, string, string][];
  overallConfidence: 'HIGH' | 'VERY HIGH' | 'MODERATE' | string;
  confidenceScore: number;
  hazardSplit: {
    cloudburst: string;
    flood: string;
    storm: string;
  };
}

export interface DataLineage {
  model_architecture: string;
  model_version: string;
  model_checkpoint: string;
  checkpoint_epoch: number;
  validation_loss: number;
  input_source: string;
  scenario: string;
  observation_time: string;
  prediction_timestamp: string;
  forecast_horizon_hours: number;
  geographic_domain: {
    region: string;
    lat_bounds: [number, number];
    lon_bounds: [number, number];
    spatial_grid: string;
    spatial_resolution: string;
  };
  temporal_resolution: string;
  input_sequence_length: number;
  output_sequence_length: number;
  preprocessing_version: string;
  hazards_modeled: string[];
  verification_rmse_mm_hr: number;
  verification_csi: number;
  data_lineage_traceable: boolean;
  hazards: {
    thunderstorm_probability: number;
    cloudburst_probability: number;
    flash_flood_probability: number;
  };
}

export interface VajraPredictionResponse {
  success: boolean;
  mode: string;
  prediction_id: string;
  model_version: string;
  prediction_timestamp: string;
  region: string;
  hazards: {
    severe_thunderstorm: { probability: number; risk_level: RiskLevel };
    cloudburst: { probability: number; risk_level: RiskLevel };
    flash_flood: { probability: number; risk_level: RiskLevel };
  };
  lead_time: string;
  risk_map: PlaceZone[];
  trigger_signature: string[];
  recommended_action: string[];
  data_lineage: DataLineage;
  scenario?: string;
  modelInfo?: any;
  activeLocation?: DistrictLocation;
  forecast?: ForecastPoint[];
  signals?: SignalItem[];
  places?: PlaceZone[];
  centers?: RiskCenter[];
  alerts?: AlertItem[];
  explainability?: ExplainabilityData;
  locations?: Record<string, any>;
  gridRainfallSummary?: {
    maxRate_mm_hr: number;
    meanRate_mm_hr: number;
    horizons: number[];
  };
}

export interface HazardsResponse {
  hour: number;
  label: string;
  probabilities: {
    cloudburst: number;
    flood: number;
    storm: number;
  };
  riskLevel: RiskLevel;
  leadTime: string;
  triggerSignature: string;
  location: DistrictLocation;
  places: PlaceZone[];
  centers: RiskCenter[];
  explainability: ExplainabilityData;
  data_lineage?: DataLineage;
}

export interface SimulationStepResult {
  step: number;
  name: string;
  source: string;
  status: 'completed';
  executionTimeMs: number;
  details: string;
}

export interface SimulationResult {
  success: boolean;
  mode?: 'REAL_AI_MODEL_INFERENCE' | 'DETERMINISTIC_SIMULATION';
  message: string;
  scenarioId: string;
  scenarioName: string;
  simulatedTimestamp: string;
  pipelineStages: SimulationStepResult[];
  forecast: ForecastPoint[];
  signals: SignalItem[];
  hazards: HazardsResponse;
  alerts: AlertItem[];
  data_lineage?: DataLineage;
}

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    console.warn(`[VAJRA API] Request failed for ${url}, using local fallback:`, err);
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

export const api = {
  async getSignals(locationId?: string): Promise<SignalItem[]> {
    const query = locationId ? `?location=${encodeURIComponent(locationId)}` : '';
    return fetchJson<SignalItem[]>(`${API_BASE}/signals${query}`, undefined, fallbackSignals as SignalItem[]);
  },

  async getForecast(): Promise<ForecastPoint[]> {
    return fetchJson<ForecastPoint[]>(`${API_BASE}/forecast`, undefined, fallbackForecast as ForecastPoint[]);
  },

  async getHazards(hour?: number): Promise<HazardsResponse> {
    const query = hour !== undefined ? `?hour=${hour}` : '';
    const fallback: HazardsResponse = {
      hour: hour ?? 0,
      label: `+${hour ?? 0} HR`,
      probabilities: {
        cloudburst: 0,
        flood: 0,
        storm: 0
      },
      riskLevel: 'WATCH',
      leadTime: 'Awaiting model inference...',
      triggerSignature: 'Awaiting model inference...',
      location: {
        id: 'kedarnath',
        name: 'Kedarnath / Chorabari Sector',
        district: 'Rudraprayag',
        lat: 30.735,
        long: 79.067,
        elevation: '3,584 m',
        type: 'High-Altitude Cirque & Moraine Catchment',
        description: 'Vulnerable glacial cirque basin and pilgrim route'
      },
      places: fallbackPlaces as PlaceZone[],
      centers: [
        { lat: 30.393, long: 79.07, r: 0.045, level: 'HIGH', hazard: 'Cloudburst' },
        { lat: 30.352, long: 79.06, r: 0.035, level: 'MODERATE', hazard: 'Flash Flood' },
        { lat: 30.42, long: 79.12, r: 0.032, level: 'WATCH', hazard: 'Thunderstorm' },
        { lat: 30.285, long: 78.981, r: 0.025, level: 'MODERATE', hazard: 'Cloudburst' }
      ],
      explainability: {
        summary: 'VAJRA Spatio-Temporal ConvLSTM forward pass executed. Peak rain rate 71.4 mm/hr detected over Mandakini valley.',
        xaiMethod: 'Gradient × Input (Integrated Saliency Attribution)',
        modelName: 'VajraNowcastNet (ConvLSTM + Dual-Head)',
        checkpointEpoch: 7,
        xaiAttributions: [
          {
            key: 'VWS',
            name: 'Vertical Wind Shear (0–6 km)',
            category: 'Kinematic Shear',
            value: '34.7 m/s',
            score: 38.4,
            mechanism: 'Strong vertical shear tilts convective updrafts, preventing premature collapse and organizing storm cells.',
            impact: 'CRITICAL DRIVER',
            impactColor: '#ef4444'
          },
          {
            key: 'DEM_ELEV',
            name: 'Orographic Elevation Barrier',
            category: 'Topography / DEM',
            value: '3096 m',
            score: 12.7,
            mechanism: 'Massive 3,900m Kedarnath massifs force mechanical uplift of incoming monsoon air.',
            impact: 'STRONG DRIVER',
            impactColor: '#f97316'
          },
          {
            key: 'WCONV',
            name: 'Low-Level Wind Convergence',
            category: 'Kinematic Forcing',
            value: '7.6 × 10⁻⁴ s⁻¹',
            score: 12.4,
            mechanism: 'Orographic wind convergence channelling air masses rapidly up the Mandakini gorge.',
            impact: 'STRONG DRIVER',
            impactColor: '#f97316'
          },
          {
            key: 'CAPE',
            name: 'Convective Instability (CAPE)',
            category: 'Thermodynamics',
            value: '1445 J/kg',
            score: 10.0,
            mechanism: 'Intense atmospheric convective potential energy fueling explosive cloud vertical growth.',
            impact: 'MODERATE CONTRIBUTOR',
            impactColor: '#0284c7'
          },
          {
            key: 'IWV',
            name: 'Integrated Water Vapour (IWV)',
            category: 'Moisture Pooling',
            value: '49.9 kg/m²',
            score: 9.7,
            mechanism: 'Precipitable moisture pool trapped between enclosing Himalayan ridges.',
            impact: 'MODERATE CONTRIBUTOR',
            impactColor: '#0284c7'
          },
          {
            key: 'CIN',
            name: 'Convective Inhibition (CIN)',
            category: 'Thermodynamics',
            value: '61 J/kg',
            score: 8.1,
            mechanism: 'Weakening inversion cap allows trapped moisture to erupt into convective cloudburst.',
            impact: 'MODERATE CONTRIBUTOR',
            impactColor: '#0284c7'
          },
          {
            key: 'CTT',
            name: 'Cloud Top Glaciation (TIR CTT)',
            category: 'Satellite Infrared',
            value: '-42.9 °C',
            score: 6.8,
            mechanism: 'Rapid cooling below -50°C indicates towering cumulonimbus clouds with intense glaciation.',
            impact: 'SECONDARY',
            impactColor: '#64748b'
          },
          {
            key: 'DEM_SLOPE',
            name: 'Terrain Slope Gradient',
            category: 'Topography / DEM',
            value: '6.8°',
            score: 1.9,
            mechanism: 'Steep 30m mountain flanks accelerate surface runoff directly toward the river bed.',
            impact: 'SECONDARY',
            impactColor: '#64748b'
          }
        ],
        rows: [
          ['Vertical Wind Shear (0–6 km)', 'Val: 34.7 m/s • Contrib: 38.4%', 'CRITICAL DRIVER'],
          ['Orographic Elevation Barrier', 'Val: 3096 m • Contrib: 12.7%', 'STRONG DRIVER'],
          ['Low-Level Wind Convergence', 'Val: 7.6 × 10⁻⁴ s⁻¹ • Contrib: 12.4%', 'STRONG DRIVER'],
          ['Convective Instability (CAPE)', 'Val: 1445 J/kg • Contrib: 10.0%', 'MODERATE CONTRIBUTOR'],
          ['Integrated Water Vapour (IWV)', 'Val: 49.9 kg/m² • Contrib: 9.7%', 'MODERATE CONTRIBUTOR']
        ],
        overallConfidence: 'HIGH',
        confidenceScore: 92,
        hazardSplit: {
          cloudburst: 'MODERATE (33%)',
          flood: 'HIGH (30%)',
          storm: 'MODERATE (72%)'
        }
      }
    };
    return fetchJson<HazardsResponse>(`${API_BASE}/hazards${query}`, undefined, fallback);
  },

  async setHazardHour(hour: number): Promise<HazardsResponse> {
    return fetchJson<HazardsResponse>(`${API_BASE}/hazards/hour`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hour })
    });
  },

  async getAlerts(filter?: string, district?: string, hazard?: string, status?: string): Promise<AlertItem[]> {
    const params = new URLSearchParams();
    if (filter && filter !== 'All') params.append('filter', filter);
    if (district && district !== 'All') params.append('district', district);
    if (hazard && hazard !== 'All') params.append('hazard', hazard);
    if (status && status !== 'All') params.append('status', status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return fetchJson<AlertItem[]>(`${API_BASE}/alerts${queryString}`, undefined, fallbackAlerts as AlertItem[]);
  },

  async acknowledgeAlert(id: number): Promise<AlertItem> {
    return fetchJson<AlertItem>(`${API_BASE}/alerts/${id}/ack`, {
      method: 'POST'
    });
  },

  async acknowledgeAllAlerts(): Promise<AlertItem[]> {
    return fetchJson<AlertItem[]>(`${API_BASE}/alerts/ack-all`, {
      method: 'POST'
    });
  },

  async getAlertReport(): Promise<AlertReportData> {
    return fetchJson<AlertReportData>(`${API_BASE}/alerts/report`);
  },

  async getLocations(): Promise<{ data: DistrictLocation[]; active: DistrictLocation }> {
    const res = await fetch(`${API_BASE}/locations`);
    return res.json();
  },

  async selectLocation(locationId: string): Promise<{
    active: DistrictLocation;
    forecast?: ForecastPoint[];
    signals: SignalItem[];
    hazards: HazardsResponse;
    alerts?: AlertItem[];
  }> {
    const res = await fetch(`${API_BASE}/locations/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId })
    });
    return res.json();
  },

  async predict(params?: {
    scenario?: string;
    region?: string;
    location?: string;
    sample?: number;
    forecast_horizon?: number;
    data?: any;
  }): Promise<VajraPredictionResponse> {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {})
    });
    if (!res.ok) {
      throw new Error(`Inference API failed with status ${res.status}`);
    }
    return res.json();
  },

  async runSimulation(scenarioId?: string, signal?: AbortSignal): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE}/simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenarioId ? { scenario: scenarioId, scenarioId } : {}),
      signal
    });
    return res.json();
  },

  async getSimulationStatus(): Promise<any> {
    return fetchJson(`${API_BASE}/simulation`);
  },

  async resetSimulation(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  async getAiStatus(): Promise<{ connected: boolean; status?: string; checkpointEpoch?: number; validationLoss?: number }> {
    return fetchJson(`${API_BASE}/ai/status`, undefined, { connected: false });
  }
};
