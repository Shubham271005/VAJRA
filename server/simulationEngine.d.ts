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
export declare const DISTRICT_LOCATIONS: {
    id: string;
    name: string;
    district: string;
    lat: number;
    long: number;
    elevation: string;
    type: string;
    description: string;
}[];
export declare class SimulationEngine {
    private scenarioIndex;
    private totalSimulationsRun;
    getCurrentScenario(): SimulationOutput;
    advanceSimulation(): SimulationOutput;
    resetSimulation(): SimulationOutput;
    getStats(): {
        status: string;
        engine: string;
        scenarioIndex: number;
        scenarioName: string;
        totalSimulationsRun: number;
        activeTimestamp: string;
        supportedHazards: string[];
    };
    generatePipelineSteps(): SimulationStepResult[];
}
