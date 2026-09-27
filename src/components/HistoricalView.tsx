import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  HISTORICAL_EVENTS,
  HistoricalEvent,
  AffectedSector
} from '../data/historicalEvents';
import {
  Play,
  Clock,
  Layers,
  MapPin,
  Calendar,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  Gauge,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface Props {
  onRunNowcast: (scenarioId?: string, locationId?: string) => void;
}

export default function HistoricalView({ onRunNowcast }: Props) {
  const [selectedId, setSelectedId] = useState<string>('kedarnath-2013');
  const [selectedSector, setSelectedSector] = useState<AffectedSector | null>(null);

  const event: HistoricalEvent =
    HISTORICAL_EVENTS.find(e => e.id === selectedId) || HISTORICAL_EVENTS[0];

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([event.epicenter.lat, event.epicenter.lon], 11);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB Dark Matter tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw River Catchment Drainage Path
    if (event.riverCoords && event.riverCoords.length > 1) {
      // Glow underlay
      L.polyline(event.riverCoords, {
        color: '#0284c7',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(layerGroup);

      // Core river flow line
      const riverLine = L.polyline(event.riverCoords, {
        color: '#38bdf8',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '8, 6',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(layerGroup);

      riverLine.bindTooltip(
        `<div style="font-weight:600; font-size:11px; color:#38bdf8;">${event.basin}</div><div style="font-size:10px; color:#94a3b8;">Primary Hydrodynamic Runoff Vector</div>`,
        { sticky: true, className: 'vajra-leaflet-tooltip' }
      );
    }

    // 2. Add Epicenter Marker with pulsing halo
    const epicenterIcon = L.divIcon({
      className: 'vajra-epicenter-marker',
      html: `
        <div style="position:relative; width:32px; height:32px; display:grid; place-items:center;">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(239, 68, 68, 0.4); animation:spin 2s infinite ease-in-out;"></div>
          <div style="width:16px; height:16px; border-radius:50%; background:#ef4444; border:2px solid #ffffff; box-shadow:0 0 15px #ef4444;"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const epicMarker = L.marker([event.epicenter.lat, event.epicenter.lon], {
      icon: epicenterIcon
    }).addTo(layerGroup);

    epicMarker.bindPopup(`
      <div style="font-family:Inter,sans-serif; min-width:180px; padding:4px;">
        <div style="font-size:9px; font-weight:700; color:#ef4444; letter-spacing:0.08em;">GROUND ZERO EPICENTER</div>
        <h4 style="margin:3px 0 6px 0; font-size:13px; color:#f8fafc;">${event.epicenter.name}</h4>
        <div style="font-size:11px; color:#cbd5e1; line-height:1.4;">
          <strong>Fatalities:</strong> ${event.fatalities}<br/>
          <strong>Elevation Span:</strong> ${event.elevationSpan}
        </div>
      </div>
    `);

    // 3. Add Affected Sector Markers
    const boundsPoints: [number, number][] = [
      [event.epicenter.lat, event.epicenter.lon],
      ...event.riverCoords
    ];

    event.sectors.forEach(sec => {
      boundsPoints.push([sec.lat, sec.lon]);

      const isExtreme = sec.impactLevel === 'EXTREME';
      const isSevere = sec.impactLevel === 'SEVERE';
      const pinColor = isExtreme ? '#ef4444' : isSevere ? '#f97316' : '#eab308';
      const bgColor = isExtreme
        ? 'rgba(239, 68, 68, 0.25)'
        : isSevere
        ? 'rgba(249, 115, 22, 0.25)'
        : 'rgba(234, 179, 8, 0.25)';

      const sectorIcon = L.divIcon({
        className: 'vajra-sector-pin',
        html: `
          <div style="
            width:24px; height:24px; border-radius:50%;
            background:${bgColor}; border:2px solid ${pinColor};
            display:grid; place-items:center; box-shadow:0 0 12px ${pinColor}88;
            cursor:pointer; transition:transform 0.2s ease;
          ">
            <div style="width:8px; height:8px; border-radius:50%; background:${pinColor};"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([sec.lat, sec.lon], { icon: sectorIcon }).addTo(layerGroup);

      marker.on('click', () => {
        setSelectedSector(sec);
      });

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif; min-width:200px; padding:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:9px; font-weight:700; color:${pinColor}; padding:2px 6px; border-radius:4px; background:${bgColor};">
              ${sec.impactLevel} IMPACT
            </span>
            <span style="font-size:10px; color:#94a3b8;">${sec.elevation}</span>
          </div>
          <h4 style="margin:2px 0 6px 0; font-size:13px; color:#f8fafc;">${sec.name}</h4>
          <div style="font-size:11px; color:#cbd5e1; line-height:1.45;">
            <div><strong>Casualties:</strong> ${sec.casualtiesReported}</div>
            <div style="margin-top:4px; padding-top:4px; border-top:1px solid #334155;">
              <span style="color:#22c55e;">● VAJRA AI: <strong>${sec.aiLeadTime}</strong></span><br/>
              <span style="color:#f87171;">● Traditional: ${sec.traditionalLeadTime}</span>
            </div>
          </div>
        </div>
      `);
    });

    // Fit map bounds
    if (boundsPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(boundsPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } catch (err) {
        console.warn('Map bounds fitting error:', err);
      }
    }
  }, [event]);

  // Handler to fit bounds manually
  const handleResetMap = () => {
    if (!mapInstanceRef.current) return;
    const boundsPoints: [number, number][] = [
      [event.epicenter.lat, event.epicenter.lon],
      ...event.riverCoords,
      ...event.sectors.map(s => [s.lat, s.lon] as [number, number])
    ];
    mapInstanceRef.current.fitBounds(L.latLngBounds(boundsPoints), {
      padding: [40, 40],
      maxZoom: 13
    });
  };

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Page Header & Disaster Selector */}
      <div className="page-intro" style={{ flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div className="kicker" style={{ color: '#38bdf8' }}>
            HISTORICAL BENCHMARK CASE STUDIES
          </div>
          <h2 style={{ margin: '4px 0 2px 0', fontSize: '20px' }}>
            Himalayan Disaster Retrospective & Model Verification
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '11px' }}>
            Comparative validation across 5 benchmark Uttarakhand disaster events with verified synoptic and radar ground truth.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="primary-btn"
            onClick={() => onRunNowcast(event.scenarioId, event.locationId)}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
              padding: '9px 16px',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            <Play size={14} /> Run {event.year} Disaster Replay
          </button>
        </div>
      </div>

      {/* Disaster Event Selection Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}
      >
        {HISTORICAL_EVENTS.map(ev => {
          const isSelected = ev.id === selectedId;
          return (
            <button
              key={ev.id}
              onClick={() => {
                setSelectedId(ev.id);
                setSelectedSector(null);
              }}
              style={{
                background: isSelected
                  ? 'linear-gradient(145deg, #0c263d 0%, #081626 100%)'
                  : 'linear-gradient(145deg, #091726 0%, #06101c 100%)',
                border: isSelected ? '1px solid #38bdf8' : '1px solid #172d42',
                borderRadius: '10px',
                padding: '12px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: isSelected ? '#38bdf8' : '#64748b',
                    letterSpacing: '0.08em'
                  }}
                >
                  {ev.year} DISASTER
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    color: isSelected ? '#4ade80' : '#475569',
                    fontWeight: 700
                  }}
                >
                  {ev.district}
                </span>
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: isSelected ? '#f8fafc' : '#94a3b8',
                  marginTop: '4px',
                  lineHeight: 1.3
                }}
              >
                {ev.title.split(' ')[0]} {ev.title.split(' ')[1] || ''}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                {ev.dateRange}
              </div>
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#38bdf8'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Disaster Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '12px',
          padding: '18px 20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}
              >
                BENCHMARK CASE
              </span>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                {event.basin}
              </span>
            </div>
            <h3 style={{ margin: '2px 0 6px 0', fontSize: '20px', color: '#f8fafc' }}>
              {event.title}
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', maxWidth: '850px', lineHeight: 1.5 }}>
              {event.subtitle}
            </p>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'right'
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Reported Human Toll</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>
              {event.fatalities}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
              Span: {event.elevationSpan}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'block' }}>
              SYNOPTIC TRIGGER PATTERN
            </span>
            <span style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.45 }}>
              {event.synopticTrigger}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'block' }}>
              INFRASTRUCTURE DAMAGE IMPACT
            </span>
            <span style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.45 }}>
              {event.infrastructureLoss}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Catchment Map + Atmospheric Telemetry */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
          gap: '14px'
        }}
      >
        {/* Left: Interactive Leaflet Catchment Map */}
        <div
          className="map-panel"
          style={{
            height: '520px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}
        >
          <div className="panel-toolbar" style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={15} style={{ color: '#38bdf8' }} />
              <h2 style={{ fontSize: '14px', margin: 0 }}>
                {event.basin} <span>Catchment GIS</span>
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={handleResetMap}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid #1e293b',
                  color: '#94a3b8',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Maximize2 size={12} /> Fit Basin
              </button>
            </div>
          </div>

          <div
            ref={mapContainerRef}
            style={{
              flex: 1,
              width: '100%',
              background: '#07101d'
            }}
          />

          {/* Map Legend Floating */}
          <div
            className="map-legend"
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              zIndex: 400,
              background: 'rgba(7, 19, 34, 0.92)',
              border: '1px solid #263b52',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
              <span style={{ color: '#e2e8f0' }}>Ground Zero Epicenter</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '16px', height: '3px', background: '#38bdf8', borderRadius: '2px' }} />
              <span style={{ color: '#e2e8f0' }}>River Drainage Path</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: '#94a3b8' }}>Extreme</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
              <span style={{ color: '#94a3b8' }}>Severe</span>
            </div>
          </div>
        </div>

        {/* Right: Synoptic Atmospheric Telemetry & Physical Dynamics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Atmospheric Telemetry Grid */}
          <div
            style={{
              background: 'linear-gradient(160deg, #0b1726, #08121f)',
              border: '1px solid #172b41',
              borderRadius: '13px',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div className="kicker" style={{ color: '#38bdf8' }}>ATMOSPHERIC TELEMETRY</div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '15px' }}>Peak Synoptic Conditions</h3>
              </div>
              <span style={{ fontSize: '10px', color: '#64748b' }}>IMD / ERA5 / INSAT-3D</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}
            >
              <div style={{ background: '#091624', padding: '10px 12px', borderRadius: '8px', border: '1px solid #172d42' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '10px', fontWeight: 700 }}>
                  <Thermometer size={14} /> CLOUD TOP TEMP (CTT)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {event.atmospheric.ctt}
                </div>
                <span style={{ fontSize: '9px', color: '#64748b' }}>Glaciated overshooting top</span>
              </div>

              <div style={{ background: '#091624', padding: '10px 12px', borderRadius: '8px', border: '1px solid #172d42' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontSize: '10px', fontWeight: 700 }}>
                  <Droplets size={14} /> WATER VAPOUR (IWV)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {event.atmospheric.iwv}
                </div>
                <span style={{ fontSize: '9px', color: '#64748b' }}>Extreme atmospheric loading</span>
              </div>

              <div style={{ background: '#091624', padding: '10px 12px', borderRadius: '8px', border: '1px solid #172d42' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '10px', fontWeight: 700 }}>
                  <Gauge size={14} /> CAPE BUOYANCY
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {event.atmospheric.cape}
                </div>
                <span style={{ fontSize: '9px', color: '#64748b' }}>CIN: {event.atmospheric.cin}</span>
              </div>

              <div style={{ background: '#091624', padding: '10px 12px', borderRadius: '8px', border: '1px solid #172d42' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '10px', fontWeight: 700 }}>
                  <ShieldAlert size={14} /> PEAK BURST INTENSITY
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {event.atmospheric.peakRain}
                </div>
                <span style={{ fontSize: '9px', color: '#64748b' }}>24h: {event.atmospheric.totalRain24h}</span>
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '10px', background: '#0c1725', borderRadius: '8px', border: '1px solid #1a2a3c' }}>
              <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                HYDRODYNAMIC MECHANISM BREAKDOWN:
              </span>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
                {event.synopticMechanism}
              </p>
            </div>
          </div>

          {/* VAJRA Verification & Operational Early Warning Advantage */}
          <div
            style={{
              background: 'linear-gradient(160deg, #0b1726, #08121f)',
              border: '1px solid #172b41',
              borderRadius: '13px',
              padding: '16px',
              flex: 1
            }}
          >
            <div className="kicker" style={{ color: '#22c55e' }}>EARLY WARNING RECOVERY POTENTIAL</div>
            <h3 style={{ margin: '2px 0 10px 0', fontSize: '15px' }}>
              VAJRA AI vs Traditional Verification Benchmark
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#1c1317', padding: '10px', borderRadius: '8px', border: '1px solid #4a1924' }}>
                <span style={{ fontSize: '9px', color: '#f87171', display: 'block' }}>TRADITIONAL WARNING</span>
                <strong style={{ fontSize: '14px', color: '#fca5a5' }}>
                  {event.verification.traditionalLeadStr}
                </strong>
                <span style={{ fontSize: '9px', color: '#7f1d1d', display: 'block', marginTop: '2px' }}>
                  Radar blind / Post-event siren
                </span>
              </div>

              <div style={{ background: '#0e241c', padding: '10px', borderRadius: '8px', border: '1px solid #165b40' }}>
                <span style={{ fontSize: '9px', color: '#4ade80', display: 'block' }}>VAJRA NEURAL NOWCAST</span>
                <strong style={{ fontSize: '14px', color: '#86efac' }}>
                  {event.verification.vajraAiLeadStr}
                </strong>
                <span style={{ fontSize: '9px', color: '#166534', display: 'block', marginTop: '2px' }}>
                  {event.verification.leadGainHours}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '10px',
                background: '#091724',
                borderRadius: '8px',
                border: '1px solid #182d43'
              }}
            >
              <div>
                <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Critical Threat (CSI)</span>
                <strong style={{ fontSize: '14px', color: '#38bdf8' }}>
                  {event.verification.csiThreatScore}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>Detection Rate (POD)</span>
                <strong style={{ fontSize: '14px', color: '#4ade80' }}>
                  {(event.verification.podDetectionRate * 100).toFixed(1)}%
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>False Alarm (FAR)</span>
                <strong style={{ fontSize: '14px', color: '#facc15' }}>
                  {(event.verification.falseAlarmRatio * 100).toFixed(1)}%
                </strong>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>Civil Protection Estimate: </span>
              {event.verification.evacuationSuccessPotential}
            </div>
          </div>
        </div>
      </div>

      {/* Chronological Disaster Timeline & Affected Sectors Table */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)',
          gap: '14px'
        }}
      >
        {/* Timeline Steps */}
        <div
          style={{
            background: 'linear-gradient(160deg, #0b1726, #08121f)',
            border: '1px solid #172b41',
            borderRadius: '13px',
            padding: '16px'
          }}
        >
          <div className="kicker" style={{ color: '#38bdf8' }}>CHRONOLOGICAL RECONSTRUCTION</div>
          <h3 style={{ margin: '2px 0 14px 0', fontSize: '16px' }}>Event Sequence of Events</h3>

          <div style={{ display: 'grid', gap: '12px' }}>
            {event.timeline.map((step, idx) => {
              const isCatastrophic = step.severity === 'CATASTROPHIC';
              const isCritical = step.severity === 'CRITICAL';
              const badgeBg = isCatastrophic
                ? 'rgba(239, 68, 68, 0.2)'
                : isCritical
                ? 'rgba(249, 115, 22, 0.2)'
                : 'rgba(56, 189, 248, 0.15)';
              const badgeColor = isCatastrophic
                ? '#f87171'
                : isCritical
                ? '#fb923c'
                : '#38bdf8';

              return (
                <div
                  key={step.step}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr',
                    gap: '10px',
                    paddingBottom: idx < event.timeline.length - 1 ? '12px' : '0',
                    borderBottom: idx < event.timeline.length - 1 ? '1px solid #14283c' : 'none'
                  }}
                >
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background: '#091e2b',
                      border: '1px solid #1c3c52',
                      color: '#38bdf8',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    {step.step}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <strong style={{ fontSize: '12px', color: '#f1f5f9' }}>{step.title}</strong>
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: badgeBg,
                          color: badgeColor
                        }}
                      >
                        {step.time}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Affected Sectors Table */}
        <div
          style={{
            background: 'linear-gradient(160deg, #0b1726, #08121f)',
            border: '1px solid #172b41',
            borderRadius: '13px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <div className="kicker" style={{ color: '#38bdf8' }}>SECTOR-LEVEL IMPACT ANALYSIS</div>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '16px' }}>Vulnerable Valley Settlement Points</h3>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              {event.sectors.length} Monitored Nodes
            </span>
          </div>

          <div className="table-card" style={{ flex: 1, border: 'none', background: 'transparent' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '10px' }}>SECTOR NODE</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '10px' }}>ELEVATION</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '10px' }}>IMPACT</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '10px' }}>CASUALTIES</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#64748b', fontSize: '10px' }}>AI LEAD TIME</th>
                </tr>
              </thead>
              <tbody>
                {event.sectors.map(sec => {
                  const isExtreme = sec.impactLevel === 'EXTREME';
                  const isSevere = sec.impactLevel === 'SEVERE';
                  const badgeColor = isExtreme ? '#ef4444' : isSevere ? '#f97316' : '#eab308';
                  const badgeBg = isExtreme ? '#3a1117' : isSevere ? '#302315' : '#2f2a13';

                  return (
                    <tr
                      key={sec.id}
                      onClick={() => setSelectedSector(sec)}
                      style={{
                        borderBottom: '1px solid #14283c',
                        cursor: 'pointer',
                        background: selectedSector?.id === sec.id ? 'rgba(56, 189, 248, 0.08)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px 8px', fontWeight: 600, color: '#f8fafc' }}>
                        {sec.name}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#94a3b8' }}>
                        {sec.elevation}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '3px 6px',
                            borderRadius: '4px',
                            color: badgeColor,
                            background: badgeBg
                          }}
                        >
                          {sec.impactLevel}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', color: '#cbd5e1', fontSize: '10px' }}>
                        {sec.casualtiesReported}
                      </td>
                      <td style={{ padding: '10px 8px', color: '#4ade80', fontWeight: 600 }}>
                        {sec.aiLeadTime}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              background: '#091624',
              borderRadius: '8px',
              border: '1px solid #172d42',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Load this historical synoptic state into operational overview
            </div>
            <button
              className="row-btn"
              onClick={() => onRunNowcast(event.scenarioId, event.locationId)}
              style={{
                background: '#0e3341',
                color: '#38bdf8',
                borderColor: '#1e5665',
                padding: '6px 12px',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Play size={12} style={{ marginRight: '4px' }} /> Launch Scenario Replay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
