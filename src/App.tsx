import { useEffect, useMemo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Activity, AlertTriangle, Bell, Check, CheckCheck, ChevronDown, CloudLightning, Cpu, Database, Download, FileWarning, Gauge, History, Layers3, MapPinned, Menu, Play, Printer, Radar, RefreshCw, RotateCcw, Search, ShieldCheck, Siren, SlidersHorizontal, Sparkles, Waves, X } from 'lucide-react'
import MapView, { type PlaceZone, type RiskCenter } from './components/MapView'
import ChartCard from './components/ChartCard'
import Pipeline from './components/Pipeline'
import ExplainPanel from './components/ExplainPanel'
import HistoricalView from './components/HistoricalView'
import ModelView from './components/ModelView'
import { alerts as initialAlerts, forecast as initialForecast, places as initialPlaces, signals as initialSignals, type Hazard } from './data/mock'
import { api, type AlertItem, type AlertReportData, type DistrictLocation, type ExplainabilityData, type ForecastPoint, type SignalItem, type DataLineage } from './api/client'
import { ModelStatusModal } from './components/ModelStatusModal'
import { formatLiveClock, formatObservationBase, getLeadTargetTime } from './utils/nowcastTime'

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

// Levenshtein distance algorithm for typo tolerance in fuzzy matching
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length;
  const n = b.length;
  const v0 = new Array(n + 1);
  const v1 = new Array(n + 1);
  for (let i = 0; i <= n; i++) v0[i] = i;

  for (let i = 0; i < m; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < n; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= n; j++) v0[j] = v1[j];
  }
  return v1[n];
}

// Score how well a target string matches a query string
function fuzzyScoreString(target: string, query: string): { matches: boolean; score: number } {
  const t = target.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return { matches: true, score: 100 };

  // 1. Exact match
  if (t === q) return { matches: true, score: 1000 };

  // 2. Starts with query
  if (t.startsWith(q)) return { matches: true, score: 800 + Math.max(0, 50 - t.length) };

  // 3. Word starts with query
  const words = t.replace(/[/_•,()-]+/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (w === q) return { matches: true, score: 750 };
    if (w.startsWith(q)) return { matches: true, score: 600 + Math.max(0, 30 - w.length) };
  }

  // 4. Substring match
  const idx = t.indexOf(q);
  if (idx !== -1) {
    return { matches: true, score: 400 - Math.min(idx, 100) };
  }

  // 5. Multi-token match
  const qTokens = q.split(/\s+/).filter(Boolean);
  if (qTokens.length > 1) {
    const allFound = qTokens.every(token => t.includes(token));
    if (allFound) return { matches: true, score: 380 };
  }

  // 6. Typo tolerance on words (e.g. nainitl -> nainital, kedrnth -> kedarnath)
  if (q.length >= 3) {
    for (const w of words) {
      if (Math.abs(w.length - q.length) <= 2) {
        const dist = levenshtein(w, q);
        const maxDist = q.length <= 5 ? 1 : 2;
        if (dist <= maxDist) {
          return { matches: true, score: 280 - dist * 40 };
        }
      }
    }
  }

  // 7. Character subsequence match in order
  let ti = 0;
  let qi = 0;
  let consecutive = 0;
  let maxConsecutive = 0;
  let subScore = 0;
  while (ti < t.length && qi < q.length) {
    if (t[ti] === q[qi]) {
      qi++;
      consecutive++;
      if (consecutive > maxConsecutive) maxConsecutive = consecutive;
      subScore += 10 + consecutive * 5;
    } else {
      consecutive = 0;
    }
    ti++;
  }
  if (qi === q.length) {
    const ratio = q.length / t.length;
    return { matches: true, score: 180 + subScore * ratio + maxConsecutive * 15 };
  }

  return { matches: false, score: 0 };
}

function scoreLocation(loc: DistrictLocation, query: string): { matches: boolean; score: number } {
  if (!query.trim()) return { matches: true, score: 100 };
  const nameScore = fuzzyScoreString(loc.name, query);
  const districtScore = fuzzyScoreString(loc.district, query);
  const typeScore = fuzzyScoreString(loc.type || '', query);
  const hazardScore = fuzzyScoreString(loc.hazard || '', query);
  const elevScore = fuzzyScoreString(loc.elevation || '', query);

  const bestScore = Math.max(
    nameScore.matches ? nameScore.score * 1.5 : 0,
    districtScore.matches ? districtScore.score * 1.2 : 0,
    hazardScore.matches ? hazardScore.score * 1.0 : 0,
    typeScore.matches ? typeScore.score * 0.9 : 0,
    elevScore.matches ? elevScore.score * 0.8 : 0
  );

  const isMatch = nameScore.matches || districtScore.matches || typeScore.matches || hazardScore.matches || elevScore.matches;
  return { matches: isMatch, score: isMatch ? bestScore : 0 };
}

