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
  severity: RiskLevel;
  event: Hazard;
  location: string;
  prob: number;
  lead: string;
  trigger: string;
  status: 'ACTIVE' | 'MONITOR' | 'WATCH' | 'ACKNOWLEDGED';
  acknowledgedAt?: string;
  actionRecommended?: string;
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
      hour: hour ?? 3,
      label: `+${hour ?? 3} HR`,
      probabilities: {
        cloudburst: fallbackForecast[hour ?? 3]?.cloudburst ?? 82,
        flood: fallbackForecast[hour ?? 3]?.flood ?? 67,
        storm: fallbackForecast[hour ?? 3]?.storm ?? 91
      },
      riskLevel: 'HIGH',
      leadTime: '~3 hours',
      triggerSignature: 'IWV surge + CAPE increase',
      location: {
        id: 'rudraprayag',
        name: 'Rudraprayag Control Zone',
        district: 'Rudraprayag',
        lat: 30.285,
        long: 78.981,
        elevation: '890 m',
        type: 'District Control',
        description: 'District Emergency Operations Center'
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

  async getAlerts(filter?: string): Promise<AlertItem[]> {
    const query = filter && filter !== 'All' ? `?filter=${encodeURIComponent(filter)}` : '';
    return fetchJson<AlertItem[]>(`${API_BASE}/alerts${query}`, undefined, fallbackAlerts as AlertItem[]);
  },

  async acknowledgeAlert(id: number): Promise<AlertItem> {
    return fetchJson<AlertItem>(`${API_BASE}/alerts/${id}/ack`, {
      method: 'POST'
    });
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

  async runSimulation(): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE}/simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
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
