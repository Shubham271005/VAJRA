import { useEffect, useMemo, useState, useRef } from 'react'
import { Activity, AlertTriangle, Bell, Check, ChevronDown, CloudLightning, Cpu, Database, FileWarning, Gauge, History, Layers3, MapPinned, Menu, Play, Radar, RefreshCw, ShieldCheck, Siren, SlidersHorizontal, Sparkles, Waves } from 'lucide-react'
import MapView, { type PlaceZone, type RiskCenter } from './components/MapView'
import ChartCard from './components/ChartCard'
import Pipeline from './components/Pipeline'
import ExplainPanel from './components/ExplainPanel'
import { alerts as initialAlerts, forecast as initialForecast, places as initialPlaces, signals as initialSignals, type Hazard } from './data/mock'
import { api, type AlertItem, type DistrictLocation, type ExplainabilityData, type ForecastPoint, type SignalItem } from './api/client'

type Page = 'Overview' | 'Live Risk Map' | 'Weather Signals' | 'Alerts' | 'Historical Events' | 'Model Insights' | 'System Status'
const nav: [Page, typeof Activity][] = [
  ['Overview', Gauge],
  ['Live Risk Map', MapPinned],
  ['Weather Signals', Activity],
  ['Alerts', Siren],
  ['Historical Events', History],
  ['Model Insights', Cpu],
  ['System Status', ShieldCheck]
]

