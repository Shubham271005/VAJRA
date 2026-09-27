import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { sessionState } from './state';

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
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'VAJRA SIH 2026 AI Nowcasting API',
    environment: 'PROTOTYPE-SIMULATION',
    endpoints: [
      '/api/health',
      '/api/predict',
      '/api/signals',
      '/api/forecast',
      '/api/hazards',
      '/api/alerts',
      '/api/locations',
      '/api/simulation'
    ]
  });
});

// POST /api/predict - Dedicated Spatiotemporal AI Inference Endpoint
app.post('/api/predict', async (req: Request, res: Response) => {
  try {
    const aiRes = await fetch('http://localhost:8000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
      signal: AbortSignal.timeout(3000)
    });
    if (aiRes.ok) {
      const data = await aiRes.json();
      return res.json(data);
    }
  } catch (_err) {
    // Port 8000 offline
  }
  return res.json(sessionState.getAlerts());
});

// GET /api/predict - Direct query inference
app.get('/api/predict', async (req: Request, res: Response) => {
  try {
    const params = new URLSearchParams(req.query as any).toString();
    const url = `http://localhost:8000/api/predict${params ? '?' + params : ''}`;
    const aiRes = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (aiRes.ok) {
      const data = await aiRes.json();
      return res.json(data);
    }
  } catch (_err) {
    // Port 8000 offline
  }
  return res.json(sessionState.getAlerts());
});

// GET /api/weather/live - Real-time atmospheric sounding from Open-Meteo API
interface WeatherCacheEntry {
  timestamp: number;
  data: any;
}
const weatherCache = new Map<string, WeatherCacheEntry>();

app.get('/api/weather/live', async (req: Request, res: Response) => {
  try {
    const activeLoc = sessionState.getActiveLocation();
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : activeLoc.lat;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : activeLoc.long;

    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const cached = weatherCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < 300000) { // 5-minute TTL cache
      return res.json({ success: true, data: cached.data, cached: true });
    }

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,dew_point_2m,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,surface_pressure,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,cape,freezing_level_height,lifted_index,convective_inhibition,total_column_integrated_water_vapour&past_hours=6&forecast_hours=7&timezone=auto`;

    const fetchRes = await fetch(apiUrl, { signal: AbortSignal.timeout(6000) });
    if (!fetchRes.ok) {
      throw new Error(`Open-Meteo API returned HTTP ${fetchRes.status}`);
    }
    const raw = await fetchRes.json();
    weatherCache.set(cacheKey, { timestamp: now, data: raw });
    return res.json({ success: true, data: raw, cached: false });
  } catch (err: any) {
    return res.status(502).json({ success: false, error: err.message || 'Failed to fetch live weather' });
  }
});

// GET /api/signals
app.get('/api/signals', (req: Request, res: Response) => {
  const locationId = req.query.location as string | undefined;
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
app.get('/api/forecast', (_req: Request, res: Response) => {
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
app.get('/api/hazards', (req: Request, res: Response) => {
  const hourParam = req.query.hour;
  if (hourParam !== undefined) {
    const parsed = parseInt(hourParam as string, 10);
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
app.post('/api/hazards/hour', (req: Request, res: Response) => {
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
app.get('/api/alerts', (req: Request, res: Response) => {
  const filter = req.query.filter as string | undefined;
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
app.post('/api/alerts/:id/ack', (req: Request, res: Response) => {
  const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    res.status(400).json({ success: false, message: 'Invalid alert ID' });
    return;
  }
  const updated = sessionState.acknowledgeAlert(id);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Alert not found' });
    return;
  }
  res.json({
    success: true,
    data: updated,
    message: `Alert #${id} acknowledged by district operator.`
  });
});

// GET /api/locations
app.get('/api/locations', (_req: Request, res: Response) => {
  const locations = sessionState.getLocations();
  res.json({
    success: true,
    data: locations,
    active: sessionState.getActiveLocation()
  });
});

// POST /api/locations/select
app.post('/api/locations/select', (req: Request, res: Response) => {
  const locationId = req.body.locationId || req.body.locId || req.body.id;
  if (!locationId) {
    res.status(400).json({ success: false, message: 'Missing locationId' });
    return;
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

// GET /api/simulation
app.get('/api/simulation', (_req: Request, res: Response) => {
  const stats = sessionState.getSimulationStatus();
  res.json({
    success: true,
    data: stats
  });
});

// POST /api/simulation - Run Nowcast Simulation
app.post('/api/simulation', (_req: Request, res: Response) => {
  const result = sessionState.runNowcastSimulation();
  res.json({
    ...result,
    meta: {
      timestamp: new Date().toISOString(),
      disclaimer: 'Deterministic simulated nowcast execution'
    }
  });
});

// POST /api/simulation/reset
app.post('/api/simulation/reset', (_req: Request, res: Response) => {
  const result = sessionState.resetSimulation();
  res.json(result);
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'VAJRA Local Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
