import { useEffect, useMemo } from "react";
import L from "leaflet";
import { places as fallbackPlaces, type Hazard, type RiskLevel } from "../data/mock";

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

type Props = {
  hour: number;
  layers: Record<string, boolean>;
  selectedHazard?: Hazard | "All";
  hazard?: Hazard | "All";
  onSelect?: (p: PlaceZone) => void;
  setSelected?: (p: PlaceZone) => void;
  places?: PlaceZone[];
  centers?: RiskCenter[];
};

const defaultCenters: RiskCenter[] = [
  { lat: 30.393, long: 79.07, r: 0.045, level: "HIGH", hazard: "Cloudburst" },
  { lat: 30.352, long: 79.06, r: 0.035, level: "MODERATE", hazard: "Flash Flood" },
  { lat: 30.42, long: 79.12, r: 0.032, level: "WATCH", hazard: "Thunderstorm" },
  { lat: 30.285, long: 78.981, r: 0.025, level: "MODERATE", hazard: "Cloudburst" },
];

export default function MapView({
  hour,
  layers,
  selectedHazard,
  hazard,
  onSelect,
  setSelected,
  places,
  centers,
}: Props) {
  const activeHazard = hazard || selectedHazard || "All";
  const handleSelect = onSelect || setSelected || (() => {});
  const activePlaces = places && places.length > 0 ? places : (fallbackPlaces as PlaceZone[]);
  const activeCenters = centers && centers.length > 0 ? centers : defaultCenters;

  const layerPlaces = useMemo(
    () =>
      activePlaces.filter(
        (p) => activeHazard === "All" || p.hazard === activeHazard,
      ),
    [activePlaces, activeHazard],
  );

  useEffect(() => {
    const el = document.getElementById("risk-map");
    if (!el) return;
    const map = L.map(el, { zoomControl: false }).setView([30.355, 79.055], 11);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    if (layers.rivers) {
      L.polyline(
        [
          [30.47, 79.02],
          [30.43, 79.04],
          [30.39, 79.06],
          [30.35, 79.07],
          [30.31, 79.0],
        ],
        { color: "#1fb6ff", weight: 4, opacity: 0.8 },
      )
        .addTo(map)
        .bindTooltip("Mandakini River");
    }

    if (layers.roads) {
      L.polyline(
        [
          [30.42, 79.01],
          [30.39, 79.05],
          [30.36, 79.07],
          [30.3, 79.02],
          [30.28, 78.98],
        ],
        { color: "#64748b", weight: 3, dashArray: "7 8", opacity: 0.9 },
      )
        .addTo(map)
        .bindTooltip("Strategic road corridor");
      L.polyline(
        [
          [30.4, 79.11],
          [30.37, 79.08],
          [30.35, 79.06],
        ],
        { color: "#64748b", weight: 2, dashArray: "5 7", opacity: 0.8 },
      ).addTo(map);
    }

    if (layers.terrain) {
      [
        [30.43, 79.02, 0.07],
        [30.33, 79.12, 0.06],
        [30.28, 79.08, 0.05],
      ].forEach(([lat, lng, r]) =>
        L.circle([lat, lng], {
          radius: r * 100000,
          color: "#6b7280",
          weight: 1,
          fillColor: "#334155",
          fillOpacity: 0.13,
        }).addTo(map),
      );
    }

    if (layers.population) {
      L.circleMarker([30.285, 78.981], {
        radius: 9,
        color: "#f8fafc",
        fillColor: "#22c55e",
        fillOpacity: 0.75,
      })
        .addTo(map)
        .bindTooltip("Rudraprayag population cluster");
      L.circleMarker([30.355, 79.062], {
        radius: 7,
        color: "#f8fafc",
        fillColor: "#f59e0b",
        fillOpacity: 0.75,
      })
        .addTo(map)
        .bindTooltip("Pilgrim / transit cluster");
    }

    if (layers.risk) {
      activeCenters.forEach((z) => {
        const show = activeHazard === "All" || activeHazard === z.hazard;
        if (!show) return;
        const growth = 1 + Math.max(0, 3 - hour) * 0.015;
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
          weight: 2,
        }).addTo(map);
      });
    }

    layerPlaces.forEach((p) => {
      const color =
        p.level === "HIGH"
          ? "#ef4444"
          : p.level === "MODERATE"
            ? "#f97316"
            : "#eab308";
      const icon = L.divIcon({
        className: "hazard-pin",
        html: `<span style="background:${color}"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([p.lat, p.long], { icon })
        .addTo(map)
        .bindTooltip(`${p.name} • ${p.hazard}`)
        .bindPopup(
          `<div style="min-width:190px"><b>${p.name}</b><br/><span>${p.hazard} • ${p.level}</span><hr/><b>${p.prob}% probability</b><br/>Lead time: ${p.lead}<br/>Signals: ${p.signals}</div>`,
        )
        .on("click", () => handleSelect(p));
    });

    L.marker([30.285, 78.981], {
      icon: L.divIcon({
        className: "control-pin",
        html: "<span>⌂</span>",
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    })
      .addTo(map)
      .bindTooltip("Rudraprayag District Control Zone");

    return () => {
      map.remove();
    };
  }, [hour, layers, activeHazard, handleSelect, layerPlaces, activeCenters]);

  return (
    <div
      id="risk-map"
      className="map-canvas"
      aria-label="Interactive hyper-local risk map"
    />
  );
}