function App() {
  const [page, setPage] = useState<Page>('Overview');
  const [hour, setHour] = useState(3);
  const [hazard, setHazard] = useState<Hazard | 'All'>('All');
  const [showExplain, setShowExplain] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [layers, setLayers] = useState({ risk: true, terrain: true, roads: true, population: true, rivers: true });
  const [selected, setSelected] = useState<PlaceZone | null>(null);
  const [filter, setFilter] = useState('All');

  // Dynamic backend state
  const [forecast, setForecast] = useState<ForecastPoint[]>(initialForecast as ForecastPoint[]);
  const [signals, setSignals] = useState<SignalItem[]>(initialSignals as SignalItem[]);
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts as AlertItem[]);
  const [places, setPlaces] = useState<PlaceZone[]>(initialPlaces as PlaceZone[]);
  const [centers, setCenters] = useState<RiskCenter[]>([
    { lat: 30.393, long: 79.07, r: 0.045, level: 'HIGH', hazard: 'Cloudburst' },
    { lat: 30.352, long: 79.06, r: 0.035, level: 'MODERATE', hazard: 'Flash Flood' },
    { lat: 30.42, long: 79.12, r: 0.032, level: 'WATCH', hazard: 'Thunderstorm' },
    { lat: 30.285, long: 78.981, r: 0.025, level: 'MODERATE', hazard: 'Cloudburst' }
  ]);
  const [locations, setLocations] = useState<DistrictLocation[]>([]);
  const [activeLocation, setActiveLocation] = useState<DistrictLocation | null>(null);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [explainData, setExplainData] = useState<ExplainabilityData | null>(null);
  const [simTimestamp, setSimTimestamp] = useState('06 SEP 2026 • 18:30 IST');
  const [scenarioName, setScenarioName] = useState('Convective Initiation & Pre-Burst Convergence');
  const [priorityLead, setPriorityLead] = useState('~3 hours');
  const [triggerSignature, setTriggerSignature] = useState('IWV surge + CAPE increase');
  const [priorityRiskLevel, setPriorityRiskLevel] = useState<'HIGH' | 'MODERATE' | 'WATCH'>('HIGH');
  const [aiConnected, setAiConnected] = useState(false);
  const [aiModelMode, setAiModelMode] = useState(false);

  const locationMenuRef = useRef<HTMLDivElement>(null);

  // Fetch initial data from local backend
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [locRes, fcData, sigData, alData, hzData, aiStatus] = await Promise.all([
          api.getLocations().catch(() => null),
          api.getForecast().catch(() => initialForecast as ForecastPoint[]),
          api.getSignals().catch(() => initialSignals as SignalItem[]),
          api.getAlerts().catch(() => initialAlerts as AlertItem[]),
          api.getHazards(3).catch(() => null),
          api.getAiStatus().catch(() => null)
        ]);

        if (!isMounted) return;

        if (aiStatus && aiStatus.connected) {
          setAiConnected(true);
        }

        if (locRes && locRes.data) {
          setLocations(locRes.data);
          setActiveLocation(locRes.active || locRes.data[0]);
        }
        if (fcData) setForecast(fcData);
        if (sigData) setSignals(sigData);
        if (alData) setAlerts(alData);
        if (hzData) {
          setPlaces(hzData.places || initialPlaces);
          if (hzData.centers) setCenters(hzData.centers);
          if (hzData.explainability) setExplainData(hzData.explainability);
          if (hzData.leadTime) setPriorityLead(hzData.leadTime);
          if (hzData.triggerSignature) setTriggerSignature(hzData.triggerSignature);
          if (hzData.riskLevel) setPriorityRiskLevel(hzData.riskLevel);
          if (!selected && hzData.places && hzData.places.length > 0) {
            setSelected(hzData.places[0]);
          }
        }
      } catch (e) {
        console.warn('Initial fetch error:', e);
      }
    }
    loadData();

    // Close location menu when clicking outside
    function handleClickOutside(e: MouseEvent) {
      if (locationMenuRef.current && !locationMenuRef.current.contains(e.target as Node)) {
        setLocationMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      isMounted = false;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update hazard values when selected forecast hour changes
  const handleHourChange = async (newHour: number) => {
    setHour(newHour);
    try {
      const hzData = await api.setHazardHour(newHour);
      if (hzData) {
        if (hzData.places) setPlaces(hzData.places);
        if (hzData.centers) setCenters(hzData.centers);
        if (hzData.leadTime) setPriorityLead(hzData.leadTime);
        if (hzData.triggerSignature) setTriggerSignature(hzData.triggerSignature);
        if (hzData.riskLevel) setPriorityRiskLevel(hzData.riskLevel);
      }
    } catch (e) {
      console.warn('Hour update error:', e);
    }
  };

  // Switch active district location
  const handleSelectLocation = async (locId: string) => {
    setLocationMenuOpen(false);
    try {
      const result = await api.selectLocation(locId);
      if (result && result.active) {
        setActiveLocation(result.active);
        if (result.forecast) setForecast(result.forecast);
        if (result.signals) setSignals(result.signals);
        if (result.alerts) setAlerts(result.alerts);
        if (result.hazards) {
          const updatedPlaces = result.hazards.places || places;
          setPlaces(updatedPlaces);
          if (result.hazards.centers) setCenters(result.hazards.centers);
          if (result.hazards.leadTime) setPriorityLead(result.hazards.leadTime);
          if (result.hazards.triggerSignature) setTriggerSignature(result.hazards.triggerSignature);
          if (result.hazards.riskLevel) setPriorityRiskLevel(result.hazards.riskLevel);
          if (result.hazards.explainability) setExplainData(result.hazards.explainability);

          const match = updatedPlaces.find(
            p => p.id === locId || p.id.includes(locId) || locId.includes(p.id) || p.name.toLowerCase().includes(result.active.name.toLowerCase())
          );
          if (match) {
            setSelected(match);
          } else {
            setSelected({
              id: result.active.id,
              name: result.active.name,
              lat: result.active.lat,
              long: result.active.long,
              hazard: (result.hazards.probabilities?.cloudburst >= 70 ? 'Cloudburst' : 'Flash Flood'),
              prob: Math.max(result.hazards.probabilities?.cloudburst || 0, result.hazards.probabilities?.flood || 0),
              level: result.hazards.riskLevel || 'HIGH',
              lead: result.hazards.leadTime || '1 hr',
              signals: result.hazards.triggerSignature || ''
            });
          }
        }
      }
    } catch (e) {
      console.warn('Location select error:', e);
    }
  };

  // Acknowledge alert and persist state
  const handleAcknowledgeAlert = async (id: number) => {
    try {
      const updated = await api.acknowledgeAlert(id);
      if (updated) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const, acknowledgedAt: new Date().toISOString() } : a));
      }
    } catch (e) {
      console.warn('Alert ack error:', e);
      // Optimistic fallback
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const } : a));
    }
  };

  // Jump to map view and focus hazard zone
  const handleViewAlertOnMap = (alertItem: AlertItem) => {
    const match = places.find(p => p.name.toLowerCase().includes(alertItem.location.toLowerCase()) || alertItem.location.toLowerCase().includes(p.name.toLowerCase()));
    if (match) setSelected(match);
    setPage('Live Risk Map');
  };

  // Run Nowcast Simulation
  const runSimulation = async () => {
    if (simulating) return;
    setSimulating(true);
    setSimStep(0);

    // Visual step progression in sync with backend pipeline simulation
    let s = 0;
    const stepInterval = setInterval(() => {
      s++;
      setSimStep(s);
      if (s >= 6) {
        clearInterval(stepInterval);
      }
    }, 550);

    try {
      const result = await api.runSimulation();
      // Ensure visual steps finish cleanly before resolving modal
      setTimeout(() => {
        clearInterval(stepInterval);
        setSimStep(6);
        if (result && result.success) {
          if (result.mode === 'REAL_AI_MODEL_INFERENCE') setAiModelMode(true);
          if (result.forecast) setForecast(result.forecast);
          if (result.signals) setSignals(result.signals);
          if (result.alerts) setAlerts(result.alerts);
          if (result.scenarioName) setScenarioName(result.scenarioName);
          if (result.simulatedTimestamp) setSimTimestamp(result.simulatedTimestamp);
          if (result.hazards) {
            if (result.hazards.places) setPlaces(result.hazards.places);
            if (result.hazards.centers) setCenters(result.hazards.centers);
            if (result.hazards.explainability) setExplainData(result.hazards.explainability);
            if (result.hazards.leadTime) setPriorityLead(result.hazards.leadTime);
            if (result.hazards.triggerSignature) setTriggerSignature(result.hazards.triggerSignature);
            if (result.hazards.riskLevel) setPriorityRiskLevel(result.hazards.riskLevel);
          }
        }
        setTimeout(() => setSimulating(false), 450);
      }, 3400);
    } catch (err) {
      console.warn('Simulation run failed:', err);
      setTimeout(() => setSimulating(false), 2000);
    }
  };

  const currentFc = forecast[hour] || forecast[3] || { cloudburst: 82, flood: 67, storm: 91 };
  const currentCloud = currentFc.cloudburst;
  const currentFlood = currentFc.flood;
  const currentStorm = currentFc.storm;

  const activeAlertsCount = useMemo(() => alerts.filter(a => a.status !== 'ACKNOWLEDGED').length, [alerts]);
  const visibleAlerts = useMemo(() => alerts.filter(a => filter === 'All' || a.severity === filter), [alerts, filter]);

  const toggle = (k: keyof typeof layers) => setLayers(v => ({ ...v, [k]: !v[k] }));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Siren size={21} /></div>
          <div><strong>VAJRA</strong><span>DYNAMINDS</span></div>
        </div>
        <div className="sih-badge">SIH 2026 <i>•</i> PS 26077</div>
        <div className="nav-label">COMMAND CENTER</div>
        <nav>
          {nav.map(([label, I]) => (
            <button key={label} onClick={() => setPage(label)} className={page === label ? 'nav-active' : ''}>
              <I size={18} />
              <span>{label}</span>
              {label === 'Alerts' && activeAlertsCount > 0 && <b>{activeAlertsCount}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="engine">
            <div className="engine-orb"><Cpu size={16} /></div>
            <div>
              <strong>AI Nowcasting Engine</strong>
              <span style={{ color: aiConnected || aiModelMode ? '#4ade80' : 'inherit' }}>
                <i style={{ background: aiConnected || aiModelMode ? '#22c55e' : 'inherit' }} /> {aiConnected || aiModelMode ? 'ConvLSTM ONLINE' : 'SIMULATED'}
              </span>
            </div>
          </div>
          <div className="proto">{aiConnected || aiModelMode ? 'KEDARNATH 2013 MODEL ACTIVE' : 'PROTOTYPE ENVIRONMENT'}</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mobile-brand"><Menu size={20} /><strong>VAJRA</strong></div>
          <div className="title-wrap">
            <span className="live-dot" />
            <div>
              <h1>{page === 'Overview' ? 'Live Severe-Weather Risk Map' : page}</h1>
              <p>{activeLocation ? `${activeLocation.name} • ${activeLocation.elevation}` : 'Rudraprayag District • Uttarakhand'}</p>
            </div>
          </div>
          <div className="top-actions">
            {/* Live AI Engine Status Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: aiConnected || aiModelMode ? 'rgba(34, 197, 94, 0.12)' : 'rgba(148, 163, 184, 0.1)',
              border: `1px solid ${aiConnected || aiModelMode ? 'rgba(34, 197, 94, 0.35)' : 'rgba(148, 163, 184, 0.2)'}`,
              fontSize: '11px',
              fontWeight: 700,
              color: aiConnected || aiModelMode ? '#4ade80' : '#94a3b8'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: aiConnected || aiModelMode ? '#22c55e' : '#94a3b8',
                boxShadow: aiConnected || aiModelMode ? '0 0 8px #22c55e' : 'none'
              }} />
              {aiConnected || aiModelMode ? 'AI ENGINE: ConvLSTM (ONLINE)' : 'ENGINE: SIMULATION'}
            </div>

            <div className="sim-time">
              <span>SIMULATION TIME</span>
              <strong>{simTimestamp.includes('•') ? simTimestamp : `06 SEP 2026 • 18:${String(30 + hour).padStart(2, '0')} IST`}</strong>
            </div>

            <button
              className="primary-btn sim-btn"
              onClick={runSimulation}
              disabled={simulating}
              title="Run 6-stage AI nowcasting simulation pipeline"
            >
              <Play size={13} /> Run Nowcast Simulation
            </button>

            <button className="icon-btn" onClick={() => setPage('Alerts')} title="Active Alerts Queue">
              <Bell size={18} />
              {activeAlertsCount > 0 && <em />}
            </button>

            <div ref={locationMenuRef} style={{ position: 'relative' }}>
              <button
                className="location-btn"
                onClick={() => setLocationMenuOpen(!locationMenuOpen)}
                title="Select monitoring focus zone"
              >
                <MapPinned size={15} />
                {activeLocation?.name ? activeLocation.name.toUpperCase().split(' ')[0] : 'RUDRAPRAYAG'}
                <ChevronDown size={14} />
              </button>

              {locationMenuOpen && (
                <div className="location-dropdown">
                  <div style={{ padding: '4px 8px', fontSize: '8px', color: '#5f758e', letterSpacing: '0.12em', fontWeight: 700 }}>
                    MONITORED DISTRICT ZONES
                  </div>
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      className={`location-dropdown-item ${activeLocation?.id === loc.id ? 'active' : ''}`}
                      onClick={() => handleSelectLocation(loc.id)}
                    >
                      <strong>{loc.name}</strong>
                      <span>{loc.type} • {loc.elevation}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          {page === 'Overview' && (
            <Overview
              hour={hour}
              setHour={handleHourChange}
              hazard={hazard}
              setHazard={setHazard}
              layers={layers}
              toggle={toggle}
              currentCloud={currentCloud}
              currentFlood={currentFlood}
              currentStorm={currentStorm}
              showExplain={showExplain}
              setShowExplain={setShowExplain}
              simulating={simulating}
              simStep={simStep}
              runSimulation={runSimulation}
              selected={selected}
              setSelected={setSelected}
              places={places}
              centers={centers}
              forecast={forecast}
              signals={signals}
              priorityLead={priorityLead}
              triggerSignature={triggerSignature}
              priorityRiskLevel={priorityRiskLevel}
              scenarioName={scenarioName}
              activeLocation={activeLocation}
              onSelectLocation={handleSelectLocation}
            />
          )}
          {page === 'Live Risk Map' && (
            <MapPage
              hour={hour}
              setHour={handleHourChange}
              hazard={hazard}
              setHazard={setHazard}
              layers={layers}
              toggle={toggle}
              selected={selected}
              setSelected={setSelected}
              currentCloud={currentCloud}
              currentFlood={currentFlood}
              currentStorm={currentStorm}
              places={places}
              centers={centers}
              forecast={forecast}
              runSimulation={runSimulation}
              activeLocation={activeLocation}
              onSelectLocation={handleSelectLocation}
            />
          )}
          {page === 'Weather Signals' && <SignalsPage signals={signals} />}
          {page === 'Alerts' && (
            <AlertsPage
              visibleAlerts={visibleAlerts}
              filter={filter}
              setFilter={setFilter}
              onAcknowledge={handleAcknowledgeAlert}
              onViewOnMap={handleViewAlertOnMap}
            />
          )}
          {page === 'Historical Events' && <HistoricalPage onRunNowcast={() => { runSimulation(); setPage('Overview'); }} />}
          {page === 'Model Insights' && <ModelPage />}
          {page === 'System Status' && <StatusPage onRunTest={runSimulation} />}
        </div>
      </main>

      {showExplain && <ExplainPanel onClose={() => setShowExplain(false)} data={explainData} />}
    </div>
  )
}

function DemoFlag() {
  return (
    <div className="demo-flag">
      <Radar size={14} /> DEMO / SIMULATION MODE{' '}
      <span>— Mock values only • Deterministic prototype AI outputs for SIH 2026</span>
    </div>
  )
}

function Overview(p: any) {
  return (
    <>
      <DemoFlag />
      <section className="hero-grid">
        <div className="map-panel">
          <div className="panel-toolbar">
            <div>
              <div className="kicker">HYPER-LOCAL RISK LAYER</div>
              <h2>Live Hazard Field <span>•</span> 0–6 hour nowcast</h2>
            </div>
            <div className="hazard-tabs">
              {(['All', 'Cloudburst', 'Flash Flood', 'Thunderstorm'] as const).map(x => (
                <button key={x} className={p.hazard === x ? 'active' : ''} onClick={() => p.setHazard(x)}>
                  {x}
                </button>
              ))}
            </div>
          </div>
          <div className="map-wrap">
            <MapView
              hour={p.hour}
              layers={p.layers}
              hazard={p.hazard}
              selected={p.selected}
              activeLocation={p.activeLocation}
              setSelected={(place) => {
                p.setSelected(place);
                if (p.onSelectLocation) p.onSelectLocation(place.id);
              }}
              places={p.places}
              centers={p.centers}
            />
            <div className="map-legend">
              <strong>RISK INTENSITY</strong>
              <span><i className="red" /> HIGH</span>
              <span><i className="orange" /> MODERATE</span>
              <span><i className="yellow" /> WATCH</span>
            </div>
            <div className="layer-stack">
              {[
                ['risk', 'Risk'],
                ['terrain', 'DEM / Terrain'],
                ['roads', 'Roads'],
                ['population', 'Population'],
                ['rivers', 'Rivers']
              ].map(([k, label]) => {
                const isOn = !!p.layers[k];
                return (
                  <button
                    key={k}
                    className={isOn ? 'on' : ''}
                    onClick={() => p.toggle(k)}
                    title={`Toggle ${label} layer (${isOn ? 'Active' : 'Hidden'})`}
                  >
                    <Layers3 size={13} />
                    <span>{label}</span>
                    <span className={`layer-badge-dot ${isOn ? 'active' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <AlertCard {...p} />
      </section>
      <section className="below-grid">
        <Signals strip signals={p.signals} />
        <NowcastCard
          hour={p.hour}
          setHour={p.setHour}
          currentCloud={p.currentCloud}
          currentFlood={p.currentFlood}
          currentStorm={p.currentStorm}
          forecast={p.forecast}
          runSimulation={p.runSimulation}
        />
      </section>
      <Pipeline />
      {p.simulating && <SimulationOverlay step={p.simStep} />}
    </>
  )
}

function AlertCard(p: any) {
  const targetPlace = p.selected || (p.places && p.places.length > 0 ? p.places[0] : null);
  return (
    <div className="alert-panel">
      <div className="alert-label">
        <div className="pulse-icon"><AlertTriangle size={19} /></div>
        <span>PRIORITY ALERT <b>ACTIVE</b></span>
      </div>
      <div className="alert-title">
        <div>
          <div className="kicker">{p.currentCloud >= p.currentFlood ? 'CLOUDBURST RISK' : 'FLASH FLOOD RISK'}</div>
          <h2>{p.activeLocation?.name || targetPlace?.name || 'Rudraprayag District'}</h2>
        </div>
        <div className="risk-badge">{p.priorityRiskLevel || 'HIGH'}</div>
      </div>
      <div className="lead">
        <span>ESTIMATED LEAD TIME</span>
        <strong>{p.priorityLead || '~3 hours'}</strong>
      </div>
      <div className="trigger-box">
        <span>TRIGGER SIGNATURE</span>
        <strong>{p.triggerSignature || 'IWV surge + CAPE increase'}</strong>
        <small>AI-fused nowcast alert logic • SRTM 30m terrain overlay</small>
      </div>
      {[
        ['Cloudburst', p.currentCloud],
        ['Flash Flood', p.currentFlood],
        ['Thunderstorm', p.currentStorm]
      ].map(([n, v]) => (
        <div className="prob-row" key={n}>
          <div>
            <span>{n}</span>
            <strong>{v}%</strong>
          </div>
          <div className="progress">
            <i style={{ width: `${v}%` }} />
          </div>
        </div>
      ))}
      <div className="alert-actions">
        <button onClick={() => p.setShowExplain(true)}>
          <Sparkles size={15} /> View Explainability
        </button>
        <button onClick={() => targetPlace && p.setSelected(targetPlace)} className="ghost">
          <MapPinned size={15} /> Focus Risk Zone
        </button>
      </div>
    </div>
  )
}

function Signals({ strip = false, signals }: { strip?: boolean; signals?: SignalItem[] }) {
  const activeSignals = signals && signals.length > 0 ? signals : (initialSignals as SignalItem[]);
  return (
    <div className={strip ? 'signals-strip' : ''}>
      <div className="section-top">
        <div>
          <div className="kicker">ATMOSPHERIC STATE</div>
          <h2>Live Atmospheric Signals</h2>
        </div>
        <span className="simulation-chip">SIMULATED</span>
      </div>
      <div className="signals-grid">
        {activeSignals.map(s => (
          <ChartCard
            key={s.key}
            name={s.key === 'WCONV' ? 'Wind Convergence' : s.key === 'VWS' ? 'Vertical Wind Shear' : s.name}
            value={s.value}
            unit={s.unit}
            trend={s.trend}
            status={s.status}
            series={s.series}
          />
        ))}
      </div>
    </div>
  )
}

function NowcastCard(p: any) {
  const activeForecast: ForecastPoint[] = p.forecast && p.forecast.length > 0 ? p.forecast : initialForecast;
  return (
    <div className="nowcast-card">
      <div className="section-top">
        <div>
          <div className="kicker">FORECAST EVOLUTION</div>
          <h2>Probability Timeline</h2>
        </div>
        <button
          className="refresh"
          onClick={p.runSimulation}
          title="Run Nowcast Simulation on backend"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <div className="timeline">
        {activeForecast.map((f, i) => (
          <button key={f.hour} className={p.hour === i ? 'active' : ''} onClick={() => p.setHour(i)}>
            <span>{f.label}</span>
            <strong>{f.cloudburst}%</strong>
          </button>
        ))}
      </div>
      <div className="timeline-chart">
        <div className="timeline-grid">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>
        <div className="spark-area">
          <div className="spark-line cloud">
            {activeForecast.map((f, i) => (
              <i key={i} style={{ left: `${i * 16.66}%`, bottom: `${f.cloudburst}%` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="three-prob">
        <div>
          <span>Cloudburst</span>
          <strong>{p.currentCloud}%</strong>
        </div>
        <div>
          <span>Flash Flood</span>
          <strong>{p.currentFlood}%</strong>
        </div>
        <div>
          <span>Thunderstorm</span>
          <strong>{p.currentStorm}%</strong>
        </div>
      </div>
    </div>
  )
}

function MapPage(p: any) {
  return (
    <>
      <DemoFlag />
      <div className="map-page-grid">
        <div className="map-panel full">
          <div className="panel-toolbar">
            <div>
              <div className="kicker">GIS COMMAND VIEW</div>
              <h2>Hyper-Local Risk Map</h2>
            </div>
            <div className="hazard-tabs">
              {(['All', 'Cloudburst', 'Flash Flood', 'Thunderstorm'] as const).map(x => (
                <button key={x} className={p.hazard === x ? 'active' : ''} onClick={() => p.setHazard(x)}>
                  {x}
                </button>
              ))}
            </div>
          </div>
          <div className="map-wrap large">
            <MapView
              hour={p.hour}
              layers={p.layers}
              hazard={p.hazard}
              selected={p.selected}
              activeLocation={p.activeLocation}
              setSelected={(place) => {
                p.setSelected(place);
                if (p.onSelectLocation) p.onSelectLocation(place.id);
              }}
              places={p.places}
              centers={p.centers}
            />
            <div className="map-legend">
              <strong>RISK INTENSITY</strong>
              <span><i className="red" /> HIGH</span>
              <span><i className="orange" /> MODERATE</span>
              <span><i className="yellow" /> WATCH</span>
            </div>
          </div>
        </div>
        <div className="control-panel">
          <div className="kicker">LAYER CONTROL</div>
          {[
            ['risk', 'Cloudburst / Hazard Zones'],
            ['terrain', 'DEM / Slope Overlay'],
            ['roads', 'Road Network'],
            ['population', 'Population / Vulnerability'],
            ['rivers', 'Rivers / Drainage']
          ].map(([k, n]) => (
            <button key={k} onClick={() => p.toggle(k)}>
              <span className={p.layers[k] ? 'switch on' : 'switch'} />
              {n}
              <Check size={15} className={p.layers[k] ? 'check-on' : 'check-off'} />
            </button>
          ))}
          <div className="selected-box">
            <div className="kicker">SELECTED LOCATION</div>
            <h3>{p.selected?.name || 'No zone selected'}</h3>
            <p>{p.selected ? `${p.selected.hazard} • ${p.selected.level} • ${p.selected.prob}%` : 'Click a hazard marker on the map.'}</p>
          </div>
          <NowcastCard {...p} />
        </div>
      </div>
    </>
  )
}

function SignalsPage({ signals }: { signals?: SignalItem[] }) {
  return (
    <>
      <DemoFlag />
      <Signals signals={signals} />
      <div className="source-strip">
        <div>
          <Radar size={18} />
          <strong>INSAT-3D/3DR</strong>
          <span>IWV • CTT • rain-linked observations</span>
        </div>
        <div>
          <Database />
          <strong>IMDAA</strong>
          <span>CAPE • CIN • humidity • winds</span>
        </div>
        <div>
          <MapPinned />
          <strong>DEM / SRTM</strong>
          <span>Elevation • slope • drainage</span>
        </div>
      </div>
    </>
  )
}

function AlertsPage({
  visibleAlerts,
  filter,
  setFilter,
  onAcknowledge,
  onViewOnMap
}: {
  visibleAlerts: AlertItem[];
  filter: string;
  setFilter: (f: string) => void;
  onAcknowledge: (id: number) => void;
  onViewOnMap: (a: AlertItem) => void;
}) {
  const filters = ['All', 'HIGH', 'MODERATE', 'WATCH'];
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="kicker">INCIDENT MANAGEMENT</div>
          <h2>Active Alerts & Decision Queue</h2>
          <p>Prioritized hazard signals for district response teams with stateful acknowledgement.</p>
        </div>
        <button className="primary-btn">
          <FileWarning size={16} /> Generate Alert Report
        </button>
      </div>
      <div className="filterbar">
        {filters.map(f => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            <SlidersHorizontal size={14} />
            {f}
          </button>
        ))}
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Severity</th>
              <th>Event</th>
              <th>Location</th>
              <th>Probability</th>
              <th>Lead Time</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleAlerts.map(a => (
              <tr key={a.id}>
                <td>
                  <span className={`severity ${a.severity.toLowerCase()}`}>{a.severity}</span>
                </td>
                <td><strong>{a.event}</strong></td>
                <td>{a.location}</td>
                <td><strong>{a.prob}%</strong></td>
                <td>{a.lead}</td>
                <td>{a.trigger}</td>
                <td>
                  <span className={a.status === 'ACKNOWLEDGED' ? 'active-status ack' : 'active-status'}>
                    <i /> {a.status}
                  </span>
                </td>
                <td>
                  <button className="row-btn" onClick={() => onViewOnMap(a)}>View on Map</button>
                  {a.status !== 'ACKNOWLEDGED' ? (
                    <button className="row-btn" onClick={() => onAcknowledge(a.id)}>Acknowledge</button>
                  ) : (
                    <span style={{ fontSize: '8px', color: '#5eead4', padding: '6px 4px' }}>Acknowledged</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="response-card">
        <div>
          <div className="kicker">RECOMMENDED RESPONSE</div>
          <h3>Consider targeted advisory for high-confidence zones</h3>
          <p>Prototype recommendation layer • Authority action remains human-controlled.</p>
        </div>
        <div className="response-icons">
          <span><Siren /> Alert</span>
          <span><MapPinned /> Evacuate</span>
          <span><Waves /> Monitor river</span>
        </div>
      </div>
    </>
  )
}

function HistoricalPage({ onRunNowcast }: { onRunNowcast: () => void }) {
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="kicker">HISTORICAL EVENTS</div>
          <h2>Kedarnath — June 2013</h2>
          <p>Trained AI Case Study • ConvLSTM Spatio-Temporal Nowcasting over Mandakini Valley.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="retro-chip" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
            AI CHECKPOINT ACTIVE
          </span>
          <button className="primary-btn" onClick={onRunNowcast} style={{ background: '#0284c7' }}>
            <Play size={14} /> Run Kedarnath 2013 AI Nowcast
          </button>
        </div>
      </div>
      <div className="history-grid">
        <div className="history-card">
          <div className="event-year">2013</div>
          <div className="timeline-events">
            {[
              ['01', 'Historical Trigger (June 13–15)', 'Premature Arabian Sea monsoon surge collided with mid-latitude Western Disturbance trough over Garhwal Himalayas.'],
              ['02', 'Orographic Locking (June 15–16)', 'Deep convective cell trapped in Mandakini valley chimney; CTT glaciated to -65°C with IWV > 45 kg/m².'],
              ['03', 'Torrential Cloudburst (June 16 evening)', 'Over 325 mm rainfall in 24 hours with localized burst rates exceeding 60-70 mm/hr.'],
              ['04', 'Chorabari Lake Breach & Flash Flood (June 17)', 'Glacial moraine failure unleashed massive debris surge down Rambara, Gaurikund, and downstream to Rudraprayag.']
            ].map(([n, t, d]) => (
              <div className="history-step" key={n}>
                <span>{n}</span>
                <div>
                  <strong>{t}</strong>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="how-card">
          <div className="kicker">HOW VAJRA CONVLSTM ASSISTS</div>
          <h3>0–6 Hour Lead Time with 100% Severe POD</h3>
          <div className="hypo-map">
            <div className="mountain m1" />
            <div className="mountain m2" />
            <div className="river-line" />
            <div className="hotspot h1" />
            <div className="hotspot h2" />
            <span>AI RISK VECTOR FIELD</span>
          </div>
          <p>Trained on Mandakini catchment topography (890m to 3,960m) fused with ERA5 reanalysis and satellite infrared lapse rates.</p>
          <div className="target-box">
            <Gauge />
            <div>
              <span>Verification POD</span>
              <strong style={{ color: '#22c55e' }}>100% / 99.8%</strong>
            </div>
            <div>
              <span>Model Threat Score</span>
              <strong style={{ color: '#38bdf8' }}>CSI: 0.410</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function ModelPage() {
  return (
    <>
      <DemoFlag />
      <Pipeline />

      {/* AI Model Trained Checkpoint Metrics Card */}
      <div style={{
        margin: '16px 0 24px 0',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(30, 41, 59, 0.6) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div className="kicker" style={{ color: '#38bdf8' }}>ACTIVE NEURAL CHECKPOINT</div>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '18px' }}>VajraNowcastNet (ConvLSTM + Dual-Head) • Kedarnath 2013</h3>
          </div>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(34, 197, 94, 0.2)',
            color: '#4ade80',
            border: '1px solid rgba(34, 197, 94, 0.3)'
          }}>
            ● TRAINED WEIGHTS LOADED
          </span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginTop: '12px'
        }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>Best Validation Loss</span>
            <strong style={{ fontSize: '18px', color: '#f8fafc' }}>0.2189</strong>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Epoch 7 Checkpoint</span>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>Heavy Rain POD</span>
            <strong style={{ fontSize: '18px', color: '#22c55e' }}>100.0%</strong>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Detection (≥ 20mm/hr)</span>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>Cloudburst POD</span>
            <strong style={{ fontSize: '18px', color: '#22c55e' }}>99.8%</strong>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Detection (≥ 40mm/hr)</span>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>Critical Success Index</span>
            <strong style={{ fontSize: '18px', color: '#38bdf8' }}>0.410</strong>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Threat Score (CSI)</span>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>Inference Latency</span>
            <strong style={{ fontSize: '18px', color: '#facc15' }}>&lt; 35 ms</strong>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Local CPU forward pass</span>
          </div>
        </div>
      </div>

      <div className="architecture-grid">
        <div className="arch-card">
          <div className="kicker">MULTI-HAZARD OUTPUT</div>
          <h3>One fused grid, three hazard probabilities</h3>
          <div className="hazard-output">
            <div>
              <CloudLightning />
              <span>Thunderstorm</span>
              <strong>0–6h</strong>
            </div>
            <div>
              <Waves />
              <span>Cloudburst</span>
              <strong>0–6h</strong>
            </div>
            <div>
              <AlertTriangle />
              <span>Flash Flood</span>
              <strong>0–6h + DEM</strong>
            </div>
          </div>
        </div>
        <div className="arch-card">
          <div className="kicker">TECHNICAL POSITIONING</div>
          <h3>Dual-Engine Architecture</h3>
          <p>Active engine: Real PyTorch ConvLSTM neural model trained on the Mandakini catchment (June 2013) with automated fallback to deterministic simulation.</p>
          <div className="roadmap">
            <span style={{ color: '#22c55e', borderColor: '#22c55e' }}><b>01</b> Data ready (ERA5+DEM)</span>
            <span style={{ color: '#22c55e', borderColor: '#22c55e' }}><b>02</b> ConvLSTM Trained</span>
            <span style={{ color: '#22c55e', borderColor: '#22c55e' }}><b>03</b> CSI/POD Validated</span>
            <span style={{ color: '#22c55e', borderColor: '#22c55e' }}><b>04</b> API Serving</span>
          </div>
        </div>
      </div>
    </>
  )
}