function SectorDropdownMenu({
  locations,
  activeLocation,
  onSelectLocation,
  onClose,
  anchorRef,
  anchorAlign = 'right'
}: {
  locations: DistrictLocation[];
  activeLocation?: DistrictLocation | null;
  onSelectLocation: (id: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  anchorAlign?: 'right' | 'left';
}) {
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Position calculation relative to anchor button using viewport coordinates
  useEffect(() => {
    function updateCoords() {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      const panelWidth = Math.min(420, window.innerWidth - 24);
      const top = Math.min(window.innerHeight - 220, rect.bottom + 6);

      if (anchorAlign === 'left') {
        let left = Math.max(12, rect.left);
        if (left + panelWidth > window.innerWidth - 12) {
          left = window.innerWidth - panelWidth - 12;
        }
        setCoords({ top, left });
      } else {
        let right = Math.max(12, window.innerWidth - rect.right);
        if (window.innerWidth - right - panelWidth < 12) {
          right = 12;
        }
        setCoords({ top, right });
      }
    }

    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [anchorRef, anchorAlign]);

  // Outside click and escape handling
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, anchorRef]);

  // Extract distinct districts preserving order
  const districts = useMemo(() => {
    const list: string[] = [];
    locations.forEach(loc => {
      if (loc.district && !list.includes(loc.district)) {
        list.push(loc.district);
      }
    });
    return list;
  }, [locations]);

  // Dynamic counts for each district tab based on search
  const districtCounts = useMemo(() => {
    const q = search.trim();
    const counts: Record<string, number> = { All: 0, Major: 0 };
    districts.forEach(d => { counts[d] = 0; });

    locations.forEach(loc => {
      const match = !q || scoreLocation(loc, q).matches;
      if (match) {
        counts.All++;
        if (loc.isMajor !== false) counts.Major++;
        if (loc.district) {
          counts[loc.district] = (counts[loc.district] || 0) + 1;
        }
      }
    });
    return counts;
  }, [locations, districts, search]);

  // Filter and fuzzy-rank locations
  const filtered = useMemo(() => {
    const q = search.trim();
    let pool = locations;

    if (selectedDistrict === 'Major') {
      pool = pool.filter(l => l.isMajor !== false);
    } else if (selectedDistrict !== 'All') {
      pool = pool.filter(l => l.district === selectedDistrict);
    }

    if (!q) {
      return pool;
    }

    const scored = pool
      .map(loc => ({ loc, ...scoreLocation(loc, q) }))
      .filter(item => item.matches)
      .sort((a, b) => b.score - a.score)
      .map(item => item.loc);

    return scored;
  }, [locations, search, selectedDistrict]);

  // Grouped by district when not actively querying
  const grouped = useMemo(() => {
    const map: Record<string, DistrictLocation[]> = {};
    filtered.forEach(loc => {
      if (!map[loc.district]) map[loc.district] = [];
      map[loc.district].push(loc);
    });
    return map;
  }, [filtered]);

  if (!coords) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={`sector-dropdown-panel floating-portal ${anchorAlign === 'left' ? 'align-left' : 'align-right'}`}
      style={{
        position: 'fixed',
        top: coords.top,
        ...(coords.left !== undefined ? { left: coords.left } : {}),
        ...(coords.right !== undefined ? { right: coords.right } : {}),
        width: Math.min(420, window.innerWidth - 24),
        maxHeight: Math.min(540, window.innerHeight - coords.top - 16),
        zIndex: 99999
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="dropdown-search-bar">
        <Search size={14} style={{ color: '#2dd4bf', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Fuzzy search 53 sectors (e.g. 'nainitl', 'kedrnth', 'gorge')..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && filtered.length > 0) {
              onSelectLocation(filtered[0].id);
              onClose();
            }
          }}
          autoFocus
        />
        {search ? (
          <button className="search-clear-btn" onClick={() => setSearch('')} title="Clear search">
            <X size={12} />
          </button>
        ) : (
          <span className="fuzzy-badge">FUZZY AI</span>
        )}
      </div>

      <div className="district-filter-tabs">
        <button
          className={`district-tab-btn ${selectedDistrict === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedDistrict('All')}
        >
          All ({districtCounts.All})
        </button>
        <button
          className={`district-tab-btn ${selectedDistrict === 'Major' ? 'active' : ''}`}
          onClick={() => setSelectedDistrict('Major')}
        >
          ★ Major ({districtCounts.Major})
        </button>
        {districts.map(d => {
          const count = districtCounts[d] || 0;
          return (
            <button
              key={d}
              className={`district-tab-btn ${selectedDistrict === d ? 'active' : ''} ${count === 0 && search.trim() !== '' ? 'dimmed' : ''}`}
              onClick={() => setSelectedDistrict(d)}
            >
              {d} ({count})
            </button>
          );
        })}
      </div>

      <div className="dropdown-sectors-list">
        {filtered.length === 0 ? (
          <div className="dropdown-empty">
            <p>No Uttarakhand sectors matching "{search}" in {selectedDistrict === 'All' ? 'any district' : selectedDistrict}.</p>
            {selectedDistrict !== 'All' && districtCounts.All > 0 && (
              <button
                className="primary-btn"
                style={{ margin: '8px auto 0', padding: '5px 10px', fontSize: '9px' }}
                onClick={() => setSelectedDistrict('All')}
              >
                Search All Districts ({districtCounts.All} matches)
              </button>
            )}
          </div>
        ) : search.trim() !== '' ? (
          <div className="search-results-list">
            <div className="search-results-header">
              <span>FUZZY RANKED MATCHES FOR "{search}"</span>
              <span className="count-pill">{filtered.length} found</span>
            </div>
            {filtered.map(loc => {
              const isActive = activeLocation?.id === loc.id;
              return (
                <button
                  key={loc.id}
                  className={`sector-item-row ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectLocation(loc.id);
                    onClose();
                  }}
                >
                  <div className="item-row-top">
                    <div className="item-name-wrap">
                      <strong>{loc.name}</strong>
                      {loc.isMajor && <span className="major-pill">MAJOR</span>}
                    </div>
                    {isActive && <span className="loc-active-badge">ACTIVE</span>}
                  </div>
                  <div className="item-row-meta">
                    <span className="district-pill">{loc.district}</span>
                    <span>•</span>
                    <span>{loc.elevation}</span>
                    <span>•</span>
                    <span>{loc.type}</span>
                    {loc.hazard && (
                      <>
                        <span>•</span>
                        <span className="hazard-tag">{loc.hazard}</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          Object.entries(grouped).map(([district, locs]) => (
            <div key={district} className="district-group">
              <div className="district-group-header">
                <span>{district.toUpperCase()} DISTRICT</span>
                <span className="count-pill">{locs.length}</span>
              </div>
              <div className="district-group-items">
                {locs.map(loc => {
                  const isActive = activeLocation?.id === loc.id;
                  return (
                    <button
                      key={loc.id}
                      className={`sector-item-row ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onSelectLocation(loc.id);
                        onClose();
                      }}
                    >
                      <div className="item-row-top">
                        <div className="item-name-wrap">
                          <strong>{loc.name}</strong>
                          {loc.isMajor && <span className="major-pill">MAJOR</span>}
                        </div>
                        {isActive && <span className="loc-active-badge">ACTIVE</span>}
                      </div>
                      <div className="item-row-meta">
                        <span>{loc.elevation}</span>
                        <span>•</span>
                        <span>{loc.type}</span>
                        {loc.hazard && (
                          <>
                            <span>•</span>
                            <span className="hazard-tag">{loc.hazard}</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}

function SectorQuickbar({
  locations,
  activeLocation,
  onSelectLocation
}: {
  locations?: DistrictLocation[];
  activeLocation?: DistrictLocation | null;
  onSelectLocation?: (id: string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  if (!locations || locations.length === 0) return null;

  // Major locations to show directly on the page
  const majorLocations = locations.filter(l => l.isMajor !== false);
  
  // If active location is not in major locations, show it as an additional chip
  const activeIsMajor = majorLocations.some(l => l.id === activeLocation?.id);
  const visibleLocations = activeIsMajor || !activeLocation
    ? majorLocations
    : [...majorLocations, activeLocation];

  return (
    <div className="sector-quickbar">
      <div className="sector-quickbar-label">
        <MapPinned size={12} />
        <span>MAJOR HUBS:</span>
      </div>
      <div className="sector-chips-scroll">
        {visibleLocations.map(loc => {
          const isActive = activeLocation?.id === loc.id;
          const shortName = loc.name.split(' - ')[0].split(' / ')[0];
          return (
            <button
              key={loc.id}
              className={`sector-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectLocation && onSelectLocation(loc.id)}
              title={`${loc.name} (${loc.district} • ${loc.elevation})`}
            >
              <span className="chip-dot" />
              <span className="chip-name">{shortName}</span>
              <span className="chip-elev">{loc.elevation}</span>
              {loc.isMajor && <span className="chip-major-star" title="Major Operational Hub">★</span>}
            </button>
          );
        })}
      </div>

      <div style={{ flexShrink: 0, marginLeft: 'auto' }}>
        <button
          ref={toggleBtnRef}
          className={`sector-dropdown-toggle-btn ${dropdownOpen ? 'open' : ''}`}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          title="Browse all 50+ hyper-local monitoring sectors across Uttarakhand"
        >
          <Layers3 size={13} style={{ color: '#38bdf8' }} />
          <span>All Uttarakhand Sectors ({locations.length})</span>
          <ChevronDown size={13} />
        </button>

        {dropdownOpen && (
          <SectorDropdownMenu
            locations={locations}
            activeLocation={activeLocation}
            onSelectLocation={(id) => {
              if (onSelectLocation) onSelectLocation(id);
              setDropdownOpen(false);
            }}
            onClose={() => setDropdownOpen(false)}
            anchorRef={toggleBtnRef}
            anchorAlign="right"
          />
        )}
      </div>
    </div>
  );
}

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
  const [simTimestamp, setSimTimestamp] = useState('16 JUN 2013 • 17:00 IST');
  const [scenarioName, setScenarioName] = useState('Kedarnath 2013 Peak Cloudburst Window');
  const [priorityLead, setPriorityLead] = useState('Evaluating lead-time...');
  const [triggerSignature, setTriggerSignature] = useState('Awaiting model inference...');
  const [priorityRiskLevel, setPriorityRiskLevel] = useState<'HIGH' | 'MODERATE' | 'WATCH'>('HIGH');
  const [aiConnected, setAiConnected] = useState(false);
  const [aiModelMode, setAiModelMode] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [dataLineage, setDataLineage] = useState<DataLineage | null>(null);

  // Real-time ticking clock for live nowcast tracking
  const [nowDate, setNowDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeTarget = getLeadTargetTime(nowDate, hour);

  const locationBtnRef = useRef<HTMLButtonElement>(null);

  // Fetch initial data from local backend and run live model inference
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [predictRes, locRes, aiStatus] = await Promise.all([
          api.predict({ scenario: 'kedarnath_2013_peak' }).catch(() => null),
          api.getLocations().catch(() => null),
          api.getAiStatus().catch(() => null)
        ]);

        if (!isMounted) return;

        if (aiStatus && aiStatus.connected) {
          setAiConnected(true);
        }

        if (predictRes && predictRes.success) {
          setAiConnected(true);
          setAiModelMode(true);
          if (predictRes.data_lineage) setDataLineage(predictRes.data_lineage);
          if (predictRes.forecast) setForecast(predictRes.forecast);
          if (predictRes.signals) setSignals(predictRes.signals);
          if (predictRes.alerts) setAlerts(predictRes.alerts);
          if (predictRes.places) setPlaces(predictRes.places);
          if (predictRes.centers) setCenters(predictRes.centers);
          if (predictRes.explainability) setExplainData(predictRes.explainability);
          if (predictRes.lead_time) setPriorityLead(predictRes.lead_time);
          if (predictRes.trigger_signature?.[0]) setTriggerSignature(predictRes.trigger_signature[0]);
          if (predictRes.hazards?.severe_thunderstorm) {
            setPriorityRiskLevel(predictRes.hazards.severe_thunderstorm.risk_level);
          }
          if (predictRes.scenario) setScenarioName(predictRes.scenario);
          if (predictRes.data_lineage?.observation_time) {
            setSimTimestamp(predictRes.data_lineage.observation_time);
          }
          if (predictRes.activeLocation) setActiveLocation(predictRes.activeLocation);
          if (predictRes.places && predictRes.places.length > 0) {
            setSelected(predictRes.places[0]);
          }
        } else {
          // Fallback to individual endpoints if predict didn't respond
          const [fcData, sigData, alData, hzData] = await Promise.all([
            api.getForecast().catch(() => initialForecast as ForecastPoint[]),
            api.getSignals().catch(() => initialSignals as SignalItem[]),
            api.getAlerts().catch(() => initialAlerts as AlertItem[]),
            api.getHazards(3).catch(() => null)
          ]);
          if (fcData) setForecast(fcData);
          if (sigData) setSignals(sigData);
          if (alData) setAlerts(alData);
          if (hzData) {
            if (hzData.places) setPlaces(hzData.places);
            if (hzData.centers) setCenters(hzData.centers);
            if (hzData.explainability) setExplainData(hzData.explainability);
            if (hzData.leadTime) setPriorityLead(hzData.leadTime);
            if (hzData.triggerSignature) setTriggerSignature(hzData.triggerSignature);
            if (hzData.riskLevel) setPriorityRiskLevel(hzData.riskLevel);
            if (hzData.data_lineage) setDataLineage(hzData.data_lineage);
            if (!selected && hzData.places && hzData.places.length > 0) {
              setSelected(hzData.places[0]);
            }
          }
        }

        if (locRes && locRes.data) {
          setLocations(locRes.data);
          if (!activeLocation) {
            setActiveLocation(locRes.active || locRes.data[0]);
          }
        }
      } catch (e) {
        console.warn('Initial fetch error:', e);
      }
    }
    loadData();

    return () => {
      isMounted = false;
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
      const timeStr = updated?.acknowledgedAt || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const, acknowledgedAt: timeStr } : a));
    } catch (e) {
      console.warn('Alert ack error:', e);
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const, acknowledgedAt: timeStr } : a));
    }
  };

  // Acknowledge all alerts across Uttarakhand
  const handleAcknowledgeAllAlerts = async () => {
    try {
      const updated = await api.acknowledgeAllAlerts();
      if (updated && updated.length > 0) {
        setAlerts(updated);
      } else {
        const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';
        setAlerts(prev => prev.map(a => ({ ...a, status: 'ACKNOWLEDGED' as const, acknowledgedAt: timeStr })));
      }
    } catch (e) {
      console.warn('Alert ack all error:', e);
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';
      setAlerts(prev => prev.map(a => ({ ...a, status: 'ACKNOWLEDGED' as const, acknowledgedAt: timeStr })));
    }
  };

  // Jump to map view, accurately center the sector on GIS map, and focus hazard zone
  const handleViewAlertOnMap = async (alertItem: AlertItem) => {
    let targetLoc = locations.find(l => l.id === alertItem.locationId || l.name === alertItem.location);
    if (!targetLoc && alertItem.location) {
      targetLoc = locations.find(l =>
        l.name.toLowerCase().includes(alertItem.location.toLowerCase()) ||
        alertItem.location.toLowerCase().includes(l.name.toLowerCase())
      );
    }

    if (targetLoc) {
      await handleSelectLocation(targetLoc.id);
    }

    const lat = alertItem.lat || targetLoc?.lat || 30.735;
    const long = alertItem.long || targetLoc?.long || 79.067;
    setSelected({
      id: targetLoc?.id || alertItem.locationId || 'sector',
      name: alertItem.location,
      lat,
      long,
      hazard: alertItem.event,
      prob: alertItem.prob,
      level: alertItem.severity,
      lead: alertItem.lead,
      signals: alertItem.trigger
    });

    setPage('Live Risk Map');
  };

  // Switch scenario and execute live model inference
  const handleScenarioSelect = async (scenarioId: string) => {
    setSimulating(true);
    try {
      const res = await api.predict({ scenario: scenarioId });
      if (res && res.success) {
        setAiModelMode(true);
        if (res.data_lineage) setDataLineage(res.data_lineage);
        if (res.forecast) setForecast(res.forecast);
        if (res.signals) setSignals(res.signals);
        if (res.alerts) setAlerts(res.alerts);
        if (res.places) setPlaces(res.places);
        if (res.centers) setCenters(res.centers);
        if (res.explainability) setExplainData(res.explainability);
        if (res.lead_time) setPriorityLead(res.lead_time);
        if (res.trigger_signature?.[0]) setTriggerSignature(res.trigger_signature[0]);
        if (res.hazards?.severe_thunderstorm) {
          setPriorityRiskLevel(res.hazards.severe_thunderstorm.risk_level);
        }
        if (res.scenario) setScenarioName(res.scenario);
        if (res.data_lineage?.observation_time) {
          setSimTimestamp(res.data_lineage.observation_time);
        }
        if (res.activeLocation) setActiveLocation(res.activeLocation);
      }
    } catch (err) {
      console.warn('Scenario switch failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  const simulationAbortRef = useRef<AbortController | null>(null);
  const simIntervalRef = useRef<any>(null);
  const simTimeoutRef = useRef<any>(null);
  const simFinishTimeoutRef = useRef<any>(null);

  // Cancel running Nowcast Simulation
  const cancelSimulation = () => {
    if (simulationAbortRef.current) {
      simulationAbortRef.current.abort();
      simulationAbortRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    if (simTimeoutRef.current) {
      clearTimeout(simTimeoutRef.current);
      simTimeoutRef.current = null;
    }
    if (simFinishTimeoutRef.current) {
      clearTimeout(simFinishTimeoutRef.current);
      simFinishTimeoutRef.current = null;
    }
    setSimulating(false);
    setSimStep(0);
  };

  // Run Nowcast Simulation
  const runSimulation = async (scenarioId?: any) => {
    if (simulating) return;

    // Reset previous timers
    if (simulationAbortRef.current) simulationAbortRef.current.abort();
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
    if (simFinishTimeoutRef.current) clearTimeout(simFinishTimeoutRef.current);

    const abortController = new AbortController();
    simulationAbortRef.current = abortController;

    setSimulating(true);
    setSimStep(0);

    // Visual step progression in sync with backend pipeline simulation
    let s = 0;
    simIntervalRef.current = setInterval(() => {
      s++;
      setSimStep(s);
      if (s >= 6) {
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      }
    }, 550);

    try {
      const result = await api.runSimulation(
        typeof scenarioId === 'string' ? scenarioId : undefined,
        abortController.signal
      );
      // Ensure visual steps finish cleanly before resolving modal
      simTimeoutRef.current = setTimeout(() => {
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        setSimStep(6);
        if (result && result.success) {
          if (result.mode === 'REAL_AI_MODEL_INFERENCE') setAiModelMode(true);
          if (result.data_lineage) setDataLineage(result.data_lineage);
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
            if (result.hazards.data_lineage) setDataLineage(result.hazards.data_lineage);
          }
        }
        simFinishTimeoutRef.current = setTimeout(() => {
          setSimulating(false);
          simulationAbortRef.current = null;
        }, 450);
      }, 3400);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.log('Nowcast simulation aborted by user');
      } else {
        console.warn('Simulation run failed:', err);
      }
      simFinishTimeoutRef.current = setTimeout(() => {
        setSimulating(false);
        simulationAbortRef.current = null;
      }, 300);
    }
  };

  const currentFc = forecast[hour] || forecast[0] || { cloudburst: 0, flood: 0, storm: 0 };
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
          <div className="engine" onClick={() => setModelModalOpen(true)} style={{ cursor: 'pointer' }} title="Inspect AI Model Checkpoint & Traceable Data Lineage">
            <div className="engine-orb"><Cpu size={16} /></div>
            <div>
              <strong>AI Nowcasting Engine</strong>
              <span style={{ color: aiConnected || aiModelMode ? '#4ade80' : 'inherit' }}>
                <i style={{ background: aiConnected || aiModelMode ? '#22c55e' : 'inherit' }} /> {aiConnected || aiModelMode ? 'ConvLSTM ONLINE' : 'SIMULATED'}
              </span>
            </div>
          </div>
          <div className="proto" onClick={() => setModelModalOpen(true)} style={{ cursor: 'pointer' }}>
            {aiConnected || aiModelMode ? '● REAL MODEL LINEAGE ACTIVE ↗' : 'PROTOTYPE ENVIRONMENT'}
          </div>
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
            {/* Live AI Engine Status Pill & Lineage Inspector */}
            <button
              onClick={() => setModelModalOpen(true)}
              title="Click to view AI Model Training Status & Traceable Data Lineage"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: aiConnected || aiModelMode ? 'rgba(34, 197, 94, 0.12)' : 'rgba(148, 163, 184, 0.1)',
                border: `1px solid ${aiConnected || aiModelMode ? 'rgba(34, 197, 94, 0.35)' : 'rgba(148, 163, 184, 0.2)'}`,
                fontSize: '11px',
                fontWeight: 700,
                color: aiConnected || aiModelMode ? '#4ade80' : '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: aiConnected || aiModelMode ? '#22c55e' : '#94a3b8',
                boxShadow: aiConnected || aiModelMode ? '0 0 8px #22c55e' : 'none'
              }} />
              <span>{aiConnected || aiModelMode ? 'AI ENGINE: ConvLSTM + Transformer (ONLINE)' : 'ENGINE: SIMULATION'}</span>
              <span style={{ fontSize: '9px', opacity: 0.8, marginLeft: '2px', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                LINEAGE ↗
              </span>
            </button>

            <div
              className="sim-time"
              title={`Live observation base: ${formatObservationBase(nowDate)}. Active nowcast lead horizon: ${activeTarget.timeStr} (${activeTarget.relativeLabel})`}
            >
              <div className="sim-time-head">
                <span>SIMULATION TIME</span>
                <span className="sim-time-target-pill">
                  TARGET: {activeTarget.timeStr}
                </span>
              </div>
              <strong>{formatLiveClock(nowDate)}</strong>
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

            <div style={{ position: 'relative' }}>
              <button
                ref={locationBtnRef}
                className="location-btn"
                onClick={() => setLocationMenuOpen(!locationMenuOpen)}
                title="Select Uttarakhand monitoring region"
              >
                <MapPinned size={15} style={{ color: '#2dd4bf', flexShrink: 0 }} />
                <div className="loc-btn-text">
                  <span className="loc-btn-label">REGION / SECTOR</span>
                  <strong>{activeLocation?.name || 'Rudraprayag Control Zone'}</strong>
                </div>
                <ChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0, marginLeft: 2 }} />
              </button>

              {locationMenuOpen && (
                <SectorDropdownMenu
                  locations={locations}
                  activeLocation={activeLocation}
                  onSelectLocation={handleSelectLocation}
                  onClose={() => setLocationMenuOpen(false)}
                  anchorRef={locationBtnRef}
                  anchorAlign="right"
                />
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
              locations={locations}
              onSelectLocation={handleSelectLocation}
              aiConnected={aiConnected}
              aiModelMode={aiModelMode}
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onViewAlertOnMap={handleViewAlertOnMap}
              setPage={setPage}
              nowDate={nowDate}
              activeTarget={activeTarget}
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
              locations={locations}
              onSelectLocation={handleSelectLocation}
              aiConnected={aiConnected}
              aiModelMode={aiModelMode}
              nowDate={nowDate}
              activeTarget={activeTarget}
            />
          )}
          {page === 'Weather Signals' && (
            <SignalsPage
              signals={signals}
              locations={locations}
              activeLocation={activeLocation}
              onSelectLocation={handleSelectLocation}
              aiActive={aiConnected || aiModelMode}
              nowDate={nowDate}
            />
          )}
          {page === 'Alerts' && (
            <AlertsPage
              alerts={alerts}
              locations={locations}
              onAcknowledge={handleAcknowledgeAlert}
              onAcknowledgeAll={handleAcknowledgeAllAlerts}
              onViewOnMap={handleViewAlertOnMap}
              onGenerateReport={() => setReportModalOpen(true)}
            />
          )}
          {page === 'Historical Events' && (
            <HistoricalView
              onRunNowcast={(scenarioId, locationId) => {
                runSimulation(scenarioId);
                if (locationId) {
                  const match = places.find(p => p.id === locationId || p.name.toLowerCase().includes(locationId.toLowerCase()));
                  if (match) setSelected(match);
                }
                setPage('Overview');
              }}
            />
          )}
          {page === 'Model Insights' && (
            <>
              <DemoFlag aiActive={aiConnected || aiModelMode} />
              <ModelView aiActive={aiConnected || aiModelMode} />
            </>
          )}
          {page === 'System Status' && (
            <StatusPage
              onRunTest={runSimulation}
              aiConnected={aiConnected}
              aiModelMode={aiModelMode}
            />
          )}
        </div>
      </main>

      {showExplain && <ExplainPanel onClose={() => setShowExplain(false)} data={explainData} />}
      {reportModalOpen && (
        <AlertReportModal
          alerts={alerts}
          activeLocation={activeLocation}
          hazardsSummary={{
            triggerSignature,
            leadTime: priorityLead,
            riskLevel: priorityRiskLevel
          }}
          onClose={() => setReportModalOpen(false)}
        />
      )}
      <ModelStatusModal
        isOpen={modelModalOpen}
        onClose={() => setModelModalOpen(false)}
        dataLineage={dataLineage}
        onRunScenario={handleScenarioSelect}
        currentScenario={scenarioName}
        isSimulating={simulating}
      />
      {simulating && (
        <SimulationOverlay
          step={simStep}
          onCancel={cancelSimulation}
        />
      )}
    </div>
  )
}

