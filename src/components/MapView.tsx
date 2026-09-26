import { useEffect, useRef } from "react";
import L from "leaflet";
import { type Hazard, type RiskLevel } from "../data/mock";

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

export interface DistrictLocationItem {
  id: string;
  name: string;
  district: string;
  lat: number;
  long: number;
  elevation: string;
  type?: string;
  description?: string;
}

type Props = {
  hour: number;
  layers: Record<string, boolean>;
  selectedHazard?: Hazard | "All";
  hazard?: Hazard | "All";
  selected?: PlaceZone | null;
  activeLocation?: DistrictLocationItem | null;
  onSelect?: (p: PlaceZone) => void;
  setSelected?: (p: PlaceZone) => void;
  places?: PlaceZone[];
  centers?: RiskCenter[];
};

// Authentic GIS coordinates for Mandakini River Basin (Kedarnath 2013 Catchment)
const MANDAKINI_MAIN_RIVER: [number, number][] = [
  [30.752, 79.052], // Chorabari Glacier Headwaters (3,960 m)
  [30.748, 79.055], // Chorabari Moraine Lake
  [30.735, 79.067], // Kedarnath Temple / Shrine Sanctuary (3,584 m)
  [30.710, 79.062], // Garur Chatti / Lincholi
  [30.686, 79.056], // Rambara Gorge (2,740 m)
  [30.670, 79.051], // Jungle Chatti
  [30.652, 79.043], // Gaurikund Thermal Springs (1,980 m)
  [30.630, 79.028], // Sonprayag Confluence (with Songanga)
  [30.595, 79.038], // Rampur
  [30.575, 79.045], // Phata
  [30.523, 79.077], // Guptkashi Valley Flank (1,319 m)
  [30.490, 79.085], // Kund (Confluence with Madhyamaheshwar Ganga)
  [30.440, 79.055], // Kakragad
  [30.395, 79.025], // Agustmuni Wide Floodplain
  [30.340, 78.995], // Tilwara
  [30.285, 78.981], // Rudraprayag Confluence with Alaknanda River (890 m)
];

const SONGANGA_TRIBUTARY: [number, number][] = [
  [30.665, 78.990], // Vasuki Tal headwaters
  [30.645, 79.010],
  [30.630, 79.028], // Confluence at Sonprayag
];

const MADHYAMAHESHWAR_RIVER: [number, number][] = [
  [30.635, 79.220], // Madhyamaheshwar Alpine Cirque
  [30.580, 79.170], // Mansuna
  [30.530, 79.120], // Ukhimath Flank
  [30.490, 79.085], // Confluence at Kund
];

const ALAKNANDA_RIVER: [number, number][] = [
  [30.315, 79.030], // Upstream from Karnaprayag/Chamoli
  [30.298, 79.005],
  [30.285, 78.981], // Confluence at Rudraprayag
  [30.270, 78.950],
  [30.245, 78.910], // Flowing downstream toward Devprayag
];

// Strategic Road & Transit Network
const NH107_HIGHWAY: [number, number][] = [
  [30.285, 78.981], // Rudraprayag Confluence Node
  [30.340, 78.998], // Tilwara
  [30.395, 79.030], // Agustmuni Emergency Airstrip
  [30.440, 79.060], // Kakragad Bridge
  [30.490, 79.088], // Kund Bridge Junction
  [30.523, 79.077], // Guptkashi Town
  [30.575, 79.048], // Phata Helipad Base
  [30.630, 79.030], // Sonprayag Transit Hub
  [30.652, 79.043], // Gaurikund Vehicular Roadhead Terminus
];

const KEDARNATH_TREK_ROUTE: [number, number][] = [
  [30.652, 79.043], // Gaurikund (1,980 m)
  [30.670, 79.052], // Jungle Chatti (2,250 m)
  [30.686, 79.056], // Rambara Gorge Bridge (2,740 m)
  [30.710, 79.063], // Lincholi / Garur Chatti (3,150 m)
  [30.735, 79.067], // Kedarnath Shrine (3,584 m)
];

