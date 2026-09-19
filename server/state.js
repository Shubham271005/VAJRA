import { SimulationEngine, DISTRICT_LOCATIONS } from './simulationEngine.js';

export class SessionStateManager {
  constructor() {
    this.engine = new SimulationEngine();
    this.activeLocationId = 'rudraprayag';
    this.activeHour = 3;
    this.acknowledgedAlerts = new Map(); // id -> timestamp
  }

  getLocations() {
    return DISTRICT_LOCATIONS.map(loc => ({
      ...loc,
      isActive: loc.id === this.activeLocationId
    }));
  }

  getActiveLocation() {
    return DISTRICT_LOCATIONS.find(l => l.id === this.activeLocationId) || DISTRICT_LOCATIONS[0];
  }

  setActiveLocation(id) {
    const found = DISTRICT_LOCATIONS.find(l => l.id === id);
    if (found) {
      this.activeLocationId = id;
    }
    return this.getActiveLocation();
  }

  getActiveHour() {
    return this.activeHour;
  }

  setActiveHour(hour) {
    if (typeof hour === 'number' && hour >= 0 && hour <= 6) {
      this.activeHour = hour;
    }
    return this.activeHour;
  }

  acknowledgeAlert(id) {
    const numericId = parseInt(id, 10);
    const timestamp = new Date().toISOString();
    this.acknowledgedAlerts.set(numericId, timestamp);
    const alerts = this.getAlerts();
    return alerts.find(a => a.id === numericId) || null;
  }

  getAlerts() {
    const scenario = this.engine.getCurrentScenario();
    return scenario.alerts.map(a => {
      if (this.acknowledgedAlerts.has(a.id)) {
        return {
          ...a,
          status: 'ACKNOWLEDGED',
          acknowledgedAt: this.acknowledgedAlerts.get(a.id)
        };
      }
      return a;
    });
  }

  getForecast() {
    const scenario = this.engine.getCurrentScenario();
    return scenario.forecast;
  }

  getSignals() {
    const scenario = this.engine.getCurrentScenario();
    const loc = this.getActiveLocation();
    
    // Slight localized elevation/microclimate adjustment for realism based on selected location
    let elevationFactor = 1.0;
    if (loc.id === 'village-a') elevationFactor = 1.05; // ridge orographic lift
    if (loc.id === 'village-b') elevationFactor = 0.94; // higher altitude cooler
    if (loc.id === 'kedarnath-road') elevationFactor = 1.02;

    return scenario.signals.map(s => {
      let val = s.value;
      if (s.key === 'IWV') val = +(val * elevationFactor).toFixed(1);
      if (s.key === 'CAPE') val = Math.round(val * elevationFactor);
      if (s.key === 'CTT' && loc.id === 'village-a') val = val - 2;
      return {
        ...s,
        value: val
      };
    });
  }

  getHazards() {
    const scenario = this.engine.getCurrentScenario();
    const fc = scenario.forecast[this.activeHour] || scenario.forecast[3];
    const loc = this.getActiveLocation();

    // Determine current priority risk level
    let riskLevel = 'WATCH';
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

  getSimulationStatus() {
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

  runNowcastSimulation() {
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

  resetSimulation() {
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