function DemoFlag({ aiActive }: { aiActive?: boolean }) {
  if (aiActive) {
    return (
      <div className="demo-flag" style={{ borderColor: 'rgba(45, 212, 191, 0.4)', background: 'rgba(13, 148, 136, 0.12)', color: '#5eead4' }}>
        <Radar size={14} style={{ color: '#2dd4bf' }} />
        <strong style={{ color: '#2dd4bf', letterSpacing: '0.08em' }}>LIVE NEURAL NOWCAST ACTIVE</strong>
        <span style={{ color: '#99f6e4' }}>
          — VajraNowcastNet (ConvLSTM + Dual-Head) • 45-Day Uttarakhand Multi-Sensor Training (Val Loss: 0.0718)
        </span>
      </div>
    );
  }
  return (
    <div className="demo-flag">
      <Radar size={14} /> SIH 2026 EVALUATION MODE{' '}
      <span>— Real PyTorch ConvLSTM Neural Engine Active across 50+ Hyperlocal Uttarakhand Sectors</span>
    </div>
  );
}

function Overview(p: any) {
  return (
    <>
      <DemoFlag aiActive={p.aiConnected || p.aiModelMode} />
      <section className="hero-grid">
        <div className="map-panel">
          <div className="panel-toolbar">
            <div>
              <div className="kicker">HYPER-LOCAL RISK LAYER</div>
              <h2>Live Hazard Field <span>•</span> 0–6 hour nowcast</h2>
              {p.activeTarget && (
                <div className="toolbar-horizon-badge">
                  <span className="hud-indicator-dot" />
                  <span>NOWCAST TARGET: <strong>{p.activeTarget.timeStr}</strong> ({p.activeTarget.relativeLabel})</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span>Base Observation: {p.activeTarget.baseObservationStr}</span>
                </div>
              )}
            </div>
            <div className="hazard-tabs">
              {(['All', 'Cloudburst', 'Flash Flood', 'Thunderstorm'] as const).map(x => (
                <button key={x} className={p.hazard === x ? 'active' : ''} onClick={() => p.setHazard(x)}>
                  {x}
                </button>
              ))}
            </div>
          </div>
          {p.locations && p.locations.length > 0 && (
            <SectorQuickbar
              locations={p.locations}
              activeLocation={p.activeLocation}
              onSelectLocation={p.onSelectLocation}
            />
          )}
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
              nowDate={p.nowDate}
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
        <Signals strip signals={p.signals} aiActive={p.aiConnected || p.aiModelMode} observationTime={p.activeTarget?.baseObservationStr} />
        <NowcastCard
          hour={p.hour}
          setHour={p.setHour}
          currentCloud={p.currentCloud}
          currentFlood={p.currentFlood}
          currentStorm={p.currentStorm}
          forecast={p.forecast}
          runSimulation={p.runSimulation}
          nowDate={p.nowDate}
        />
      </section>
      <Pipeline />
    </>
  )
}

