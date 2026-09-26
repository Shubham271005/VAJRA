import express from 'express';
import cors from 'cors';
import { sessionState } from './state.js';

export const app = express();

app.use(cors());
app.use(express.json());

// Prototype disclosure header on all responses
app.use((_req, res, next) => {
  res.setHeader('X-VAJRA-Environment', 'PROTOTYPE-SIMULATION');
  res.setHeader('X-VAJRA-Model', 'Deterministic-Spatiotemporal-Mock');
  next();
});

// GET /api
app.get('/api', (_req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'VAJRA SIH 2026 AI Nowcasting API',
    environment: 'PROTOTYPE-SIMULATION',
    endpoints: [
      '/api/health',
      '/api/signals',
      '/api/forecast',
      '/api/hazards',
      '/api/alerts',
      '/api/locations',
      '/api/simulation'
    ]
  });
});

// GET /api/signals
app.get('/api/signals', (req, res) => {
  const locationId = req.query.location;
  if (locationId) {
    sessionState.setActiveLocation(locationId);
  }
  const signals = sessionState.getSignals();
  res.json({
    success: true,
    data: signals,
    meta: {
      source: 'INSAT-3D/3DR & IMDAA Regional Reanalysis',
      mode: 'SIMULATED',
      location: sessionState.getActiveLocation()
    }
  });
});

// GET /api/forecast
app.get('/api/forecast', (_req, res) => {
  const forecast = sessionState.getForecast();
  res.json({
    success: true,
    data: forecast,
    meta: {
      horizon: '0-6 hours',
      step: '1 hour intervals',
      leadTimeUnits: 'hours'
    }
  });
});

// GET /api/hazards
app.get('/api/hazards', (req, res) => {
  const hourParam = req.query.hour;
  if (hourParam !== undefined) {
    const parsed = parseInt(hourParam, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) {
      sessionState.setActiveHour(parsed);
    }
  }
  const hazards = sessionState.getHazards();
  res.json({
    success: true,
    data: hazards,
    meta: {
      mode: 'DEMO / SIMULATION MODE',
      disclaimer: 'Simulated prototype outputs for SIH 2026 evaluation'
    }
  });
});

// POST /api/hazards/hour - update active hour
app.post('/api/hazards/hour', (req, res) => {
  const { hour } = req.body;
  if (typeof hour === 'number' && hour >= 0 && hour <= 6) {
    sessionState.setActiveHour(hour);
  }
  const hazards = sessionState.getHazards();
  res.json({
    success: true,
    data: hazards
  });
});

// GET /api/alerts
app.get('/api/alerts', (req, res) => {
  const filter = req.query.filter;
  let alerts = sessionState.getAlerts();
  if (filter && filter !== 'All') {
    alerts = alerts.filter(a => a.severity.toUpperCase() === filter.toUpperCase());
  }
  res.json({
    success: true,
    data: alerts,
    meta: {
      total: alerts.length,
      activeLocation: sessionState.getActiveLocation().name
    }
  });
});

// POST /api/alerts/:id/ack - acknowledge alert
app.post('/api/alerts/:id/ack', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'Invalid alert ID' });
  }
  const updated = sessionState.acknowledgeAlert(id);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Alert not found' });
  }
  res.json({
    success: true,
    data: updated,
    message: `Alert #${id} acknowledged by district operator.`
  });
});

// GET /api/locations
app.get('/api/locations', (_req, res) => {
  const locations = sessionState.getLocations();
  res.json({
    success: true,
    data: locations,
    active: sessionState.getActiveLocation()
  });
});

// POST /api/locations/select
app.post('/api/locations/select', (req, res) => {
  const locationId = req.body.locationId || req.body.locId || req.body.id;
  if (!locationId) {
    return res.status(400).json({ success: false, message: 'Missing locationId' });
  }
  const active = sessionState.setActiveLocation(locationId);
  res.json({
    success: true,
    active,
    forecast: sessionState.getForecast(),
    signals: sessionState.getSignals(),
    hazards: sessionState.getHazards(),
    alerts: sessionState.getAlerts()
  });
});

// GET /api/explain
app.get('/api/explain', (_req, res) => {
  res.json({
    success: true,
    data: sessionState.getExplainability(),
    location: sessionState.getActiveLocation()
  });
});

// GET /api/simulation
app.get('/api/simulation', (_req, res) => {
  const stats = sessionState.getSimulationStatus();
  res.json({
    success: true,
    data: stats
  });
});

// POST /api/simulation - Run Nowcast Simulation (triggers live PyTorch model if online)
app.post('/api/simulation', async (_req, res) => {
  const result = await sessionState.runNowcastSimulation();
  res.json({
    ...result,
    meta: {
      timestamp: new Date().toISOString(),
      disclaimer: result.mode === 'REAL_AI_MODEL_INFERENCE' 
        ? 'Live neural forward pass using VajraNowcastNet (ConvLSTM trained on Kedarnath 2013 data)' 
        : 'Deterministic simulated nowcast execution'
    }
  });
});

// POST /api/simulation/reset
app.post('/api/simulation/reset', (_req, res) => {
  const result = sessionState.resetSimulation();
  res.json(result);
});

// AI Model Microservice Status
app.get('/api/ai/status', async (_req, res) => {
  try {
    const aiRes = await fetch('http://localhost:8000/api/health', { signal: AbortSignal.timeout(1500) });
    if (aiRes.ok) {
      const data = await aiRes.json();
      return res.json({ connected: true, ...data });
    }
  } catch (err) {
    // Offline
  }
  res.json({ connected: false, status: 'OFFLINE', message: 'AI microservice on :8000 not reachable' });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'VAJRA Local Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