// Topographic DEM (CartoDEM 30m) Elevation & Hazard Geometries
const DEM_TERRAIN_ZONES = [
  {
    name: "Chorabari Glacial Massif & Moraine Cirque",
    elevation: "3,584 m – 3,960 m",
    slope: "42° – 55° (High Avalanche / Lake Outburst)",
    coords: [
      [30.760, 79.040],
      [30.765, 79.075],
      [30.730, 79.085],
      [30.725, 79.045],
    ] as [number, number][],
    fillColor: "#0284c7",
    color: "#38bdf8",
  },
  {
    name: "Rambara - Gaurikund Steep V-Shaped Gorge",
    elevation: "1,980 m – 3,100 m",
    slope: "38° – 48° (Severe Hydraulic Channelling)",
    coords: [
      [30.700, 79.035],
      [30.705, 79.075],
      [30.640, 79.060],
      [30.635, 79.020],
    ] as [number, number][],
    fillColor: "#ea580c",
    color: "#f97316",
  },
  {
    name: "Guptkashi - Phata Orographic Ridge Chimney",
    elevation: "1,319 m – 2,450 m",
    slope: "22° – 34° (High Convective Uplift)",
    coords: [
      [30.600, 79.020],
      [30.605, 79.110],
      [30.480, 79.115],
      [30.475, 79.035],
    ] as [number, number][],
    fillColor: "#7c3aed",
    color: "#a855f7",
  },
  {
    name: "Rudraprayag Confluence Hydro Basin",
    elevation: "890 m – 1,200 m",
    slope: "10° – 18° (Fluvial Surge Flooding)",
    coords: [
      [30.360, 78.950],
      [30.365, 79.040],
      [30.260, 79.020],
      [30.255, 78.940],
    ] as [number, number][],
    fillColor: "#059669",
    color: "#10b981",
  },
];

// Population & Pilgrim Transit Centers (Kedarnath 2013 Mandakini Catchment)
export interface PopulationCluster {
  id: string;
  name: string;
  type: string;
  count: number;
  popFormatted: string;
  coords: [number, number];
  elevation: string;
  vulnerability: "CRITICAL" | "HIGH" | "MODERATE";
  color: string;
  hazardRisk: string;
  safeGround: string;
  evacRoute: string;
  radiusMeters: number;
}

