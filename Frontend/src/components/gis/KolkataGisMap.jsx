import { useRef, useEffect, useState } from "react";
import L from "leaflet";
import {
  HOOGHLY_RIVER,
  DRAINAGE_CANALS,
  FLOOD_DEPTH_ZONES,
  RISK_ZONES,
  ACTIVE_INCIDENTS,
  PUMPING_STATIONS,
  SPATIAL_RAIN_CELLS,
  GEOGRAPHIC_DISTRICTS,
} from "./kolkataCartographicData";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";

// Real-world geographic center of Kolkata (Esplanade / B.B.D. Bagh)
const KOLKATA_CENTER = [22.5726, 88.3639];

// Accurate coordinate converter from cartographic km offset to WGS84 Lat/Lng
function kmToLatLng(kmX, kmY) {
  // 1 deg lat = 111.13 km
  // 1 deg lng at 22.57° N = 102.6 km
  const lat = KOLKATA_CENTER[0] - kmY / 111.13;
  const lng = KOLKATA_CENTER[1] + kmX / 102.6;
  return [lat, lng];
}

// Tile Layer Configurations (Realistic Satellite, Modern Street, Dark Tactical)
const TILE_PRESETS = {
  satellite: {
    id: "satellite",
    name: "Satellite",
    icon: "🛰️",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
  street: {
    id: "street",
    name: "Street",
    icon: "🗺️",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>, OpenStreetMap',
    maxZoom: 19,
  },
  dark: {
    id: "dark",
    name: "Dark Tactical",
    icon: "🌙",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>, OpenStreetMap',
    maxZoom: 19,
  },
};

export function KolkataGisMap({
  selectedDistrict,
  onSelectDistrict,
  overrideLayers,
  traceWaterFlow = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const layersGroupRef = useRef({});

  const [activePreset, setActivePreset] = useState("satellite"); // Default to realistic satellite imagery
  const store = useKWIStore();
  const activeLayers = overrideLayers || store.activeLayers;

  const selectedIncident = store.selectedIncident;
  const selectedRiskZone = store.selectedRiskZone;
  const selectedPumpStation = store.selectedPumpStation;

  // Initialize Leaflet Map Instance
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        // ignore
      }
      mapInstanceRef.current = null;
    }

    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    let map = null;
    try {
      map = L.map(container, {
        center: [22.565, 88.375],
        zoom: 12,
        minZoom: 10,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      });

      // Add base tile layer
      const preset = TILE_PRESETS[activePreset] || TILE_PRESETS.satellite;
      const tileLayer = L.tileLayer(preset.url, {
        maxZoom: preset.maxZoom,
        subdomains: "abcd",
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      // Create Layer Groups
      layersGroupRef.current = {
        risk: L.layerGroup().addTo(map),
        incidents: L.layerGroup().addTo(map),
        drainage: L.layerGroup().addTo(map),
        pumps: L.layerGroup().addTo(map),
        rain: L.layerGroup().addTo(map),
        forecast: L.layerGroup().addTo(map),
      };

      setTimeout(() => {
        try {
          if (map) map.invalidateSize();
        } catch (e) {
          // ignore
        }
      }, 100);
    } catch (err) {
      console.warn("Leaflet container safe handled:", err);
    }

    return () => {
      try {
        if (map) {
          map.remove();
        }
      } catch (e) {
        // ignore
      }
      if (container) {
        container._leaflet_id = null;
      }
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Base Tile Preset Switch (Satellite vs Street vs Dark)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const preset = TILE_PRESETS[activePreset] || TILE_PRESETS.satellite;
    try {
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
      const newTileLayer = L.tileLayer(preset.url, {
        maxZoom: preset.maxZoom,
        subdomains: "abcd",
      }).addTo(map);

      tileLayerRef.current = newTileLayer;
    } catch (e) {
      console.warn("Tile layer switch error handled:", e);
    }
  }, [activePreset]);

  // Synchronize Active Vector Layers (Risk, Incidents, Drainage, Pumps, Rain, Forecast)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersGroupRef.current.risk) return;

    const { risk, incidents, drainage, pumps, rain, forecast } = layersGroupRef.current;

    // 1. RISK ZONES LAYER
    risk.clearLayers();
    if (activeLayers.risk !== false) {
      RISK_ZONES.forEach((zone) => {
        const polygonCoords = zone.polygon || zone.points || [];
        if (!polygonCoords.length) return;
        const latLngs = polygonCoords.map(([x, y]) => kmToLatLng(x, y));
        const color =
          zone.level === "CRITICAL"
            ? "#ef4444"
            : zone.level === "HIGH"
            ? "#f97316"
            : zone.level === "MODERATE"
            ? "#eab308"
            : "#22c55e";

        const polygon = L.polygon(latLngs, {
          color: color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.28,
        });

        polygon.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 170px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px;">${zone.name}</div>
            <div style="color: ${color}; font-weight: 600; font-size: 11px; margin-bottom: 6px;">
              SEVERITY: ${zone.level} (Risk ${zone.riskScore})
            </div>
            <div style="font-size: 11px; color: #475569;">
              <div>Water Depth: <b>${zone.waterDepth}</b></div>
              <div>Rainfall: <b>${zone.rainfall}</b></div>
              <div>Drainage Load: <b>${zone.drainageLoad}</b></div>
            </div>
          </div>
        `);

        polygon.on("click", () => {
          audioEngine.playUiChirp(840);
          store.setSelectedRiskZone(zone);
        });

        risk.addLayer(polygon);
      });
    }

    // 2. INCIDENTS LAYER
    incidents.clearLayers();
    if (activeLayers.incidents !== false) {
      ACTIVE_INCIDENTS.forEach((inc) => {
        const [lat, lng] = kmToLatLng(inc.x, inc.y);
        const isCrit = inc.severity === "CRITICAL" || inc.severity === "HIGH";

        // Custom pulsing HTML radar pin
        const pulseIcon = L.divIcon({
          className: "custom-incident-pin",
          html: `
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <span style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${
                isCrit ? "#f43f5e" : "#eab308"
              }; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background-color: ${
                isCrit ? "#e11d48" : "#ca8a04"
              }; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></span>
              <div style="position: absolute; top: -18px; background: rgba(15,23,42,0.85); color: #fff; font-size: 9px; font-weight: bold; padding: 1px 4px; border-radius: 4px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.3); font-family: monospace;">
                ${inc.waterDepth}
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([lat, lng], { icon: pulseIcon });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 190px;">
            <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${inc.location}</div>
            <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-bottom: 6px;">${inc.id} // ${inc.subdivision}</div>
            <div style="font-size: 11px; margin-bottom: 6px;">
              <div>Depth: <b style="color: #e11d48;">${inc.waterDepth}</b></div>
              <div>Reports: <b>${inc.verifiedReports} verified</b></div>
              <div>Status: <b>${inc.status}</b></div>
            </div>
            <div style="font-size: 10px; color: #0284c7; font-weight: 600;">Nearest Station: ${inc.nearestPump}</div>
          </div>
        `);

        marker.on("click", () => {
          audioEngine.playUiChirp(1040);
          store.setSelectedIncident(inc);
        });

        incidents.addLayer(marker);
      });
    }

    // 3. DRAINAGE CANALS & TRUNK CONDUITS LAYER
    drainage.clearLayers();
    if (activeLayers.drainage !== false) {
      DRAINAGE_CANALS.forEach((canal) => {
        const rawPoints = canal.points || canal.path || [];
        if (!rawPoints.length) return;
        const latLngs = rawPoints.map(([x, y]) => kmToLatLng(x, y));
        const polyline = L.polyline(latLngs, {
          color: "#0284c7",
          weight: traceWaterFlow ? 4 : 3,
          dashArray: traceWaterFlow ? "8, 8" : undefined,
          opacity: 0.85,
        });

        polyline.bindTooltip(canal.name, { sticky: true, className: "canal-tooltip" });
        drainage.addLayer(polyline);
      });
    }

    // 4. PUMPING STATIONS LAYER
    pumps.clearLayers();
    if (activeLayers.pumps !== false) {
      PUMPING_STATIONS.forEach((ps) => {
        const [lat, lng] = kmToLatLng(ps.x, ps.y);
        const isCap = ps.isAtCapacity;

        const pumpIcon = L.divIcon({
          className: "custom-pump-pin",
          html: `
            <div style="background: ${
              isCap ? "#dc2626" : "#0284c7"
            }; color: white; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; border: 1.5px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); cursor: pointer; font-family: monospace;">
              PS
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([lat, lng], { icon: pumpIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 170px;">
            <div style="font-weight: 700; font-size: 13px;">${ps.name}</div>
            <div style="color: ${isCap ? "#dc2626" : "#0284c7"}; font-weight: 700; font-size: 11px; margin-bottom: 4px;">
              STATUS: ${ps.status} (${ps.pumpsRunning} Running)
            </div>
            <div style="font-size: 11px; color: #475569;">
              <div>Capacity: <b>${ps.capacity}</b></div>
              <div>Discharge: <b>${ps.dischargeRate}</b></div>
              <div>Outfall: <b>${ps.connectedCanal}</b></div>
            </div>
          </div>
        `);

        marker.on("click", () => {
          audioEngine.playUiChirp(920);
          store.setSelectedPumpStation(ps);
        });

        pumps.addLayer(marker);
      });
    }

    // 5. RAINFALL RADAR OVERLAY
    rain.clearLayers();
    if (activeLayers.rain !== false) {
      SPATIAL_RAIN_CELLS.forEach((cell) => {
        if (!cell || !cell.center) return;
        const [lat, lng] = kmToLatLng(cell.center[0], cell.center[1]);
        const radiusKm = cell.radiusX || cell.radiusY || cell.radiusKm || 3.0;
        const radiusMeters = radiusKm * 1000;
        if (!radiusMeters || isNaN(radiusMeters)) return;

        const circle = L.circle([lat, lng], {
          radius: radiusMeters,
          color: "#38bdf8",
          fillColor: "#0284c7",
          fillOpacity: 0.16,
          weight: 1,
        });
        rain.addLayer(circle);
      });
    }

    // 6. FORECAST INUNDATION ZONES
    forecast.clearLayers();
    if (activeLayers.forecast !== false) {
      FLOOD_DEPTH_ZONES.forEach((zone) => {
        const polygonCoords = zone.polygon || [];
        if (!polygonCoords.length) return;
        const latLngs = polygonCoords.map(([x, y]) => kmToLatLng(x, y));
        const poly = L.polygon(latLngs, {
          color: zone.borderColor || "#f43f5e",
          fillColor: zone.fillColor || "rgba(244, 63, 94, 0.2)",
          fillOpacity: 0.22,
          weight: 2,
          dashArray: "4, 6",
        });
        poly.bindTooltip(`${zone.district || 'Inundation'}: ${zone.depthCm || 20} cm projected`, { sticky: true });
        forecast.addLayer(poly);
      });
    }
  }, [activeLayers, traceWaterFlow, store]);

  // Smooth Viewport Focus upon Selection
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedIncident) {
      const [lat, lng] = kmToLatLng(selectedIncident.x, selectedIncident.y);
      map.flyTo([lat, lng], 14, { duration: 1.2 });
      return;
    }

    if (selectedPumpStation) {
      const [lat, lng] = kmToLatLng(selectedPumpStation.x, selectedPumpStation.y);
      map.flyTo([lat, lng], 14, { duration: 1.2 });
      return;
    }

    if (selectedRiskZone) {
      const [lat, lng] = kmToLatLng(
        selectedRiskZone.center[0],
        selectedRiskZone.center[1],
      );
      map.flyTo([lat, lng], 13.5, { duration: 1.2 });
      return;
    }

    if (selectedDistrict) {
      const d = GEOGRAPHIC_DISTRICTS.find((item) => item.id === selectedDistrict);
      if (d) {
        const [lat, lng] = kmToLatLng(d.center[0], d.center[1]);
        map.flyTo([lat, lng], 13.5, { duration: 1.2 });
      }
    }
  }, [selectedIncident, selectedPumpStation, selectedRiskZone, selectedDistrict]);

  // Handle External Zoom Controls from Store
  const lastZoomTrigger = useRef(store.zoomTrigger);
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (store.zoomTrigger !== lastZoomTrigger.current) {
      if (store.zoomTrigger > lastZoomTrigger.current) {
        map.zoomIn();
      } else {
        map.zoomOut();
      }
      lastZoomTrigger.current = store.zoomTrigger;
    }
  }, [store.zoomTrigger]);

  const lastResetTrigger = useRef(store.resetCameraTrigger);
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (store.resetCameraTrigger !== lastResetTrigger.current) {
      map.flyTo([22.565, 88.375], 12, { duration: 1.0 });
      lastResetTrigger.current = store.resetCameraTrigger;
    }
  }, [store.resetCameraTrigger]);

  return (
    <div className="relative w-full h-full min-h-[480px]">
      {/* Realistic Leaflet Map Mount Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Floating Realistic Tile Mode Switcher (Top Right) */}
      <div className="absolute top-4 right-4 z-[400] flex items-center p-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-white/20 shadow-lg text-xs">
        {Object.values(TILE_PRESETS).map((preset) => {
          const isSelected = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setActivePreset(preset.id);
                audioEngine.playUiChirp(isSelected ? 900 : 1100);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                isSelected
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default KolkataGisMap;
