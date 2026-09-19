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
  isActive?: boolean;
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
        summary: 'Deep convective cell approaching Rudraprayag district.',
        rows: [
          ['IWV surge detected', '+34% over recent observation window', 'Strong contribution'],
          ['CAPE increasing', 'Convective instability rising', 'Strong contribution'],
          ['CIN weakening', 'Convection becoming easier to initiate', 'Moderate contribution'],
          ['Low-level wind convergence', 'Strong convergence detected', 'Moderate contribution'],
          ['Cloud Top Temperature', 'Rapid cloud development signal', 'Strong contribution']
        ],
        overallConfidence: 'HIGH',
        confidenceScore: 88,
        hazardSplit: {
          cloudburst: 'HIGH',
          flood: 'MODERATE-HIGH',
          storm: 'HIGH'
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

  async selectLocation(locationId: string): Promise<{ active: DistrictLocation; signals: SignalItem[]; hazards: HazardsResponse }> {
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
  }
};