const MANDAKINI_POPULATION_DATA: PopulationCluster[] = [
  {
    id: "kedarnath-shrine",
    name: "Kedarnath Temple Sanctuary",
    type: "Pilgrim Complex & Base Camp",
    count: 25000,
    popFormatted: "25,000 pilgrims & locals",
    coords: [30.735, 79.067],
    elevation: "3,584 m",
    vulnerability: "CRITICAL",
    color: "#ef4444",
    hazardRisk: "Chorabari moraine breach & flash-flood debris torrent",
    safeGround: "High moraine ridge behind Kedarnath Temple complex",
    evacRoute: "Bhairavnath temple spur trail (avoid riverbed)",
    radiusMeters: 2200,
  },
  {
    id: "rambara-camp",
    name: "Rambara Gorge Transit Hub",
    type: "Pilgrim Transit Camp & Bridge Node",
    count: 5000,
    popFormatted: "5,000 pilgrims & porters",
    coords: [30.686, 79.056],
    elevation: "2,740 m",
    vulnerability: "CRITICAL",
    color: "#ef4444",
    hazardRisk: "Severe hydraulic channelling; narrow gorge bottleneck",
    safeGround: "Upper Lincholi hillside terraces (elevation > 2,900 m)",
    evacRoute: "Climb eastern valley slope to upper ridge",
    radiusMeters: 1400,
  },
  {
    id: "gaurikund-base",
    name: "Gaurikund Basecamp & Thermal Springs",
    type: "Vehicular Roadhead & Transit Depot",
    count: 8500,
    popFormatted: "8,500 pilgrims & operators",
    coords: [30.652, 79.043],
    elevation: "1,980 m",
    vulnerability: "HIGH",
    color: "#f97316",
    hazardRisk: "Steep gorge collapse & Mandakini torrent overflow",
    safeGround: "Gaurikund bus terminal upper parking plateau",
    evacRoute: "NH-107 downstream transit toward Sonprayag high road",
    radiusMeters: 1600,
  },
  {
    id: "sonprayag-hub",
    name: "Sonprayag River Confluence",
    type: "Confluence Transit Node",
    count: 6200,
    popFormatted: "6,200 pilgrims & transit crews",
    coords: [30.630, 79.028],
    elevation: "1,820 m",
    vulnerability: "HIGH",
    color: "#f97316",
    hazardRisk: "Songanga & Mandakini dual-river surge zone",
    safeGround: "Triyuginarayan hill road junction",
    evacRoute: "Triyuginarayan bypass road (>2,100 m)",
    radiusMeters: 1500,
  },
  {
    id: "phata-aviation",
    name: "Phata / Rampur Aviation Base",
    type: "Helipad Operations & Tourist Lodges",
    count: 7800,
    popFormatted: "7,800 residents & passengers",
    coords: [30.575, 79.045],
    elevation: "1,500 m",
    vulnerability: "MODERATE",
    color: "#06b6d4",
    hazardRisk: "Severe convective shear & flash-flood tributary surge",
    safeGround: "Phata Helipad upper administrative compound",
    evacRoute: "NH-107 arterial high-grade road",
    radiusMeters: 1800,
  },
  {
    id: "guptkashi-town",
    name: "Guptkashi Administrative Hub",
    type: "Township & Disaster Relief Staging",
    count: 12500,
    popFormatted: "12,500 residents & relief personnel",
    coords: [30.523, 79.077],
    elevation: "1,319 m",
    vulnerability: "MODERATE",
    color: "#06b6d4",
    hazardRisk: "High CAPE lightning, landslides & transit congestion",
    safeGround: "Guptkashi ITBP staging barracks & Vishwanath temple ridge",
    evacRoute: "Ukhimath-Chopta highway or southern NH-107",
    radiusMeters: 2400,
  },
  {
    id: "agustmuni-plain",
    name: "Agustmuni River Basin",
    type: "River Plain Settlement & Stadium Ground",
    count: 16000,
    popFormatted: "16,000 residents",
    coords: [30.395, 79.025],
    elevation: "1,000 m",
    vulnerability: "HIGH",
    color: "#f97316",
    hazardRisk: "Wide fluvial inundation & riverbed silt deposition",
    safeGround: "Agustmuni PG College upper campus & hill flank",
    evacRoute: "Move 150m vertically up east mountain slope",
    radiusMeters: 2800,
  },
  {
    id: "tilwara-bend",
    name: "Tilwara Bridge & Riverbend",
    type: "Highway Settlement & Agricultural Node",
    count: 6500,
    popFormatted: "6,500 residents",
    coords: [30.340, 78.995],
    elevation: "940 m",
    vulnerability: "HIGH",
    color: "#f97316",
    hazardRisk: "Mandakini meander sweep & bridge abutment scouring",
    safeGround: "Tilwara southern hillside tea terraces",
    evacRoute: "Rudraprayag bypass ridge road",
    radiusMeters: 1700,
  },
  {
    id: "rudraprayag-confluence",
    name: "Rudraprayag District EOC & City",
    type: "District Headquarters & River Confluence",
    count: 28000,
    popFormatted: "28,000 residents & emergency crews",
    coords: [30.285, 78.981],
    elevation: "890 m",
    vulnerability: "HIGH",
    color: "#22c55e",
    hazardRisk: "Alaknanda-Mandakini confluence backwater surge flooding",
    safeGround: "District Collectorate / Police Lines hill ridge (>1,050 m)",
    evacRoute: "Badrinath highway ridge road (NH-58 / NH-107 interchange)",
    radiusMeters: 3200,
  },
];

const DEFAULT_CENTERS: RiskCenter[] = [
  { lat: 30.735, long: 79.067, r: 0.052, level: "HIGH", hazard: "Cloudburst" },
  { lat: 30.652, long: 79.043, r: 0.048, level: "HIGH", hazard: "Flash Flood" },
  { lat: 30.523, long: 79.077, r: 0.038, level: "HIGH", hazard: "Thunderstorm" },
  { lat: 30.285, long: 78.981, r: 0.035, level: "MODERATE", hazard: "Flash Flood" },
  { lat: 30.556, long: 79.567, r: 0.045, level: "HIGH", hazard: "Flash Flood" },
  { lat: 30.258, long: 79.217, r: 0.038, level: "MODERATE", hazard: "Flash Flood" },
  { lat: 30.726, long: 78.435, r: 0.048, level: "HIGH", hazard: "Cloudburst" },
  { lat: 29.845, long: 80.535, r: 0.042, level: "HIGH", hazard: "Flash Flood" },
  { lat: 30.316, long: 78.032, r: 0.036, level: "MODERATE", hazard: "Thunderstorm" },
];