function StatusPage({ onRunTest }: { onRunTest: () => void }) {
  const rows = [
    ['Satellite Feed', 'CONNECTED', Radar],
    ['Atmospheric Data', 'CONNECTED', Database],
    ['Terrain Data', 'AVAILABLE', MapPinned],
    ['AI Engine', 'ONLINE', Cpu],
    ['Risk Mapping', 'ONLINE', Layers3],
    ['Alert API', 'ONLINE', Bell],
    ['Dashboard', 'ONLINE', Activity]
  ] as const;

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="kicker">SYSTEM STATUS</div>
          <h2>Prototype Health & Readiness</h2>
          <p>Local backend connected at /api/* • Deterministic simulation engine active.</p>
        </div>
        <span className="online-badge"><i /> PROTOTYPE ENVIRONMENT</span>
      </div>
      <div className="status-grid">
        {rows.map(([n, s, I]) => (
          <div className="status-card" key={n}>
            <div className="status-icon"><I size={20} /></div>
            <div>
              <span>{n}</span>
              <strong>{s}</strong>
            </div>
            <Check size={18} />
          </div>
        ))}
      </div>
      <div className="status-footer">
        <div>
          <Activity size={17} />
          <strong>End-to-end demo path</strong>
          <span>Input fusion → nowcast → terrain overlay → explainable alert</span>
        </div>
        <button className="primary-btn" onClick={onRunTest}>
          <Play size={15} /> Run System Self-Test
        </button>
      </div>
    </>
  )
}

export default App

function SimulationOverlay({ step }: { step: number }) {
  const steps = [
    'Processing satellite frames (INSAT-3D/3DR)...',
    'Fusing atmospheric signals (IMDAA reanalysis)...',
    'Running spatiotemporal AI model (ConvLSTM + Transformer)...',
    'Generating probability maps (+0h to +6h)...',
    'Applying DEM terrain & drainage flow logic...',
    'Generating explainable alert & civil advisory...'
  ];

  return (
    <div className="sim-overlay">
      <div className="sim-modal">
        <div className="sim-orbit"><Radar size={28} /></div>
        <div className="kicker">VAJRA NOWCAST ENGINE</div>
        <h2>Running simulation</h2>
        <p>Deterministic prototype pipeline • /api/simulation request in progress</p>
        <div className="sim-steps">
          {steps.map((x, i) => (
            <div className={i < step ? 'done' : i === step ? 'current' : ''} key={x}>
              <span>
                {i < step ? <Check size={13} /> : i === step ? <RefreshCw className="spin" size={13} /> : i + 1}
              </span>
              <span>{x}</span>
            </div>
          ))}
        </div>
        <div className="sim-progress">
          <i style={{ width: `${Math.min(100, Math.round((step / 6) * 100))}%` }} />
        </div>
      </div>
    </div>
  )
}
