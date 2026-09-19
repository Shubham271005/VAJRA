import { type AlertItem, type ForecastPoint, type SignalItem, type PlaceZone, type RiskCenter, type ExplainabilityData } from './simulationEngine.ts';
export declare class SessionStateManager {
    private engine;
    private activeLocationId;
    private activeHour;
    private acknowledgedAlerts;
    constructor();
    getLocations(): {
        isActive: boolean;
        id: string;
        name: string;
        district: string;
        lat: number;
        long: number;
        elevation: string;
        type: string;
        description: string;
    }[];
    getActiveLocation(): {
        id: string;
        name: string;
        district: string;
        lat: number;
        long: number;
        elevation: string;
        type: string;
        description: string;
    };
    setActiveLocation(id: string): {
        id: string;
        name: string;
        district: string;
        lat: number;
        long: number;
        elevation: string;
        type: string;
        description: string;
    };
    getActiveHour(): number;
    setActiveHour(hour: number): number;
    acknowledgeAlert(id: number): AlertItem | null;
    getAlerts(): AlertItem[];
    getForecast(): ForecastPoint[];
    getSignals(): SignalItem[];
    getHazards(): {
        hour: number;
        label: string;
        probabilities: {
            cloudburst: number;
            flood: number;
            storm: number;
        };
        riskLevel: "HIGH" | "MODERATE" | "WATCH";
        leadTime: string;
        triggerSignature: string;
        location: {
            id: string;
            name: string;
            district: string;
            lat: number;
            long: number;
            elevation: string;
            type: string;
            description: string;
        };
        places: PlaceZone[];
        centers: RiskCenter[];
        explainability: ExplainabilityData;
    };
    getSimulationStatus(): {
        activeHour: number;
        activeLocation: {
            id: string;
            name: string;
            district: string;
            lat: number;
            long: number;
            elevation: string;
            type: string;
            description: string;
        };
        acknowledgedCount: number;
        lastPipelineExecution: import("./simulationEngine.ts").SimulationStepResult[];
        status: string;
        engine: string;
        scenarioIndex: number;
        scenarioName: string;
        totalSimulationsRun: number;
        activeTimestamp: string;
        supportedHazards: string[];
    };
    runNowcastSimulation(): {
        success: boolean;
        message: string;
        scenarioId: string;
        scenarioName: string;
        simulatedTimestamp: string;
        pipelineStages: import("./simulationEngine.ts").SimulationStepResult[];
        forecast: ForecastPoint[];
        signals: SignalItem[];
        hazards: {
            hour: number;
            label: string;
            probabilities: {
                cloudburst: number;
                flood: number;
                storm: number;
            };
            riskLevel: "HIGH" | "MODERATE" | "WATCH";
            leadTime: string;
            triggerSignature: string;
            location: {
                id: string;
                name: string;
                district: string;
                lat: number;
                long: number;
                elevation: string;
                type: string;
                description: string;
            };
            places: PlaceZone[];
            centers: RiskCenter[];
            explainability: ExplainabilityData;
        };
        alerts: AlertItem[];
    };
    resetSimulation(): {
        success: boolean;
        message: string;
        scenarioName: string;
        forecast: ForecastPoint[];
        signals: SignalItem[];
        hazards: {
            hour: number;
            label: string;
            probabilities: {
                cloudburst: number;
                flood: number;
                storm: number;
            };
            riskLevel: "HIGH" | "MODERATE" | "WATCH";
            leadTime: string;
            triggerSignature: string;
            location: {
                id: string;
                name: string;
                district: string;
                lat: number;
                long: number;
                elevation: string;
                type: string;
                description: string;
            };
            places: PlaceZone[];
            centers: RiskCenter[];
            explainability: ExplainabilityData;
        };
        alerts: AlertItem[];
    };
}
export declare const sessionState: SessionStateManager;