export default function MapView({
  hour,
  layers,
  selectedHazard,
  hazard,
  selected,
  activeLocation,
  onSelect,
  setSelected,
  places,
  centers,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{
    rivers: L.LayerGroup;
    roads: L.LayerGroup;
    terrain: L.LayerGroup;
    population: L.LayerGroup;
    risk: L.LayerGroup;
    markers: L.LayerGroup;
    selectionHighlight: L.LayerGroup;
  } | null>(null);

  const activeHazard = hazard || selectedHazard || "All";
  const handleSelect = onSelect || setSelected || (() => {});
  const activePlaces = places && places.length > 0 ? places : [];
  const activeCenters = centers && centers.length > 0 ? centers : DEFAULT_CENTERS;

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = selected?.lat || activeLocation?.lat || 30.523;
    const initialLng = selected?.long || activeLocation?.long || 79.077;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([initialLat, initialLng], 11);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Free, unwatermarked OpenStreetMap Tile Layer (no API key required)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const layerGroups = {
      rivers: L.layerGroup().addTo(map),
      roads: L.layerGroup().addTo(map),
      terrain: L.layerGroup().addTo(map),
      population: L.layerGroup().addTo(map),
      risk: L.layerGroup().addTo(map),
      markers: L.layerGroup().addTo(map),
      selectionHighlight: L.layerGroup().addTo(map),
    };

    mapRef.current = map;
    layerGroupsRef.current = layerGroups;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupsRef.current = null;
    };
  }, []);

  // Smoothly Fly Map when selected location changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const targetLat = selected?.lat || activeLocation?.lat;
    const targetLng = selected?.long || activeLocation?.long;

    if (targetLat && targetLng) {
      map.flyTo([targetLat, targetLng], 12.5, {
        animate: true,
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [selected?.lat, selected?.long, activeLocation?.lat, activeLocation?.long]);

  // Update Dynamic Layers & Content
  useEffect(() => {
    const lg = layerGroupsRef.current;
    if (!lg) return;

    // 1. RIVERS LAYER
    lg.rivers.clearLayers();
    if (layers.rivers) {
      // Main Mandakini River
      L.polyline(MANDAKINI_MAIN_RIVER, {
        color: "#00e5ff",
        weight: 4.5,
        opacity: 0.95,
        lineJoin: "round",
      })
        .addTo(lg.rivers)
        .bindTooltip("<b>Mandakini River Main Thalweg</b><br/>Glacial source (Chorabari) → Rudraprayag Confluence", { sticky: true });

      // Songanga Tributary
      L.polyline(SONGANGA_TRIBUTARY, {
        color: "#38bdf8",
        weight: 3,
        opacity: 0.85,
        dashArray: "6, 6",
      })
        .addTo(lg.rivers)
        .bindTooltip("Songanga Tributary (Joins at Sonprayag)", { sticky: true });

      // Madhyamaheshwar Ganga
      L.polyline(MADHYAMAHESHWAR_RIVER, {
        color: "#38bdf8",
        weight: 3,
        opacity: 0.85,
        dashArray: "6, 6",
      })
        .addTo(lg.rivers)
        .bindTooltip("Madhyamaheshwar Ganga (Joins at Kund)", { sticky: true });

      // Alaknanda River
      L.polyline(ALAKNANDA_RIVER, {
        color: "#0284c7",
        weight: 4.5,
        opacity: 0.9,
      })
        .addTo(lg.rivers)
        .bindTooltip("Alaknanda River (Major Hydro Confluence at Rudraprayag)", { sticky: true });
    }

    // 2. ROADS / TRANSIT LAYER
    lg.roads.clearLayers();
    if (layers.roads) {
      // National Highway NH-107
      L.polyline(NH107_HIGHWAY, {
        color: "#94a3b8",
        weight: 4,
        opacity: 0.95,
      })
        .addTo(lg.roads)
        .bindTooltip("<b>NH-107 National Highway</b><br/>Rudraprayag to Gaurikund Roadhead", { sticky: true });

      // Gaurikund - Kedarnath Pilgrim Trek Route
      L.polyline(KEDARNATH_TREK_ROUTE, {
        color: "#f59e0b",
        weight: 3,
        opacity: 0.9,
        dashArray: "5, 7",
      })
        .addTo(lg.roads)
        .bindTooltip("<b>16 km Mountain Trek Corridor</b><br/>Gaurikund → Rambara → Kedarnath Sanctuary", { sticky: true });
    }

    // 3. DEM / TERRAIN TOPOGRAPHY LAYER
    lg.terrain.clearLayers();
    if (layers.terrain) {
      DEM_TERRAIN_ZONES.forEach((zone) => {
        L.polygon(zone.coords, {
          color: zone.color,
          weight: 2,
          fillColor: zone.fillColor,
          fillOpacity: 0.18,
          dashArray: "4, 6",
        })
          .addTo(lg.terrain)
          .bindTooltip(`<b>${zone.name}</b><br/>Elevation: ${zone.elevation}<br/>Slope: ${zone.slope}`);
      });
    }

    // 4. POPULATION / PILGRIM DENSITY LAYER (High-visibility heat halos, count badges & evacuation cards)
    lg.population.clearLayers();
    if (layers.population) {
      MANDAKINI_POPULATION_DATA.forEach((c) => {
        // Outer translucent heat halo (dispersion buffer)
        L.circle(c.coords, {
          radius: c.radiusMeters,
          color: c.color,
          fillColor: c.color,
          fillOpacity: 0.12,
          weight: 1.5,
          dashArray: "4, 6",
        }).addTo(lg.population);

        // Dense inner core concentration disc
        const coreCircle = L.circle(c.coords, {
          radius: c.radiusMeters * 0.35,
          color: c.color,
          fillColor: c.color,
          fillOpacity: 0.32,
          weight: 2,
        }).addTo(lg.population);

        // Floating high-contrast HTML badge
        const countStr = c.count >= 1000 ? `${(c.count / 1000).toFixed(c.count % 1000 === 0 ? 0 : 1)}k` : `${c.count}`;
        const badgeIcon = L.divIcon({
          className: "pop-div-icon",
          html: `
            <div class="pop-marker-container">
              <div class="pop-marker-badge" style="border-color: ${c.color};">
                <span class="pop-pill-icon">👥</span>
                <span class="pop-pill-count">${countStr}</span>
              </div>
              <div class="pop-marker-label" style="border-left: 2px solid ${c.color};">
                ${c.name.split(" ")[0]}
              </div>
            </div>
          `,
          iconSize: [90, 48],
          iconAnchor: [45, 24],
        });

        const popMarker = L.marker(c.coords, { icon: badgeIcon }).addTo(lg.population);

        const tooltipContent = `<b>${c.name}</b><br/>👥 ${c.popFormatted} • ${c.vulnerability} Vulnerability`;
        popMarker.bindTooltip(tooltipContent, { direction: "top", offset: [0, -18] });
        coreCircle.bindTooltip(tooltipContent, { direction: "top" });

        const popupHtml = `
          <div style="min-width: 250px; font-family: Inter, sans-serif; color: #f1f5f9; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <b style="font-size: 13px; color: #38bdf8;">${c.name}</b>
              <span style="font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: ${c.color}22; color: ${c.color}; border: 1px solid ${c.color}66;">
                ${c.vulnerability}
              </span>
            </div>
            <div style="font-size: 11px; margin-bottom: 4px;">
              <strong>Estimated Headcount:</strong> <span style="color: #ffffff; font-weight: 700;">${c.popFormatted}</span>
            </div>
            <div style="font-size: 11px; margin-bottom: 4px;">
              <strong>Elevation:</strong> ${c.elevation} • <em>${c.type}</em>
            </div>
            <div style="font-size: 10.5px; color: #fca5a5; margin-bottom: 6px; background: rgba(239,68,68,0.12); padding: 4px 6px; border-radius: 4px; border: 1px solid rgba(239,68,68,0.25);">
              <strong>Threat Profile:</strong> ${c.hazardRisk}
            </div>
            <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
              <div style="margin-bottom: 3px;"><strong style="color: #4ade80;">Safe High Ground:</strong> ${c.safeGround}</div>
              <div><strong style="color: #38bdf8;">Evacuation Route:</strong> ${c.evacRoute}</div>
            </div>
          </div>
        `;

        popMarker.bindPopup(popupHtml, { offset: [0, -14] });
        coreCircle.bindPopup(popupHtml);
      });
    }

    // 5. RISK CONCENTRIC ZONES (Scaled with Hour)
    lg.risk.clearLayers();
    if (layers.risk) {
      activeCenters.forEach((z) => {
        const show = activeHazard === "All" || activeHazard === z.hazard;
        if (!show) return;

        // Dynamic expansion according to lead hour
        const growth = 1 + Math.max(0, 3 - hour) * 0.02;
        const color =
          z.level === "HIGH"
            ? "#ef4444"
            : z.level === "MODERATE"
            ? "#f97316"
            : "#eab308";

        L.circle([z.lat, z.long], {
          radius: z.r * 100000 * growth,
          color,
          fillColor: color,
          fillOpacity: 0.16,
          weight: 2.2,
        })
          .addTo(lg.risk)
          .bindTooltip(`<b>${z.hazard} Spatial Footprint</b><br/>Risk Level: ${z.level}`);
      });
    }

    // 6. SECTOR PINS & MARKERS
    lg.markers.clearLayers();
    const filteredPlaces = activePlaces.filter(
      (p) => activeHazard === "All" || p.hazard === activeHazard
    );

    filteredPlaces.forEach((p) => {
      const isSelected = selected?.id === p.id || activeLocation?.id === p.id;
      const color =
        p.level === "HIGH"
          ? "#ef4444"
          : p.level === "MODERATE"
          ? "#f97316"
          : "#eab308";

      const icon = L.divIcon({
        className: "hazard-pin",
        html: `<div style="
          width: ${isSelected ? "22px" : "16px"};
          height: ${isSelected ? "22px" : "16px"};
          border-radius: 50%;
          background: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 0 ${isSelected ? "22px" : "12px"} ${color};
          transition: all 0.3s ease;
          display: grid;
          place-items: center;
        ">
          ${isSelected ? `<span style="width:6px; height:6px; border-radius:50%; background:#ffffff;"></span>` : ""}
        </div>`,
        iconSize: isSelected ? [22, 22] : [16, 16],
        iconAnchor: isSelected ? [11, 11] : [8, 8],
      });

      const marker = L.marker([p.lat, p.long], { icon }).addTo(lg.markers);

      marker.bindTooltip(`<b>${p.name}</b><br/>${p.hazard} • ${p.prob}% Probability`, {
        direction: "top",
        offset: [0, -10],
      });

      marker.bindPopup(`
        <div style="min-width: 220px; font-family: Inter, sans-serif; color: #f1f5f9; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <b style="font-size: 13px; color: #38bdf8;">${p.name}</b>
            <span style="font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${color}22; color: ${color}; border: 1px solid ${color}66;">
              ${p.level}
            </span>
          </div>
          <div style="font-size: 11px; margin-bottom: 4px;">
            <strong>Hazard:</strong> ${p.hazard} (${p.prob}% prob)
          </div>
          <div style="font-size: 11px; margin-bottom: 4px;">
            <strong>Est. Lead Time:</strong> ${p.lead}
          </div>
          <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px; margin-top: 5px;">
            <strong>Trigger:</strong> ${p.signals}
          </div>
        </div>
      `);

      marker.on("click", () => {
        handleSelect(p);
      });
    });

    // 7. SELECTION HIGHLIGHT BEACON
    lg.selectionHighlight.clearLayers();
    const selLat = selected?.lat || activeLocation?.lat;
    const selLng = selected?.long || activeLocation?.long;

    if (selLat && selLng) {
      // Outer radar pulse circle
      L.circle([selLat, selLng], {
        radius: 3500,
        color: "#00e5ff",
        weight: 1.5,
        dashArray: "4, 6",
        fillColor: "#00e5ff",
        fillOpacity: 0.08,
      }).addTo(lg.selectionHighlight);

      // Inner focus ring
      L.circle([selLat, selLng], {
        radius: 1200,
        color: "#00e5ff",
        weight: 2,
        fillColor: "transparent",
      }).addTo(lg.selectionHighlight);
    }
  }, [
    hour,
    layers,
    activeHazard,
    activePlaces,
    activeCenters,
    selected?.id,
    selected?.lat,
    selected?.long,
    activeLocation?.id,
    activeLocation?.lat,
    activeLocation?.long,
    handleSelect,
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapContainerRef}
        id="risk-map"
        className="map-canvas"
        aria-label="Interactive hyper-local risk map"
        style={{ width: "100%", height: "100%" }}
      />
      {layers.population && (
        <div
          style={{
            position: "absolute",
            bottom: "55px",
            left: "12px",
            zIndex: 400,
            background: "rgba(9, 23, 38, 0.94)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            borderRadius: "8px",
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.6)",
            fontSize: "9px",
            letterSpacing: "0.05em",
            backdropFilter: "blur(6px)",
          }}
        >
          <span style={{ fontSize: "13px" }}>👥</span>
          <div>
            <strong style={{ color: "#38bdf8", display: "block", fontSize: "10px" }}>
              POPULATION VULNERABILITY LAYER ACTIVE
            </strong>
            <span style={{ color: "#94a3b8", fontSize: "8.5px" }}>
              ~115,500 vulnerable pilgrims & valley residents • 9 mapped cluster nodes
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
