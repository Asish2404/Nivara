import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as maplibregl from "maplibre-gl";
import {
  HOOGHLY_RIVER,
  ACTIVE_INCIDENTS,
  PUMPING_STATIONS,
  REAL_KOLKATA_LANDMARKS,
  WARD63_OVERLAY_CONFIG,
  WARD63_CALIBRATION_POINTS,
  getCanalsGeoJson,
  getTrunkConduitsGeoJson,
  getRiskZonesGeoJson,
  getFloodDepthGeoJson,
  getSimulationSpreadGeoJson,
  getHooghlyRiverGeoJson,
  getWaterbodiesGeoJson,
  kmToGeoCoord,
  KOLKATA_CENTER_GEO,
} from "./kolkataCartographicData";
import { useKWIStore } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";
import {
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Droplets,
  Activity,
  CheckCircle2,
  ArrowRight,
  X,
  Play,
  SlidersHorizontal,
  Clock,
  Waves,
} from "lucide-react";

// Professional GIS Basemap Styles for Kolkata
const MAP_STYLES = {
  satellite: {
    id: "satellite",
    name: "Satellite",
    icon: "🛰️",
    description: "Realistic aerial imagery & geographic labels",
    spec: {
      version: 8,
      sources: {
        "esri-satellite": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "© Esri, Maxar, Earthstar Geographics",
          maxzoom: 19,
        },
        "esri-labels": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: "satellite-layer",
          type: "raster",
          source: "esri-satellite",
          minzoom: 0,
          maxzoom: 19,
        },
        {
          id: "labels-layer",
          type: "raster",
          source: "esri-labels",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
};

export const KolkataGisMap = React.memo(function KolkataGisMap({
  selectedDistrict,
  onSelectDistrict,
  overrideLayers,
  traceWaterFlow = false,
  showLegend = true,
  className = "",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const incidentMarkerMapRef = useRef({});
  const wrapperRef = useRef(null);

  // Active Map Mode & Controls State
  const [activeStyleKey, setActiveStyleKey] = useState("satellite"); // Default: Realistic Satellite
  const [is3DMode, setIs3DMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [timelineStep, setTimelineStep] = useState(0); // 0, 15, 30, 45, 60 mins
  const [simulateState, setSimulateState] = useState(null); // null | 'BEFORE' | 'AFTER'

  // Internal layer toggles
  const store = useKWIStore();
  const [layerVisibility, setLayerVisibility] = useState({
    canals: true,
    drainage: true,
    incidents: true,
    risk: true,
    pumps: true,
    spread: true,
    landmarks: true,
  });

  const activeLayers = useMemo(() => {
    if (overrideLayers) return overrideLayers;
    return {
      canals: layerVisibility.canals && store.activeLayers.drainage !== false,
      drainage: layerVisibility.drainage && store.activeLayers.drainage !== false,
      incidents: layerVisibility.incidents && store.activeLayers.incidents !== false,
      risk: layerVisibility.risk && store.activeLayers.risk !== false,
      pumps: layerVisibility.pumps && store.activeLayers.pumps !== false,
      spread: layerVisibility.spread && store.activeLayers.forecast !== false,
      landmarks: layerVisibility.landmarks,
    };
  }, [
    overrideLayers,
    layerVisibility.canals,
    layerVisibility.drainage,
    layerVisibility.incidents,
    layerVisibility.risk,
    layerVisibility.pumps,
    layerVisibility.spread,
    layerVisibility.landmarks,
    store.activeLayers?.drainage,
    store.activeLayers?.incidents,
    store.activeLayers?.risk,
    store.activeLayers?.pumps,
    store.activeLayers?.forecast,
  ]);

  const selectedIncident = store.selectedIncident;
  const selectedRiskZone = store.selectedRiskZone;
  const selectedPumpStation = store.selectedPumpStation;

  // Toggle individual layers locally
  const toggleLocalLayer = (key) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
    audioEngine.playUiChirp(1150);
  };

  // -------------------------------------------------------------
  // Helper: Synchronize Vector & GeoJSON Overlays onto MapLibre Map
  // -------------------------------------------------------------
  const syncMapOverlays = useCallback(
    (map) => {
      if (!map || !map.isStyleLoaded()) return;

      // 0. HOOGHLY RIVER (LineString / Western Artery)
      if (!map.getSource("hooghly-source")) {
        map.addSource("hooghly-source", {
          type: "geojson",
          data: getHooghlyRiverGeoJson(),
        });
        map.addLayer({
          id: "hooghly-river-casing",
          type: "line",
          source: "hooghly-source",
          paint: {
            "line-color": "#0284c7",
            "line-width": 14,
            "line-opacity": 0.45,
          },
        });
        map.addLayer({
          id: "hooghly-river-line",
          type: "line",
          source: "hooghly-source",
          paint: {
            "line-color": "#38bdf8",
            "line-width": 6,
            "line-opacity": 0.9,
          },
        });
      }

      // 1. CANALS (LineString)
      if (!map.getSource("canals-source")) {
        map.addSource("canals-source", {
          type: "geojson",
          data: getCanalsGeoJson(),
        });
        map.addLayer({
          id: "canals-casing",
          type: "line",
          source: "canals-source",
          paint: {
            "line-color": "#083344",
            "line-width": 6,
            "line-opacity": 0.6,
          },
        });
        map.addLayer({
          id: "canals-line",
          type: "line",
          source: "canals-source",
          paint: {
            "line-color": "#06b6d4",
            "line-width": traceWaterFlow ? 4.5 : 3.0,
            "line-opacity": 0.95,
          },
        });
      }

      // 2. DRAINAGE TRUNK CONDUITS (LineString)
      if (!map.getSource("trunk-source")) {
        map.addSource("trunk-source", {
          type: "geojson",
          data: getTrunkConduitsGeoJson(),
        });
        map.addLayer({
          id: "trunk-line",
          type: "line",
          source: "trunk-source",
          paint: {
            "line-color": "#3b82f6",
            "line-width": 2.5,
            "line-dasharray": [3, 2],
            "line-opacity": 0.85,
          },
        });
      }

      // 2b. AUTHORITATIVE WARD 63 DRAINAGE NETWORK OVERLAY (Orthorectified Raster from Scanned Engineering Blueprint)
      if (!map.getSource(WARD63_OVERLAY_CONFIG.sourceId)) {
        map.addSource(WARD63_OVERLAY_CONFIG.sourceId, {
          type: "image",
          url: WARD63_OVERLAY_CONFIG.url,
          coordinates: WARD63_OVERLAY_CONFIG.coordinates,
        });
        map.addLayer({
          id: WARD63_OVERLAY_CONFIG.layerId,
          type: "raster",
          source: WARD63_OVERLAY_CONFIG.sourceId,
          paint: {
            "raster-opacity": 0.98,
            "raster-fade-duration": 150,
          },
        });
      }

      // 3. RISK ZONES (Polygon)
      if (!map.getSource("risk-source")) {
        map.addSource("risk-source", {
          type: "geojson",
          data: getRiskZonesGeoJson(),
        });
        map.addLayer({
          id: "risk-fill",
          type: "fill",
          source: "risk-source",
          paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": 0.22,
          },
        });
        map.addLayer({
          id: "risk-line",
          type: "line",
          source: "risk-source",
          paint: {
            "line-color": ["get", "color"],
            "line-width": 2,
            "line-opacity": 0.8,
          },
        });
      }

      // 4. WATERBODIES, PONDS & WETLANDS (Polygon)
      if (!map.getSource("waterbodies-source")) {
        map.addSource("waterbodies-source", {
          type: "geojson",
          data: getWaterbodiesGeoJson(),
        });
        map.addLayer({
          id: "waterbodies-fill",
          type: "fill",
          source: "waterbodies-source",
          paint: {
            "fill-color": "#0284c7",
            "fill-opacity": 0.35,
          },
        });
        map.addLayer({
          id: "waterbodies-line",
          type: "line",
          source: "waterbodies-source",
          paint: {
            "line-color": "#38bdf8",
            "line-width": 1.5,
          },
        });
      }

      // 5. AI PREDICTED SPREAD / INUNDATION FOOTPRINT (Polygon)
      if (!map.getSource("spread-source")) {
        map.addSource("spread-source", {
          type: "geojson",
          data: getFloodDepthGeoJson(timelineStep),
        });
        map.addLayer({
          id: "spread-fill",
          type: "fill",
          source: "spread-source",
          paint: {
            "fill-color": ["get", "fillColor"],
            "fill-opacity": 0.28,
          },
        });
        map.addLayer({
          id: "spread-line",
          type: "line",
          source: "spread-source",
          paint: {
            "line-color": ["get", "borderColor"],
            "line-width": 2,
            "line-dasharray": [4, 3],
          },
        });
      }

      // 6. SIMULATION SPREAD (Before vs After Mitigation)
      if (!map.getSource("simulation-source")) {
        map.addSource("simulation-source", {
          type: "geojson",
          data: getSimulationSpreadGeoJson(simulateState === "AFTER"),
        });
        map.addLayer({
          id: "simulation-fill",
          type: "fill",
          source: "simulation-source",
          paint: {
            "fill-color": ["get", "fillColor"],
            "fill-opacity": 0.45,
          },
        });
        map.addLayer({
          id: "simulation-line",
          type: "line",
          source: "simulation-source",
          paint: {
            "line-color": ["get", "color"],
            "line-width": 3,
          },
        });
      }

      // Apply Layer Visibilities
      if (map.getLayer("canals-line")) {
        map.setLayoutProperty(
          "canals-line",
          "visibility",
          activeLayers.canals ? "visible" : "none"
        );
        map.setLayoutProperty(
          "canals-casing",
          "visibility",
          activeLayers.canals ? "visible" : "none"
        );
      }
      if (map.getLayer("trunk-line")) {
        // Authoritative Ward 63 drainage raster replaces synthetic conduit lines
        map.setLayoutProperty(
          "trunk-line",
          "visibility",
          "none"
        );
      }
      if (map.getLayer(WARD63_OVERLAY_CONFIG.layerId)) {
        map.setLayoutProperty(
          WARD63_OVERLAY_CONFIG.layerId,
          "visibility",
          activeLayers.drainage ? "visible" : "none"
        );
      }
      if (map.getLayer("risk-fill")) {
        map.setLayoutProperty(
          "risk-fill",
          "visibility",
          activeLayers.risk ? "visible" : "none"
        );
        map.setLayoutProperty(
          "risk-line",
          "visibility",
          activeLayers.risk ? "visible" : "none"
        );
      }
      if (map.getLayer("spread-fill")) {
        map.setLayoutProperty(
          "spread-fill",
          "visibility",
          activeLayers.spread && !simulateState ? "visible" : "none"
        );
        map.setLayoutProperty(
          "spread-line",
          "visibility",
          activeLayers.spread && !simulateState ? "visible" : "none"
        );
      }
      if (map.getLayer("simulation-fill")) {
        map.setLayoutProperty(
          "simulation-fill",
          "visibility",
          simulateState ? "visible" : "none"
        );
        map.setLayoutProperty(
          "simulation-line",
          "visibility",
          simulateState ? "visible" : "none"
        );
      }

      // -------------------------------------------------------------
      // Dynamic GIS Cursor State Listeners for Map Layers
      // -------------------------------------------------------------
      const container = wrapperRef.current;
      if (container) {
        const setMapCursor = (mode) => {
          container.setAttribute("data-cursor", mode);
        };
        const resetMapCursor = () => {
          container.setAttribute("data-cursor", "map");
        };

        const layerModeBindings = [
          { layers: ["hooghly-river-line", "hooghly-river-casing"], mode: "river" },
          { layers: ["canals-line", "canals-casing", "trunk-line"], mode: "drainage" },
          { layers: ["risk-fill", "risk-line"], mode: "risk" },
          {
            layers: ["waterbodies-fill", "waterbodies-line", "spread-fill", "spread-line", "simulation-fill"],
            mode: "waterbody",
          },
        ];

        layerModeBindings.forEach(({ layers, mode }) => {
          layers.forEach((layerId) => {
            if (map.getLayer(layerId)) {
              map.on("mouseenter", layerId, () => setMapCursor(mode));
              map.on("mouseleave", layerId, resetMapCursor);
            }
          });
        });
      }
    },
    [activeLayers, traceWaterFlow, timelineStep, simulateState]
  );

  // -------------------------------------------------------------
  // Helper: Synchronize Custom DOM Markers (Incidents, Pumps, Landmarks)
  // -------------------------------------------------------------
  const syncMarkers = useCallback(
    (map) => {
      if (!map) return;

      // Remove previous markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      incidentMarkerMapRef.current = {};

      // 1. ACTIVE WATERLOGGING INCIDENTS
      if (activeLayers.incidents) {
        ACTIVE_INCIDENTS.forEach((inc) => {
          const coords = kmToGeoCoord(inc.x, inc.y);
          const isCritical = inc.severity === "CRITICAL" || inc.severity === "HIGH";

          const el = document.createElement("div");
          el.className = "cursor-pointer group relative flex items-center justify-center transition-transform duration-300 kwi-incident-marker";
          el.setAttribute("data-cursor", "incident");
          el.setAttribute("data-incident-id", inc.id);
          el.setAttribute("title", `${inc.name}: ${inc.waterDepth}`);
          el.innerHTML = `
            <div class="kwi-incident-marker-body" style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
              <!-- Outer radar pulse ripple -->
              <span class="kwi-incident-ripple" style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${isCritical ? "rgba(244, 63, 94, 0.75)" : "rgba(245, 158, 11, 0.7)"
            }; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              
              <!-- Center solid badge -->
              <span class="kwi-incident-dot" style="position: relative; width: 15px; height: 15px; border-radius: 9999px; background-color: ${isCritical ? "#e11d48" : "#d97706"
            }; border: 2.5px solid #ffffff; box-shadow: 0 0 12px rgba(0,0,0,0.6); transition: all 0.3s ease;"></span>
              
              <!-- Floating Depth Tag -->
              <div class="kwi-incident-tag" style="position: absolute; top: -20px; background: rgba(15,23,42,0.92); color: #ffffff; font-size: 9.5px; font-weight: 700; padding: 1.5px 6px; border-radius: 5px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.25); font-family: monospace; letter-spacing: -0.02em; pointer-events: none; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: all 0.25s ease;">
                ${inc.waterDepth}
              </div>
            </div>
          `;

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            audioEngine.playUiChirp(1200);
            store.setSelectedIncident(inc);
            map.flyTo({
              center: coords,
              zoom: 14.5,
              pitch: 42,
              duration: 1200,
            });
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(coords)
            .addTo(map);

          markersRef.current.push(marker);
          incidentMarkerMapRef.current[inc.id] = { marker, el, inc };
        });
      }

      // 2. PUMPING STATIONS
      if (activeLayers.pumps) {
        PUMPING_STATIONS.forEach((ps) => {
          const coords = kmToGeoCoord(ps.x, ps.y);
          const isCap = ps.isAtCapacity;

          const el = document.createElement("div");
          el.className = "cursor-pointer group flex items-center gap-1";
          el.setAttribute("data-cursor", "pump");
          el.setAttribute("title", `${ps.name} - ${ps.status}`);
          el.innerHTML = `
            <div style="background: ${isCap ? "#dc2626" : "#0284c7"
            }; color: white; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; border: 1.5px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.45); font-family: monospace;">
              PS
            </div>
            <div style="background: rgba(15,23,42,0.88); color: ${isCap ? "#fca5a5" : "#7dd3fc"
            }; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); font-family: monospace; white-space: nowrap;">
              ${ps.id}: ${ps.capacity}
            </div>
          `;

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            audioEngine.playUiChirp(920);
            store.setSelectedPumpStation(ps);
            map.flyTo({
              center: coords,
              zoom: 14.2,
              pitch: 38,
              duration: 1100,
            });
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(coords)
            .addTo(map);

          markersRef.current.push(marker);
        });
      }

      // 3. KEY REAL KOLKATA LANDMARKS (Minimal clean geographic anchors)
      if (activeLayers.landmarks) {
        REAL_KOLKATA_LANDMARKS.forEach((lm) => {
          const el = document.createElement("div");
          el.className =
            "pointer-events-auto px-2 py-0.5 rounded-md bg-slate-950/75 backdrop-blur-xs border border-white/20 text-[10px] font-semibold text-slate-200 tracking-tight shadow-xs hover:border-cyan-400 hover:text-white transition-all cursor-pointer font-sans select-none";
          el.setAttribute("data-cursor", "map");
          el.textContent = lm.name;

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            audioEngine.playUiChirp(1050);
            map.flyTo({
              center: lm.coordinates,
              zoom: 13.8,
              pitch: is3DMode ? 40 : 0,
              duration: 1200,
            });
          });

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat(lm.coordinates)
            .addTo(map);

          markersRef.current.push(marker);
        });
      }

      // 4. TEMPORARY CALIBRATION CONTROL POINTS FOR WARD 63 / VICTORIA OVERLAY
      if (activeLayers.drainage) {
        WARD63_CALIBRATION_POINTS.forEach((cp) => {
          const el = document.createElement("div");
          el.className = "cursor-pointer group relative flex flex-col items-center select-none";
          el.setAttribute("data-cursor", "target");
          el.setAttribute("title", `${cp.id}: ${cp.name}`);
          el.innerHTML = `
            <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
              <!-- Outer calibration reticle ripple -->
              <span style="position: absolute; inset: 0; border-radius: 9999px; border: 1.5px dashed #06b6d4; animation: spin 8s linear infinite; background: rgba(6, 182, 212, 0.2);"></span>
              
              <!-- Center crosshair node -->
              <span style="position: relative; width: 10px; height: 10px; border-radius: 9999px; background-color: #22d3ee; border: 2px solid #ffffff; box-shadow: 0 0 10px #06b6d4;"></span>
              
              <!-- Target Crosshair Lines -->
              <span style="position: absolute; width: 24px; height: 1px; background: rgba(34, 211, 238, 0.7); pointer-events: none;"></span>
              <span style="position: absolute; width: 1px; height: 24px; background: rgba(34, 211, 238, 0.7); pointer-events: none;"></span>
            </div>
            
            <!-- Calibration ID & Landmark Label Tag -->
            <div style="margin-top: 2px; background: rgba(15, 23, 42, 0.94); color: #e2e8f0; font-size: 8.5px; font-weight: 700; padding: 2px 6px; border-radius: 6px; border: 1px solid rgba(6, 182, 212, 0.6); font-family: monospace; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 4px; pointer-events: none;">
              <span style="color: #22d3ee; font-weight: 800;">[${cp.id}]</span>
              <span>${cp.name}</span>
            </div>
          `;

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            audioEngine.playUiChirp(1350);
            map.flyTo({
              center: cp.coords,
              zoom: 16.0,
              pitch: is3DMode ? 42 : 0,
              duration: 1200,
            });
          });

          const marker = new maplibregl.Marker({ element: el, anchor: "center" })
            .setLngLat(cp.coords)
            .addTo(map);

          markersRef.current.push(marker);
        });
      }
    },
    [activeLayers.incidents, activeLayers.pumps, activeLayers.landmarks, activeLayers.drainage, is3DMode]
  );

  // -------------------------------------------------------------
  // Map Initialization
  // -------------------------------------------------------------
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const currentPreset = MAP_STYLES[activeStyleKey] || MAP_STYLES.satellite;

    const map = new maplibregl.Map({
      container,
      style: currentPreset.spec,
      center: [88.3639, 22.565], // Esplanade / Central Kolkata
      zoom: 12.3,
      minZoom: 10,
      maxZoom: 18.5,
      pitch: 32, // 3D perspective pitch
      bearing: -5,
      antialias: true,
      attributionControl: false,
    });

    map.on("load", () => {
      syncMapOverlays(map);
      syncMarkers(map);
    });

    mapInstanceRef.current = map;
    if (typeof window !== "undefined") {
      window.__kolkataMapInstance = map;
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (typeof window !== "undefined") {
        window.__kolkataMapInstance = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // -------------------------------------------------------------
  // Handle Style Switching (Satellite vs Street vs Intelligence)
  // -------------------------------------------------------------
  const prevStyleKeyRef = useRef(activeStyleKey);
  const syncMapOverlaysRef = useRef(syncMapOverlays);
  syncMapOverlaysRef.current = syncMapOverlays;
  const syncMarkersRef = useRef(syncMarkers);
  syncMarkersRef.current = syncMarkers;

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Only switch style if activeStyleKey actually changed!
    if (prevStyleKeyRef.current === activeStyleKey) return;
    prevStyleKeyRef.current = activeStyleKey;

    const currentPreset = MAP_STYLES[activeStyleKey] || MAP_STYLES.satellite;

    map.setStyle(currentPreset.spec, {
      diff: false,
    });

    const handleStyleLoad = () => {
      syncMapOverlaysRef.current(map);
      syncMarkersRef.current(map);
    };

    map.once("style.load", handleStyleLoad);
  }, [activeStyleKey]);

  // -------------------------------------------------------------
  // Synchronize Layer Visibilities (Instantaneous WebGL toggle, NO blinking)
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer("canals-line")) {
      map.setLayoutProperty(
        "canals-line",
        "visibility",
        activeLayers.canals ? "visible" : "none"
      );
      map.setLayoutProperty(
        "canals-casing",
        "visibility",
        activeLayers.canals ? "visible" : "none"
      );
    }
    if (map.getLayer("trunk-line")) {
      map.setLayoutProperty(
        "trunk-line",
        "visibility",
        "none"
      );
    }
    if (map.getLayer(WARD63_OVERLAY_CONFIG.layerId)) {
      map.setLayoutProperty(
        WARD63_OVERLAY_CONFIG.layerId,
        "visibility",
        activeLayers.drainage ? "visible" : "none"
      );
    }
    if (map.getLayer("risk-fill")) {
      map.setLayoutProperty(
        "risk-fill",
        "visibility",
        activeLayers.risk ? "visible" : "none"
      );
      map.setLayoutProperty(
        "risk-line",
        "visibility",
        activeLayers.risk ? "visible" : "none"
      );
    }
    if (map.getLayer("spread-fill")) {
      map.setLayoutProperty(
        "spread-fill",
        "visibility",
        activeLayers.spread && !simulateState ? "visible" : "none"
      );
      map.setLayoutProperty(
        "spread-line",
        "visibility",
        activeLayers.spread && !simulateState ? "visible" : "none"
      );
    }
    if (map.getLayer("simulation-fill")) {
      map.setLayoutProperty(
        "simulation-fill",
        "visibility",
        simulateState ? "visible" : "none"
      );
      map.setLayoutProperty(
        "simulation-line",
        "visibility",
        simulateState ? "visible" : "none"
      );
    }
  }, [
    activeLayers.canals,
    activeLayers.drainage,
    activeLayers.risk,
    activeLayers.spread,
    simulateState,
  ]);

  // -------------------------------------------------------------
  // Synchronize Markers (Toggling incident, pump, or landmark markers)
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;
    syncMarkers(map);
  }, [syncMarkers]);

  // -------------------------------------------------------------
  // Synchronize Water Flow Animation Trace
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer("canals-line")) {
      map.setPaintProperty("canals-line", "line-width", traceWaterFlow ? 4.5 : 3.0);
    }
  }, [traceWaterFlow]);

  // -------------------------------------------------------------
  // Synchronize Timeline Scrubber with Flood Spread GeoJSON
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("spread-source");
    if (source) {
      source.setData(getFloodDepthGeoJson(timelineStep));
    }
  }, [timelineStep]);

  // -------------------------------------------------------------
  // Synchronize Simulation State (Before vs After)
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const simSource = map.getSource("simulation-source");
    if (simSource) {
      simSource.setData(getSimulationSpreadGeoJson(simulateState === "AFTER"));
    }

    if (map.getLayer("simulation-fill")) {
      map.setLayoutProperty(
        "simulation-fill",
        "visibility",
        simulateState ? "visible" : "none"
      );
      map.setLayoutProperty(
        "simulation-line",
        "visibility",
        simulateState ? "visible" : "none"
      );
    }
  }, [simulateState]);

  // -------------------------------------------------------------
  // Synchronize External Store Trigger Events (Zoom, Reset, Selection)
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedIncident) {
      const coords = kmToGeoCoord(selectedIncident.x, selectedIncident.y);
      map.flyTo({
        center: coords,
        zoom: 14.5,
        pitch: is3DMode ? 42 : 0,
        duration: 1100,
      });
      return;
    }

    if (selectedPumpStation) {
      const coords = kmToGeoCoord(selectedPumpStation.x, selectedPumpStation.y);
      map.flyTo({
        center: coords,
        zoom: 14.5,
        pitch: is3DMode ? 40 : 0,
        duration: 1100,
      });
      return;
    }

    if (selectedRiskZone && selectedRiskZone.center) {
      const coords = kmToGeoCoord(selectedRiskZone.center[0], selectedRiskZone.center[1]);
      map.flyTo({
        center: coords,
        zoom: 13.8,
        pitch: is3DMode ? 35 : 0,
        duration: 1100,
      });
      return;
    }

    if (selectedDistrict) {
      const landmark = REAL_KOLKATA_LANDMARKS.find((item) => item.id === selectedDistrict);
      if (landmark) {
        map.flyTo({
          center: landmark.coordinates,
          zoom: 14,
          pitch: is3DMode ? 38 : 0,
          duration: 1100,
        });
      }
    }
  }, [selectedIncident, selectedPumpStation, selectedRiskZone, selectedDistrict, is3DMode]);

  // Synchronize Live Incident Intelligence Card Hover Highlight on Map Hotspot
  useEffect(() => {
    const hoveredId = store.hoveredIncidentId;
    const mapObj = incidentMarkerMapRef.current;
    if (!mapObj) return;

    Object.entries(mapObj).forEach(([id, item]) => {
      if (!item || !item.el) return;
      const isHovered = hoveredId === id;
      if (isHovered) {
        item.el.classList.add("kwi-hotspot-hovered-active");
      } else {
        item.el.classList.remove("kwi-hotspot-hovered-active");
      }
    });
  }, [store.hoveredIncidentId]);

  // Handle Zoom In / Out from Store or Controls
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
      map.flyTo({
        center: [88.3639, 22.565],
        zoom: 12.3,
        pitch: 32,
        bearing: -5,
        duration: 1200,
      });
      setSimulateState(null);
      lastResetTrigger.current = store.resetCameraTrigger;
    }
  }, [store.resetCameraTrigger]);

  // -------------------------------------------------------------
  // WebGL Control Handlers
  // -------------------------------------------------------------
  const handleToggle3D = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    audioEngine.playUiChirp(next3D ? 1100 : 800);
    map.easeTo({
      pitch: next3D ? 45 : 0,
      duration: 800,
    });
  };

  const handleResetKolkata = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    audioEngine.playUiChirp(950);
    map.flyTo({
      center: [88.3639, 22.565],
      zoom: 12.3,
      pitch: is3DMode ? 32 : 0,
      bearing: 0,
      duration: 1200,
    });
    setSimulateState(null);
    store.clearSelections();
  };

  const handleZoomIn = () => {
    const map = mapInstanceRef.current;
    if (map) {
      audioEngine.playUiChirp(1000);
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    const map = mapInstanceRef.current;
    if (map) {
      audioEngine.playUiChirp(850);
      map.zoomOut();
    }
  };

  const toggleFullscreen = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    audioEngine.playUiChirp(1200);

    if (!document.fullscreenElement) {
      wrapper.requestFullscreen?.().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        mapInstanceRef.current?.resize();
      }, 150);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  return (
    <div
      ref={wrapperRef}
      data-cursor="map"
      className={`relative w-full h-full min-h-[500px] overflow-hidden bg-transparent select-none ${className}`}
    >
      {/* MapLibre WebGL Mount Canvas: Smooth top dissolve seamlessly materializes map from atmospheric haze */}
      <div
        ref={mapContainerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{
          maskImage: isFullscreen
            ? "none"
            : "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 20px, rgba(0,0,0,0.65) 55px, rgba(0,0,0,0.96) 95px, #000 130px)",
          WebkitMaskImage: isFullscreen
            ? "none"
            : "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 20px, rgba(0,0,0,0.65) 55px, rgba(0,0,0,0.96) 95px, #000 130px)",
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* Top Left: Enterprise GIS Municipal Telemetry Badge */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 text-white font-mono text-[11px] shadow-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-300 font-bold tracking-tight">
            KOLKATA MUNICIPAL GRID
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">WGS84 22.57°N, 88.36°E</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-emerald-400 font-bold hidden sm:inline">
            REAL GEOGRAPHIC SATELLITE
          </span>
        </div>

        {/* Hooghly River Sluice Telemetry Pill */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-white/10 text-[10px] text-slate-300 font-mono">
          <Waves className="w-3 h-3 text-cyan-400" />
          <span>Hooghly Water Level: +3.42m</span>
          <span className="text-slate-600">·</span>
          <span>41 Tidal Sluices Linked</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Top Right: Map Styles & WebGL Camera Control Ribbon */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        {/* 3D Tilt Toggle */}
        <button
          type="button"
          onClick={handleToggle3D}
          className={`p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer shadow-lg text-xs font-mono font-bold flex items-center gap-1 ${is3DMode
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
              : "bg-slate-900/90 text-slate-300 border-white/15 hover:bg-slate-800"
            }`}
          title={is3DMode ? "Switch to 2D Overhead" : "Switch to 3D Perspective"}
        >
          <Compass className="w-4 h-4" />
          <span className="hidden sm:inline">{is3DMode ? "3D" : "2D"}</span>
        </button>

        {/* Reset Kolkata View */}
        <button
          type="button"
          onClick={handleResetKolkata}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer shadow-lg"
          title="Reset Camera to Central Kolkata"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Zoom Controls */}
        <div className="flex items-center rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 p-0.5 shadow-lg">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-3 bg-white/10" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer shadow-lg"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Bottom Center: 0-60 Minute AI Spread Timeline Scrubber */}
      {/* ------------------------------------------------------------- */}
      {activeLayers.spread && !simulateState && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 text-white shadow-2xl">
            <div className="flex items-center gap-1.5 pr-2 border-r border-white/15 text-cyan-400 font-mono text-[11px] font-bold uppercase">
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Spread:</span>
            </div>
            {[0, 15, 30, 45, 60].map((mins) => {
              const active = timelineStep === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setTimelineStep(mins);
                    audioEngine.playUiChirp(800 + mins * 10);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${active
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)] border border-cyan-300/40"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {mins === 0 ? "NOW" : `+${mins}m`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Bottom Right: Operational Layers Selector Drawer Button */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-auto flex flex-col items-end gap-2">
        {showLayerMenu && (
          <div className="p-3 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl text-xs space-y-2 min-w-[200px] animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 font-bold text-slate-300 text-[11px] font-mono uppercase tracking-wider">
              <span>GIS Overlays</span>
              <span className="text-cyan-400">WGS84</span>
            </div>

            <div className="space-y-1.5 text-slate-200">
              <label className="flex items-center justify-between cursor-pointer hover:text-white py-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 bg-cyan-400 rounded-sm" />
                  Canals & Khals
                </span>
                <input
                  type="checkbox"
                  checked={layerVisibility.canals}
                  onChange={() => toggleLocalLayer("canals")}
                  className="accent-cyan-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:text-white py-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 bg-blue-500 rounded-sm" />
                  Drainage Conduits
                </span>
                <input
                  type="checkbox"
                  checked={layerVisibility.drainage}
                  onChange={() => toggleLocalLayer("drainage")}
                  className="accent-cyan-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:text-white py-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Incidents (Radar)
                </span>
                <input
                  type="checkbox"
                  checked={layerVisibility.incidents}
                  onChange={() => toggleLocalLayer("incidents")}
                  className="accent-cyan-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:text-white py-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/50 border border-amber-400" />
                  Risk Zones
                </span>
                <input
                  type="checkbox"
                  checked={layerVisibility.risk}
                  onChange={() => toggleLocalLayer("risk")}
                  className="accent-cyan-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:text-white py-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 text-[8px] flex items-center justify-center font-mono font-bold text-white">
                    PS
                  </span>
                  Pump Stations
                </span>
                <input
                  type="checkbox"
                  checked={layerVisibility.pumps}
                  onChange={() => toggleLocalLayer("pumps")}
                  className="accent-cyan-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:text-white py-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/40 border border-dashed border-rose-400" />
                  AI Spread Horizon
                </span>
                <input
                  type="checkbox"
                  checked={layerVisibility.spread}
                  onChange={() => toggleLocalLayer("spread")}
                  className="accent-cyan-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:text-white py-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Landmarks
                </span>
                <input
                  type="checkbox"
                  checked={layerVisibility.landmarks}
                  onChange={() => toggleLocalLayer("landmarks")}
                  className="accent-cyan-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl backdrop-blur-md border shadow-xl text-xs font-semibold transition-all cursor-pointer ${showLayerMenu
              ? "bg-cyan-500 text-slate-950 border-cyan-400"
              : "bg-slate-900/90 text-slate-200 border-white/15 hover:bg-slate-800"
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Overlays & Layers</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Bottom Left: Quiet GIS Map Legend */}
      {/* ------------------------------------------------------------- */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-white/15 rounded-xl p-3 text-[11px] text-slate-300 shadow-xl space-y-1.5 hidden sm:block">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Hydrological Legend
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#eab308]" />
              Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#f97316]" />
              High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
              Critical
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1 border-t border-white/10 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-cyan-400" />
              Canal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-blue-400 border-dashed" />
              Conduit
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs bg-sky-500" />
              Pump
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Incident
            </span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Docked AI VERIFIED INCIDENT Intelligence Panel */}
      {/* ------------------------------------------------------------- */}
      {selectedIncident && (
        <div className="absolute top-16 right-4 z-30 w-full max-w-sm sm:max-w-md bg-slate-900/98 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl p-5 shadow-2xl text-white space-y-4 pointer-events-auto animate-in fade-in slide-in-from-right-3">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-bold">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                <span>AI VERIFIED INCIDENT</span>
                <span className="text-slate-400">|</span>
                <span>{selectedIncident.id}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1 leading-snug">
                {selectedIncident.location}
              </h3>
              <div className="text-[11px] text-slate-400 font-mono">
                {selectedIncident.subdivision}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                store.setSelectedIncident(null);
                setSimulateState(null);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Diagnostic Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10">
              <span className="text-[10px] text-slate-400 block font-mono">
                ESTIMATED WATER DEPTH
              </span>
              <span className="text-base font-extrabold text-rose-400 font-mono">
                {selectedIncident.waterDepth}
              </span>
              <span className="text-[10px] text-rose-300/80 block mt-0.5">
                Critical Street Inundation
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10">
              <span className="text-[10px] text-slate-400 block font-mono">
                AI CONFIDENCE
              </span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">
                96.4%
              </span>
              <span className="text-[10px] text-emerald-300/80 block mt-0.5">
                {selectedIncident.verifiedReports} Citizen Reports Verified
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10">
              <span className="text-[10px] text-slate-400 block font-mono">
                DRAINAGE BOTTLENECK
              </span>
              <span className="font-bold text-slate-200 block text-[11px] leading-tight mt-0.5">
                {selectedIncident.connectedDrainage}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                Near {selectedIncident.nearestPump}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10">
              <span className="text-[10px] text-slate-400 block font-mono">
                PREDICTED SPREAD
              </span>
              <span className="font-bold text-amber-400 block text-[11px] leading-tight mt-0.5 font-mono">
                +35% in 30 Mins
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                If unmitigated
              </span>
            </div>
          </div>

          {/* Probable Bottleneck & Recommended Intervention */}
          <div className="space-y-1.5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs">
            <div className="text-[10px] font-bold font-mono uppercase text-cyan-400">
              Recommended Intervention:
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Boost <strong>{selectedIncident.nearestPump}</strong> station discharge to 100% capacity (85 cusecs) and deploy Rapid Desilting Mobile Unit to unblock surface grates.
            </p>
          </div>

          {/* "Simulate Intervention" Action */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-slate-300">
                INTERVENTION DIGITAL TWIN
              </span>
              {simulateState && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                  SIMULATION ACTIVE
                </span>
              )}
            </div>

            {!simulateState ? (
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(1300);
                  setSimulateState("AFTER");
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Intervention (Before vs After)</span>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Before vs After Switcher Tabs */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950/80 border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playUiChirp(850);
                      setSimulateState("BEFORE");
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all ${simulateState === "BEFORE"
                        ? "bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-xs"
                        : "text-slate-400 hover:text-white"
                      }`}
                  >
                    BEFORE (Baseline)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playUiChirp(1250);
                      setSimulateState("AFTER");
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all ${simulateState === "AFTER"
                        ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-xs"
                        : "text-slate-400 hover:text-white"
                      }`}
                  >
                    AFTER (Mitigated)
                  </button>
                </div>

                {/* Outcome Comparison Metric */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-white/10 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Water Depth:</span>
                    <span className="font-bold text-white">
                      {simulateState === "AFTER" ? (
                        <span className="text-emerald-400">6 cm (-78% reduction)</span>
                      ) : (
                        <span className="text-rose-400">28 cm (Critical)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Inundation Footprint:</span>
                    <span className="font-bold text-white">
                      {simulateState === "AFTER" ? (
                        <span className="text-emerald-400">3,200 m² (Contained)</span>
                      ) : (
                        <span className="text-rose-400">12,400 m² (Expanded)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Time to Drain:</span>
                    <span className="font-bold text-cyan-300">
                      {simulateState === "AFTER" ? "22 mins" : "Over 4 hours"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSimulateState(null)}
                  className="w-full py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Exit Simulation Mode
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default KolkataGisMap;
