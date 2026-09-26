import {
  SimulationEngine,
  DISTRICT_LOCATIONS,
  type AlertItem,
  type ForecastPoint,
  type SignalItem,
  type DistrictLocationItem
} from './simulationEngine';

export class SessionStateManager {
  private engine: SimulationEngine;
  private activeLocationId: string = 'rudraprayag';
  private activeHour: number = 3;
  private acknowledgedAlerts: Map<number, string> = new Map();

  constructor() {
    this.engine = new SimulationEngine();
  }

  public getLocations() {
    return DISTRICT_LOCATIONS.map(loc => ({
      ...loc,
      isActive: loc.id === this.activeLocationId
    }));
  }

  public getActiveLocation(): DistrictLocationItem {
    return DISTRICT_LOCATIONS.find(l => l.id === this.activeLocationId) || DISTRICT_LOCATIONS[0];
  }

  public setActiveLocation(id: string) {
    const found = DISTRICT_LOCATIONS.find(l => l.id === id);
    if (found) {
      this.activeLocationId = id;
    }
    return this.getActiveLocation();
  }

  public getActiveHour(): number {
    return this.activeHour;
  }

  public setActiveHour(hour: number): number {
    if (hour >= 0 && hour <= 6) {
      this.activeHour = hour;
    }
    return this.activeHour;
  }

  public acknowledgeAlert(id: number): AlertItem | null {
    const timestamp = new Date().toISOString();
    this.acknowledgedAlerts.set(id, timestamp);
    const alerts = this.getAlerts();
    return alerts.find(a => a.id === id) || null;
  }

  public getAlerts(): AlertItem[] {
    const scenario = this.engine.getCurrentScenario();
    return scenario.alerts.map(a => {
      if (this.acknowledgedAlerts.has(a.id)) {
        return {
          ...a,
          status: 'ACKNOWLEDGED' as const,
          acknowledgedAt: this.acknowledgedAlerts.get(a.id)
        };
      }
      return a;
    });
  }

  public getForecast(): ForecastPoint[] {
    const scenario = this.engine.getCurrentScenario();
    return scenario.forecast;
  }

  public getSignals(): SignalItem[] {
    const scenario = this.engine.getCurrentScenario();
    const loc = this.getActiveLocation();
    
    // Slight localized elevation/microclimate adjustment for realism based on selected location
    let elevationFactor = 1.0;
    if (loc.id === 'kedarnath') elevationFactor = 1.15;
    if (loc.id === 'gaurikund') elevationFactor = 1.08;
    if (loc.id === 'guptkashi') elevationFactor = 1.02;
    if (loc.id === 'rudraprayag') elevationFactor = 0.92;

    return scenario.signals.map(s => {
      let val = s.value;
      if (s.key === 'IWV') val = +(val * elevationFactor).toFixed(1);
      if (s.key === 'CAPE') val = Math.round(val * elevationFactor);
      if (s.key === 'CTT' && loc.id === 'kedarnath') val = val - 6;
      if (s.key === 'CTT' && loc.id === 'gaurikund') val = val - 3;
      return {
        ...s,
        value: val
      };
    });
  }

  public getHazards() {
    const scenario = this.engine.getCurrentScenario();
    const fc = scenario.forecast[this.activeHour] || scenario.forecast[3];
    const loc = this.getActiveLocation();

    // Determine current priority risk level
    let riskLevel: 'HIGH' | 'MODERATE' | 'WATCH' = 'WATCH';
    const maxProb = Math.max(fc.cloudburst, fc.flood, fc.storm);
    if (maxProb >= 75) riskLevel = 'HIGH';
    else if (maxProb >= 50) riskLevel = 'MODERATE';

    return {
      hour: this.activeHour,
      label: fc.label,
      probabilities: {
        cloudburst: fc.cloudburst,
        flood: fc.flood,
        storm: fc.storm
      },
      riskLevel,
      leadTime: `~${Math.max(1, 4 - this.activeHour)} hours`,
      triggerSignature: scenario.alerts[0]?.trigger || 'IWV surge + CAPE increase',
      location: loc,
      places: scenario.places,
      centers: scenario.centers,
      explainability: scenario.explainability
    };
  }

  public getSimulationStatus() {
    const stats = this.engine.getStats();
    const scenario = this.engine.getCurrentScenario();
    return {
      ...stats,
      activeHour: this.activeHour,
      activeLocation: this.getActiveLocation(),
      acknowledgedCount: this.acknowledgedAlerts.size,
      lastPipelineExecution: scenario.pipelineStages
    };
  }

  public runNowcastSimulation() {
    const updatedScenario = this.engine.advanceSimulation();
    return {
      success: true,
      message: 'VAJRA spatiotemporal nowcast simulation completed successfully.',
      scenarioId: updatedScenario.scenarioId,
      scenarioName: updatedScenario.scenarioName,
      simulatedTimestamp: updatedScenario.simulatedTimestamp,
      pipelineStages: updatedScenario.pipelineStages,
      forecast: this.getForecast(),
      signals: this.getSignals(),
      hazards: this.getHazards(),
      alerts: this.getAlerts()
    };
  }

  public resetSimulation() {
    this.acknowledgedAlerts.clear();
    this.activeHour = 3;
    this.activeLocationId = 'rudraprayag';
    const resetScenario = this.engine.resetSimulation();
    return {
      success: true,
      message: 'Simulation state reset to initial baseline conditions.',
      scenarioName: resetScenario.scenarioName,
      forecast: this.getForecast(),
      signals: this.getSignals(),
      hazards: this.getHazards(),
      alerts: this.getAlerts()
    };
  }
}

export const sessionState = new SessionStateManager();