function AlertCard(p: any) {
  const targetPlace = p.selected || (p.places && p.places.length > 0 ? p.places[0] : null);
  
  // Find matching alert from alerts queue for this location
  const locAlert = p.alerts?.find((a: AlertItem) => 
    a.locationId === p.activeLocation?.id || 
    a.location === p.activeLocation?.name ||
    (p.activeLocation?.name && a.location.toLowerCase().includes(p.activeLocation.name.toLowerCase()))
  );
  
  // Or pick top alert
  const topAlert = locAlert || (p.alerts && p.alerts.length > 0 ? p.alerts[0] : null);
  
  const alertLocationName = topAlert?.location || p.activeLocation?.name || targetPlace?.name || 'Kedarnath Shrine Sector';
  const alertDistrict = topAlert?.district || p.activeLocation?.district || 'Rudraprayag';
  const alertSeverity = topAlert?.severity || p.priorityRiskLevel || 'HIGH';
  const alertLead = topAlert?.lead || p.priorityLead || 'Evaluating lead-time...';
  const alertTrigger = topAlert?.trigger || p.triggerSignature || 'Awaiting model inference...';
  const isAck = topAlert?.status === 'ACKNOWLEDGED';

  return (
    <div className="alert-panel">
      <div className="alert-label">
        <div className="pulse-icon"><AlertTriangle size={19} /></div>
        <span>PRIORITY ALERT <b>ACTIVE</b></span>
      </div>
      <div className="alert-title">
        <div>
          <div className="kicker">{topAlert?.event?.toUpperCase() || (p.currentCloud >= p.currentFlood ? 'CLOUDBURST RISK' : 'FLASH FLOOD RISK')}</div>
          <h2>{alertLocationName}</h2>
          <div style={{ fontSize: '8.5px', color: '#38bdf8', marginTop: '2px', fontWeight: 600 }}>
            {alertDistrict} District • {topAlert?.elevation || p.activeLocation?.elevation || '3,584 m'}
          </div>
        </div>
        <div className={`risk-badge ${alertSeverity.toLowerCase()}`}>{alertSeverity}</div>
      </div>

      <div className="lead">
        <div className="lead-main-row">
          <span>ESTIMATED LEAD TIME</span>
          <strong>{alertLead}</strong>
        </div>
        {p.activeTarget && (
          <div className="lead-sub-row">
            <span className="lead-sub-label">
              <span className="hud-indicator-dot" style={{ width: '5px', height: '5px' }} />
              Projected Target Horizon ({p.activeTarget.shortLead}):
            </span>
            <span className="lead-sub-time">{p.activeTarget.timeStr}</span>
          </div>
        )}
      </div>

      <div className="trigger-box">
        <span>TRIGGER SIGNATURE</span>
        <strong>{alertTrigger}</strong>
        {topAlert?.protocol && (
          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #1a2f44', fontSize: '8px', color: '#a5b4fc', fontWeight: 600 }}>
            {topAlert.protocol}
          </div>
        )}
        <small style={{ marginTop: '4px' }}>
          {topAlert?.actionRecommended || 'AI-fused nowcast alert logic • SRTM 30m terrain overlay'}
        </small>
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

      {/* Direct Operator Acknowledgement on Priority Card */}
      {isAck ? (
        <div className="alert-card-ack-badge">
          <Check size={14} />
          <span>Acknowledged by Command ({topAlert?.acknowledgedAt || 'Recorded'})</span>
        </div>
      ) : topAlert ? (
        <button
          className="alert-card-ack-btn"
          onClick={() => p.onAcknowledgeAlert && p.onAcknowledgeAlert(topAlert.id)}
          title="Acknowledge priority alert"
        >
          <Check size={14} />
          <span>Acknowledge Priority Alert</span>
        </button>
      ) : null}

      <div className="alert-actions" style={{ marginTop: '10px' }}>
        <button onClick={() => p.setShowExplain(true)}>
          <Sparkles size={15} /> View Explainability
        </button>
        <button 
          onClick={() => {
            if (topAlert && p.onViewAlertOnMap) {
              p.onViewAlertOnMap(topAlert);
            } else if (targetPlace && p.setSelected) {
              p.setSelected(targetPlace);
              if (p.setPage) p.setPage('Live Risk Map');
            }
          }} 
          className="ghost"
        >
          <MapPinned size={15} /> Focus on GIS Map
        </button>
        {p.setPage && (
          <button 
            onClick={() => p.setPage('Alerts')} 
            className="ghost"
            style={{ fontSize: '8.5px', padding: '6px' }}
          >
            <Siren size={13} style={{ color: '#ef4444' }} />
            <span>Open All Uttarakhand Alerts ({p.alerts?.length || 0})</span>
          </button>
        )}
      </div>
    </div>
  );
}

function Signals({ strip = false, signals, aiActive = false, observationTime }: { strip?: boolean; signals?: SignalItem[]; aiActive?: boolean; observationTime?: string }) {
  const activeSignals = signals && signals.length > 0 ? signals : (initialSignals as SignalItem[]);
  return (
    <div className={strip ? 'signals-strip' : ''}>
      <div className="section-top">
        <div>
          <div className="kicker">ATMOSPHERIC STATE</div>
          <h2>
            Live Atmospheric Signals
            {observationTime && (
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, marginLeft: '8px' }}>
                • Observed at {observationTime}
              </span>
            )}
          </h2>
        </div>
        {aiActive ? (
          <span className="simulation-chip" style={{ color: '#2dd4bf', borderColor: '#14b8a6', background: 'rgba(20, 184, 166, 0.15)' }}>
            ● LIVE SENSOR TELEMETRY
          </span>
        ) : (
          <span className="simulation-chip">SIMULATED</span>
        )}
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
  const currentTarget = getLeadTargetTime(p.nowDate || new Date(), p.hour || 0);
  return (
    <div className="nowcast-card">
      <div className="section-top">
        <div>
          <div className="kicker">FORECAST EVOLUTION</div>
          <h2>Probability Timeline</h2>
          <div className="timeline-horizon-indicator" style={{ marginTop: '4px' }}>
            <span>Target Horizon: <strong>{currentTarget.timeStr}</strong> ({currentTarget.relativeLabel})</span>
          </div>
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
        {activeForecast.map((f, i) => {
          const stepTarget = getLeadTargetTime(p.nowDate || new Date(), i);
          return (
            <button key={f.hour} className={p.hour === i ? 'active' : ''} onClick={() => p.setHour(i)}>
              <span className="tl-lead">{f.label}</span>
              <span className="tl-clock">{stepTarget.clockOnly}</span>
              <strong>{f.cloudburst}%</strong>
            </button>
          );
        })}
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
              {p.activeTarget && (
                <div className="toolbar-horizon-badge">
                  <span className="hud-indicator-dot" />
                  <span>NOWCAST TARGET: <strong>{p.activeTarget.timeStr}</strong> ({p.activeTarget.relativeLabel})</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span>Base Observation: {p.activeTarget.baseObservationStr}</span>
                </div>
              )}
            </div>
            <div className="hazard-tabs">
              {(['All', 'Cloudburst', 'Flash Flood', 'Thunderstorm'] as const).map(x => (
                <button key={x} className={p.hazard === x ? 'active' : ''} onClick={() => p.setHazard(x)}>
                  {x}
                </button>
              ))}
            </div>
          </div>
          {p.locations && p.locations.length > 0 && (
            <SectorQuickbar
              locations={p.locations}
              activeLocation={p.activeLocation}
              onSelectLocation={p.onSelectLocation}
            />
          )}
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
              nowDate={p.nowDate}
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
            <div className="kicker">ACTIVE REGION FOCUS</div>
            <h3>{p.activeLocation?.name || p.selected?.name || 'No zone selected'}</h3>
            <p>{p.activeLocation ? `${p.activeLocation.type} • ${p.activeLocation.elevation} • ${p.activeLocation.district} District` : (p.selected ? `${p.selected.hazard} • ${p.selected.level} • ${p.selected.prob}%` : 'Click a sector above or marker on map.')}</p>
          </div>
          <NowcastCard {...p} />
        </div>
      </div>
    </>
  )
}

function SignalsPage({
  signals,
  locations,
  activeLocation,
  onSelectLocation,
  aiActive,
  nowDate
}: {
  signals?: SignalItem[];
  locations?: DistrictLocation[];
  activeLocation?: DistrictLocation | null;
  onSelectLocation?: (id: string) => void;
  aiActive?: boolean;
  nowDate?: Date;
}) {
  return (
    <>
      <DemoFlag aiActive={aiActive} />
      {locations && locations.length > 0 && (
        <SectorQuickbar
          locations={locations}
          activeLocation={activeLocation}
          onSelectLocation={onSelectLocation}
        />
      )}
      <Signals signals={signals} aiActive={aiActive} observationTime={formatObservationBase(nowDate || new Date())} />
      <div className="source-strip">
        <div>
          <Radar size={18} />
          <strong>INSAT-3D / INSAT-3DR</strong>
          <span>Thermal IR CTT (Glaciation) • Integrated Water Vapour (IWV) Column</span>
        </div>
        <div>
          <Database />
          <strong>IMD & INDAA / ERA5</strong>
          <span>Thermodynamics (CAPE & CIN) • Kinematic Wind Convergence & Shear</span>
        </div>
        <div>
          <MapPinned />
          <strong>SRTM & CartoDEM 30m</strong>
          <span>Himalayan Elevation Gradients • Slope Runoff Acceleration</span>
        </div>
      </div>
    </>
  )
}

function AlertReportModal({
  alerts,
  activeLocation,
  hazardsSummary,
  onClose
}: {
  alerts: AlertItem[];
  activeLocation: DistrictLocation | null;
  hazardsSummary?: { triggerSignature?: string; leadTime?: string; riskLevel?: string };
  onClose: () => void;
}) {
  const [downloaded, setDownloaded] = useState(false);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';
  const bulletinNo = `VAJRA/USDMA/NC-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-01`;

  const highAlerts = alerts.filter(a => a.severity === 'HIGH');
  const modAlerts = alerts.filter(a => a.severity === 'MODERATE');
  const watchAlerts = alerts.filter(a => a.severity === 'WATCH');
  const ackCount = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;

  const affectedDistricts = Array.from(new Set(alerts.map(a => a.district).filter(Boolean))) as string[];

  const handleDownloadJson = () => {
    const data = {
      bulletinNo,
      issuedAt: now.toISOString(),
      formattedTime: `${dateStr} • ${timeStr}`,
      issuingAuthority: 'State Emergency Operations Centre (SEOC) • USDMA Uttarakhand',
      system: 'VAJRA AI Hydrometeorological Spatio-Temporal Nowcaster',
      classification: highAlerts.length > 0 ? 'RED ALERT - IMMEDIATE FIELD ACTION REQUIRED' : 'ORANGE ADVISORY - STANDBY MONITORING',
      summary: {
        totalMonitoredSectors: alerts.length,
        highSeverityCount: highAlerts.length,
        moderateSeverityCount: modAlerts.length,
        watchSeverityCount: watchAlerts.length,
        acknowledgedCount: ackCount,
        activeDistricts: affectedDistricts
      },
      activeSectors: alerts
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bulletinNo.replace(/\//g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="alert-report-modal-backdrop" onClick={onClose}>
      <div className="alert-report-modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="alert-report-toolbar no-print">
          <div className="alert-report-toolbar-left">
            <span className="bulletin-badge">OFFICIAL CIVIL DEFENSE BULLETIN</span>
            <span className="bulletin-ref">{bulletinNo}</span>
          </div>
          <div className="alert-report-toolbar-right">
            <button className="report-btn print-btn" onClick={handlePrint} title="Print or save as PDF">
              <Printer size={14} /> Print / Save PDF
            </button>
            <button className="report-btn download-btn" onClick={handleDownloadJson} title="Export JSON telemetry bulletin">
              <Download size={14} /> {downloaded ? 'Downloaded ✓' : 'Export JSON'}
            </button>
            <button className="report-btn close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="alert-report-document" id="printable-bulletin">
          {/* Official Gov Header */}
          <div className="report-gov-header">
            <div className="report-gov-emblem">
              <ShieldCheck size={36} color="#0284c7" />
            </div>
            <div className="report-gov-titles">
              <div className="report-gov-main">GOVERNMENT OF UTTARAKHAND</div>
              <div className="report-gov-dept">STATE DISASTER MANAGEMENT AUTHORITY (USDMA)</div>
              <div className="report-gov-sub">STATE EMERGENCY OPERATIONS CENTRE (SEOC), DEHRADUN</div>
              <div className="report-bulletin-title">SPECIAL CONVECTIVE NOWCAST & HYDROMETEOROLOGICAL ADVISORY</div>
            </div>
          </div>

          <div className="report-metadata-bar">
            <div>
              <span className="meta-label">BULLETIN NO:</span>
              <span className="meta-val">{bulletinNo}</span>
            </div>
            <div>
              <span className="meta-label">ISSUANCE TIME:</span>
              <span className="meta-val">{dateStr} • {timeStr}</span>
            </div>
            <div>
              <span className="meta-label">VALIDITY HORIZON:</span>
              <span className="meta-val">00:00 – 06:00 Hours Lead Time</span>
            </div>
            <div>
              <span className="meta-label">SEVERITY CLASSIFICATION:</span>
              <span className={`meta-classification ${highAlerts.length > 0 ? 'red' : 'orange'}`}>
                {highAlerts.length > 0 ? 'PRIORITY RED ALERT' : 'ORANGE MONITORING'}
              </span>
            </div>
          </div>

          {/* KPI Summary Tiles */}
          <div className="report-kpi-grid">
            <div className="report-kpi-box red">
              <div className="kpi-num">{highAlerts.length}</div>
              <div className="kpi-title">Critical Red Alerts</div>
              <div className="kpi-sub">Mandatory Evacuation / Closure</div>
            </div>
            <div className="report-kpi-box orange">
              <div className="kpi-num">{modAlerts.length}</div>
              <div className="kpi-title">Moderate Alerts</div>
              <div className="kpi-sub">SDRF Tactical Pre-positioning</div>
            </div>
            <div className="report-kpi-box yellow">
              <div className="kpi-num">{watchAlerts.length}</div>
              <div className="kpi-title">Watch / Standby</div>
              <div className="kpi-sub">Rain-Gauge Catchment Vigilance</div>
            </div>
            <div className="report-kpi-box blue">
              <div className="kpi-num">{affectedDistricts.length} / 13</div>
              <div className="kpi-title">Districts Monitored</div>
              <div className="kpi-sub">Full Uttarakhand Coverage</div>
            </div>
          </div>

          {/* Meteorological Synthesis */}
          <div className="report-section">
            <div className="report-section-header">1. AI-FUSED SYNOPTIC & SATELLITE NOWCAST SYNTHESIS</div>
            <div className="report-section-body">
              <p>
                The <strong>VAJRA Dual-Head ConvLSTM Nowcast System</strong> has ingested high-resolution infrared brightness temperatures 
                from INSAT-3D/3DR (TIR1/WV channels), regional atmospheric soundings (CAPE, CIN, Vertical Wind Shear), and CartoDEM 30m orographic gradients. 
                Severe moisture convergence along the Garhwal and Kumaon Himalayan foothills indicates localized cloud-top glaciation below -52°C, 
                generating extreme orographic locking in high-relief river valleys.
              </p>
              <div className="report-trigger-callout">
                <strong>Primary Trigger Signature:</strong> {hazardsSummary?.triggerSignature || 'Overshooting CTT Glaciation + Low-Level Wind Convergence along Himalayan Slopes'}
                <br />
                <strong>Active Reference Sector:</strong> {activeLocation ? `${activeLocation.name} (${activeLocation.district} • ${activeLocation.elevation})` : 'Uttarakhand Statewide Net'}
              </div>
            </div>
          </div>

          {/* District Directives Table */}
          <div className="report-section">
            <div className="report-section-header">2. SECTOR-BY-SECTOR CIVIL DEFENSE DIRECTIVES ({alerts.length} SECTORS)</div>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sector / Location</th>
                    <th>District</th>
                    <th>Hazard</th>
                    <th>Risk</th>
                    <th>Probability</th>
                    <th>Lead Time</th>
                    <th>Standard Operating Procedure (SOP) Directives</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a, idx) => (
                    <tr key={a.id} className={a.severity === 'HIGH' ? 'row-high' : ''}>
                      <td>{idx + 1}</td>
                      <td><strong>{a.location}</strong></td>
                      <td>{a.district || '—'}</td>
                      <td>{a.event}</td>
                      <td>
                        <span className={`report-sev-pill ${a.severity.toLowerCase()}`}>{a.severity}</span>
                      </td>
                      <td><strong>{a.prob}%</strong></td>
                      <td>{a.lead}</td>
                      <td>
                        <div className="report-sop-cell">
                          {a.protocol && <span className="report-sop-tag">{a.protocol.split(' ')[0]}</span>}
                          <span>{a.actionRecommended || a.trigger}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`report-status-pill ${a.status === 'ACKNOWLEDGED' ? 'ack' : 'pend'}`}>
                          {a.status === 'ACKNOWLEDGED' ? 'ACK' : 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Standard Operating Procedures & Agency Protocols */}
          <div className="report-section">
            <div className="report-section-header">3. CIVIL DEFENSE & INTER-AGENCY MANDATES</div>
            <div className="report-agency-grid">
              <div className="agency-card">
                <strong>STATE DISASTER RESPONSE FORCE (SDRF) / NDRF</strong>
                <p>Deploy swift-water rescue outposts and inflatable motorized rafts along Mandakini, Alaknanda, Bhagirathi, and Kali riverbanks. Pre-position satellite comms (Inmarsat/SATPHONE) at high-altitude stations.</p>
              </div>
              <div className="agency-card">
                <strong>BORDER ROADS ORGANISATION (BRO) & PWD</strong>
                <p>Position heavy earthmovers (JCB/excavators) at known slide choke points along NH-58 (Badrinath Hwy), NH-107 (Kedarnath Hwy), and NH-108 (Gangotri Hwy). Halt vehicular convoys at safe transit staging hubs.</p>
              </div>
              <div className="agency-card">
                <strong>IRRIGATION & HYDROPOWER AUTHORITIES</strong>
                <p>Maintain continuous UHF telemetry on Tehri, Srinagar, and Maneri Bhali reservoir levels. Implement staggered gate discharge protocols in coordination with downstream districts to avert flash-flood surges.</p>
              </div>
              <div className="agency-card">
                <strong>DISTRICT MAGISTRATES & EMERGENCY CENTRES (DEOC)</strong>
                <p>Activate district control hotlines (1077 / 112). Enforce public address siren broadcasts across vulnerable riverbank pilgrim camps and low-lying market stalls.</p>
              </div>
            </div>
          </div>

          {/* Signoff Stamp */}
          <div className="report-footer-signoff">
            <div className="signoff-seal">
              <div className="seal-circle">
                <span>SEOC UTTARAKHAND</span>
                <strong>OFFICIAL</strong>
                <span>VALIDATED</span>
              </div>
            </div>
            <div className="signoff-text">
              <p>Issued by authority of <strong>Chief Executive Officer, USDMA</strong></p>
              <p>Generated autonomously via <strong>VAJRA AI Nowcast Pipeline v2.6</strong></p>
              <p>Verified by State Emergency Operations Centre Duty Officer • Dehradun</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function AlertsPage({
  alerts,
  locations,
  onAcknowledge,
  onAcknowledgeAll,
  onViewOnMap,
  onGenerateReport
}: {
  alerts: AlertItem[];
  locations: DistrictLocation[];
  onAcknowledge: (id: number) => void;
  onAcknowledgeAll: () => void;
  onViewOnMap: (a: AlertItem) => void;
  onGenerateReport: () => void;
}) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'HIGH' | 'MODERATE' | 'WATCH'>('All');
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [hazardFilter, setHazardFilter] = useState<'All' | 'Cloudburst' | 'Flash Flood' | 'Thunderstorm'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'PENDING' | 'ACKNOWLEDGED'>('All');

  // Compute KPI summaries from alerts
  const totalCount = alerts.length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;
  const modCount = alerts.filter(a => a.severity === 'MODERATE').length;
  const watchCount = alerts.filter(a => a.severity === 'WATCH').length;
  const ackCount = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
  const pendingCount = totalCount - ackCount;
  const ackPercentage = totalCount > 0 ? Math.round((ackCount / totalCount) * 100) : 0;

  // Extract all unique districts
  const districts = useMemo(() => {
    const list = Array.from(new Set(alerts.map(a => a.district).filter(Boolean))) as string[];
    return ['All', ...list.sort()];
  }, [alerts]);

  // District counts for select dropdown
  const districtCounts = useMemo(() => {
    const counts: Record<string, number> = { All: alerts.length };
    for (const a of alerts) {
      if (a.district) {
        counts[a.district] = (counts[a.district] || 0) + 1;
      }
    }
    return counts;
  }, [alerts]);

  // Dynamic filtering across all 5 dimensions
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
      if (districtFilter !== 'All' && a.district?.toLowerCase() !== districtFilter.toLowerCase()) return false;
      if (hazardFilter !== 'All' && a.event !== hazardFilter) return false;
      if (statusFilter === 'ACKNOWLEDGED' && a.status !== 'ACKNOWLEDGED') return false;
      if (statusFilter === 'PENDING' && a.status === 'ACKNOWLEDGED') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const loc = (a.location || '').toLowerCase();
        const dist = (a.district || '').toLowerCase();
        const trig = (a.trigger || '').toLowerCase();
        const act = (a.actionRecommended || '').toLowerCase();
        const proto = (a.protocol || '').toLowerCase();
        const match = loc.includes(q) || dist.includes(q) || trig.includes(q) || act.includes(q) || proto.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [alerts, severityFilter, districtFilter, hazardFilter, statusFilter, search]);

  const hasActiveFilters = search.trim() !== '' || severityFilter !== 'All' || districtFilter !== 'All' || hazardFilter !== 'All' || statusFilter !== 'All';

  const resetFilters = () => {
    setSearch('');
    setSeverityFilter('All');
    setDistrictFilter('All');
    setHazardFilter('All');
    setStatusFilter('All');
  };

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="kicker">INCIDENT MANAGEMENT & CIVIL DEFENSE</div>
          <h2>Active Alerts & Decision Queue</h2>
          <p>Prioritized hydrometeorological signals across all 13 Uttarakhand districts with stateful operator acknowledgement and civil SOP directives.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="ack-all-btn"
            onClick={onAcknowledgeAll}
            disabled={pendingCount === 0}
            title={pendingCount === 0 ? 'All alerts currently acknowledged' : `Acknowledge all ${pendingCount} pending alerts`}
          >
            <CheckCheck size={14} />
            <span>Acknowledge All ({pendingCount} Pending)</span>
          </button>
          <button className="primary-btn" onClick={onGenerateReport} title="Generate and export official USDMA nowcast alert bulletin">
            <FileWarning size={15} />
            <span>Generate Alert Report</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="alerts-kpi-grid">
        <div className="alert-kpi-card red">
          <div className="kpi-icon-wrap">
            <AlertTriangle size={18} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">CRITICAL RED ALERTS</span>
            <span className="kpi-value">{highCount} <small style={{ fontSize: '10px', color: '#f87171' }}>Sectors</small></span>
            <span className="kpi-meta">Mandatory evacuation active</span>
          </div>
        </div>

        <div className="alert-kpi-card orange">
          <div className="kpi-icon-wrap">
            <Siren size={18} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">ORANGE WARNINGS</span>
            <span className="kpi-value">{modCount} <small style={{ fontSize: '10px', color: '#fb923c' }}>Sectors</small></span>
            <span className="kpi-meta">SDRF teams pre-positioned</span>
          </div>
        </div>

        <div className="alert-kpi-card yellow">
          <div className="kpi-icon-wrap">
            <Activity size={18} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">YELLOW ADVISORIES</span>
            <span className="kpi-value">{watchCount} <small style={{ fontSize: '10px', color: '#facc15' }}>Sectors</small></span>
            <span className="kpi-meta">Continuous rain-gauge watch</span>
          </div>
        </div>

        <div className="alert-kpi-card cyan">
          <div className="kpi-icon-wrap">
            <MapPinned size={18} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">MONITORED REGION</span>
            <span className="kpi-value">{districts.length - 1} / 13 <small style={{ fontSize: '10px', color: '#38bdf8' }}>Districts</small></span>
            <span className="kpi-meta">{totalCount} total monitored hubs</span>
          </div>
        </div>

        <div className="alert-kpi-card green">
          <div className="kpi-icon-wrap">
            <CheckCheck size={18} />
          </div>
          <div className="kpi-details">
            <span className="kpi-label">OPERATOR ACKNOWLEDGED</span>
            <span className="kpi-value">{ackCount} / {totalCount} <small style={{ fontSize: '10px', color: '#34d399' }}>({ackPercentage}%)</small></span>
            <span className="kpi-meta">{pendingCount} awaiting command signoff</span>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="alerts-filter-box">
        <div className="filter-row-primary">
          <div className="alerts-search-input-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="alerts-search-input"
              placeholder="Search by sector, district, trigger signature, SOP protocol..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="alerts-search-clear-btn" onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>

          <div className="district-filter-select-wrap">
            <MapPinned size={13} />
            <select
              className="district-filter-select"
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
            >
              {districts.map(d => (
                <option key={d} value={d}>
                  {d === 'All' ? `All Districts (${alerts.length})` : `${d} (${districtCounts[d] || 0})`}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button className="filter-pill-btn" onClick={resetFilters} style={{ marginLeft: 'auto' }}>
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="filter-row-secondary">
          <div className="filter-group-wrap">
            <span className="filter-group-label">SEVERITY:</span>
            {(['All', 'HIGH', 'MODERATE', 'WATCH'] as const).map(sev => {
              const count = sev === 'All' ? totalCount : alerts.filter(a => a.severity === sev).length;
              const colorClass = sev === 'HIGH' ? 'red' : (sev === 'MODERATE' ? 'orange' : (sev === 'WATCH' ? 'yellow' : ''));
              return (
                <button
                  key={sev}
                  className={`filter-pill-btn ${severityFilter === sev ? `active ${colorClass}` : ''}`}
                  onClick={() => setSeverityFilter(sev)}
                >
                  <span>{sev}</span>
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="filter-group-wrap">
            <span className="filter-group-label">HAZARD:</span>
            {(['All', 'Cloudburst', 'Flash Flood', 'Thunderstorm'] as const).map(h => {
              const count = h === 'All' ? totalCount : alerts.filter(a => a.event === h).length;
              return (
                <button
                  key={h}
                  className={`filter-pill-btn ${hazardFilter === h ? 'active' : ''}`}
                  onClick={() => setHazardFilter(h)}
                >
                  <span>{h}</span>
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="filter-group-wrap">
            <span className="filter-group-label">STATUS:</span>
            {[
              { key: 'All', label: 'All', count: totalCount },
              { key: 'PENDING', label: 'Pending', count: pendingCount },
              { key: 'ACKNOWLEDGED', label: 'Acknowledged', count: ackCount }
            ].map(st => (
              <button
                key={st.key}
                className={`filter-pill-btn ${statusFilter === st.key ? 'active' : ''}`}
                onClick={() => setStatusFilter(st.key as any)}
              >
                <span>{st.label}</span>
                <span className="pill-count">{st.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="table-card">
        {filteredAlerts.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
            <FileWarning size={32} style={{ margin: '0 auto 8px', color: '#475569' }} />
            <strong style={{ display: 'block', fontSize: '13px', color: '#94a3b8' }}>No alerts match your filter criteria</strong>
            <p style={{ fontSize: '10px', margin: '4px 0 12px' }}>Try resetting filters or adjusting search terms to view active district signals.</p>
            <button className="primary-btn" style={{ margin: '0 auto', fontSize: '9.5px', padding: '6px 12px' }} onClick={resetFilters}>
              <RotateCcw size={13} /> Clear All Filters
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Hazard Event</th>
                <th>Monitored Sector & District</th>
                <th>Risk Probability</th>
                <th>Lead Time</th>
                <th>Trigger Signature</th>
                <th>Civil SOP & Action Recommended</th>
                <th>Command Status</th>
                <th>Operator Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map(a => (
                <tr key={a.id}>
                  <td>
                    <span className={`severity ${a.severity.toLowerCase()}`}>{a.severity}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {a.event === 'Cloudburst' ? <CloudLightning size={14} style={{ color: '#f87171' }} /> :
                       a.event === 'Flash Flood' ? <Waves size={14} style={{ color: '#38bdf8' }} /> :
                       <Activity size={14} style={{ color: '#fbbf24' }} />}
                      <strong>{a.event}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="alert-row-loc-cell">
                      <div className="alert-row-loc-top">
                        <strong style={{ color: '#f1f5f9' }}>{a.location}</strong>
                      </div>
                      <div className="alert-row-loc-meta">
                        {a.district && <span className="alert-district-pill">{a.district}</span>}
                        {a.elevation && <span>• {a.elevation}</span>}
                        {a.rainfall !== undefined && a.rainfall > 0 && <span>• Peak: {a.rainfall} mm/hr</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="prob-cell-wrap">
                      <strong style={{ fontSize: '11px', color: '#f8fafc' }}>{a.prob}%</strong>
                      <div className="prob-mini-bar">
                        <i
                          className={a.severity.toLowerCase()}
                          style={{ width: `${a.prob}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: a.lead.includes('30') || a.lead.includes('1 hr') ? '#fca5a5' : '#cbd5e1', display: 'block' }}>
                      {a.lead}
                    </span>
                    {a.timeDispatched && (
                      <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                        {a.timeDispatched}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="alert-trigger-snippet">
                      {a.trigger}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {a.protocol && (
                        <div>
                          <span className="alert-sop-pill">{a.protocol.split(' ')[0]}</span>
                        </div>
                      )}
                      <div className="alert-action-snippet">
                        {a.actionRecommended || 'Deploy district response patrol and alert riverfront outposts.'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={a.status === 'ACKNOWLEDGED' ? 'active-status ack' : 'active-status'}>
                      <i /> {a.status}
                    </span>
                    {a.acknowledgedAt && (
                      <div style={{ fontSize: '7.5px', color: '#5eead4', marginTop: '2px' }}>
                        Ack: {a.acknowledgedAt}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="alert-row-actions">
                      <button className="alert-btn-map" onClick={() => onViewOnMap(a)} title="Focus sector on GIS map">
                        <MapPinned size={12} /> View on Map
                      </button>
                      {a.status !== 'ACKNOWLEDGED' ? (
                        <button className="alert-btn-ack" onClick={() => onAcknowledge(a.id)} title="Acknowledge alert as commanding officer">
                          <Check size={12} /> Acknowledge
                        </button>
                      ) : (
                        <span className="alert-acked-badge">
                          <Check size={11} /> Acknowledged
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recommended Civil Protection Standard Operating Procedures */}
      <div className="response-card">
        <div>
          <div className="kicker">MANDATED CIVIL PROTECTION PROTOCOLS</div>
          <h3>Uttarakhand State Disaster Response Framework (USDMA 2026)</h3>
          <p>Autonomous AI trigger signals activate calibrated Field Standard Operating Procedures (SOPs).</p>
        </div>
        <div className="response-icons">
          <span><Siren size={14} /> <strong>SOP-RED-01</strong>: Shrine & Valley Immediate Evacuation</span>
          <span><MapPinned size={14} /> <strong>SOP-RED-02</strong>: Riverfront Closure & Highway Staging</span>
          <span><Waves size={14} /> <strong>SOP-ORANGE-02</strong>: Dam Sluice & Barrage Alert</span>
        </div>
      </div>
    </>
  );
}

function StatusPage({ onRunTest, aiConnected, aiModelMode }: { onRunTest: () => void; aiConnected?: boolean; aiModelMode?: boolean }) {

  const isAiActive = aiConnected || aiModelMode;
  const rows = [
    ['INSAT-3D Satellite Feed', 'ONLINE (TIR CTT + IWV)', Radar],
    ['IMD / ERA5 Atmospheric Data', 'CONNECTED (CAPE, CIN, Shear)', Database],
    ['SRTM 30m Topography', 'ACTIVE (Elevation + Slope Gradients)', MapPinned],
    ['AI ConvLSTM Microservice (:8000)', isAiActive ? 'ONLINE (VajraNowcastNet)' : 'SIMULATION MODE', Cpu],
    ['0–6h Spatial Rainfall Decoder', 'FUNCTIONAL (64x64 Grid)', Layers3],
    ['Multi-Hazard Classification Head', 'FUNCTIONAL (Cloudburst/Flood/Storm)', Bell],
    ['GIS Interactive Risk Map', 'ACTIVE (9 Monitored Sectors)', Activity]
  ] as const;

  return (
    <>
      <div className="page-intro">
        <div>
          <div className="kicker">SYSTEM STATUS</div>
          <h2>AI Architecture Health & Readiness</h2>
          <p>{isAiActive ? 'Live PyTorch AI microservice connected on :8000 • 45-Day Uttarakhand Training Active.' : 'Local backend connected at /api/* • Deterministic simulation engine active.'}</p>
        </div>
        <span className="online-badge" style={{ borderColor: isAiActive ? '#10b981' : undefined, color: isAiActive ? '#34d399' : undefined }}>
          <i style={{ background: isAiActive ? '#10b981' : undefined }} /> {isAiActive ? 'NEURAL ENGINE ONLINE' : 'PROTOTYPE ENVIRONMENT'}
        </span>
      </div>
      <div className="status-grid">
        {rows.map(([n, s, I]) => (
          <div className="status-card" key={n}>
            <div className="status-icon"><I size={20} /></div>
            <div>
              <span>{n}</span>
              <strong style={{ color: isAiActive ? '#34d399' : undefined }}>{s}</strong>
            </div>
            <Check size={18} style={{ color: isAiActive ? '#34d399' : undefined }} />
          </div>
        ))}
      </div>
      <div className="status-footer">
        <div>
          <Activity size={17} />
          <strong>Operational Workflow</strong>
          <span>INSAT & IMD Ingestion → ConvLSTM Encoding → 0-6h Gridded Nowcast → Saliency XAI</span>
        </div>
        <button className="primary-btn" onClick={onRunTest}>
          <Play size={15} /> Run Live Neural Nowcast Test
        </button>
      </div>
    </>
  )
}

export default App

function SimulationOverlay({ step, onCancel }: { step: number; onCancel: () => void }) {
  const steps = [
    'Ingesting INSAT-3D TIR (CTT) & Sounder IWV columns...',
    'Fusing IMD/ERA5 Atmospheric Grids (CAPE, CIN, Wind Convergence, Shear)...',
    'Applying SRTM 30m Digital Elevation & Orographic Slope Gradients...',
    'Executing VajraNowcastNet ConvLSTM Recurrent Encoding (t-3 to t)...',
    'Dual-Head Decoding: 0-6h Gridded Rain Maps + Multi-Hazard Probabilities...',
    'Generating XAI Gradient Saliency Attribution & Emergency Civil Advisory...'
  ];

  return (
    <div className="sim-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="sim-modal" role="dialog" aria-modal="true" aria-labelledby="sim-modal-title">
        <button
          type="button"
          className="sim-modal-close"
          onClick={onCancel}
          title="Cancel nowcast simulation"
          aria-label="Cancel simulation"
        >
          <X size={16} />
        </button>

        <div className="sim-orbit"><Radar size={28} /></div>
        <div className="kicker">VAJRA NOWCAST ENGINE</div>
        <h2 id="sim-modal-title">Executing Neural Nowcast</h2>
        <p>Live ConvLSTM forward pass across all 53 Uttarakhand operational sectors</p>
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

        <div className="sim-modal-actions">
          <button type="button" className="sim-cancel-btn" onClick={onCancel}>
            <X size={13} /> Cancel Simulation
          </button>
        </div>
      </div>
    </div>
  )
}
