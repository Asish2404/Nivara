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
import { useKWIStore, isUserAdmin, isUserSupervisor } from "../../store/useKWIStore";
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
  Check,
  ArrowRight,
  X,
  Play,
  SlidersHorizontal,
  Clock,
  Waves,
  RefreshCw,
  ChevronDown,
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
  const [activeSeverityFilter, setActiveSeverityFilter] = useState("ALL"); // "ALL" | "CRITICAL" | "HIGH" | "MODERATE" | "LOW"
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [showReported, setShowReported] = useState(true);
  const [showPredicted, setShowPredicted] = useState(true);

  const handleFilterSelect = useCallback((filterKey) => {
    audioEngine.playUiChirp(1150);
    setActiveSeverityFilter((prev) => (prev === filterKey && filterKey !== "ALL" ? "ALL" : filterKey));
  }, []);

  // Internal layer toggles
  const store = useKWIStore();
  const isSupervisor = isUserSupervisor ? isUserSupervisor(store.currentUser) : false;
  const isAdmin = !isSupervisor && isUserAdmin(store.currentUser);
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
  const simulatedIncidentIds = store.simulatedIncidentIds || [];
  const simulationOutcomes = store.simulationOutcomes || {};

  const isIncidentSimulated = useMemo(() => {
    if (!selectedIncident?.id) return false;
    const cleanId = String(selectedIncident.id).replace(/^#/, "");
    const cleanConn = String(selectedIncident.connectedIncidentId || "").replace(/^#/, "");
    return (
      simulatedIncidentIds.includes(selectedIncident.id) ||
      simulatedIncidentIds.includes(cleanId) ||
      (cleanConn && simulatedIncidentIds.includes(cleanConn)) ||
      store.dispatchedHotspotIds?.includes(selectedIncident.id) ||
      store.dispatchedHotspotIds?.includes(cleanId) ||
      (cleanConn && store.dispatchedHotspotIds?.includes(cleanConn))
    );
  }, [selectedIncident, simulatedIncidentIds, store.dispatchedHotspotIds]);

  const activeOutcome = useMemo(() => {
    if (!selectedIncident) return null;
    const cleanId = String(selectedIncident.id || "").replace(/^#/, "");
    return (
      simulationOutcomes[selectedIncident.id] ||
      simulationOutcomes[cleanId] ||
      store.latestSimulationOutcome?.simulationOutcome ||
      null
    );
  }, [selectedIncident, simulationOutcomes, store.latestSimulationOutcome]);

  // When selected incident has been simulated via Create Work Order, initialize simulation mode to AFTER
  useEffect(() => {
    if (isIncidentSimulated) {
      setSimulateState("AFTER");
    } else {
      setSimulateState(null);
    }
  }, [isIncidentSimulated, selectedIncident?.id]);

  // Waterlogging Prediction Run & Cooldown States
  const [cooldownRemaining, setCooldownRemaining] = useState(null);
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const [showCooldownBadge, setShowCooldownBadge] = useState(false);
  const [runSuccessNotice, setRunSuccessNotice] = useState(false);

  // Initial Prediction & Cooldown Load (Cooldown status checked for Admin only)
  useEffect(() => {
    if (!store.waterloggingPredictions || store.waterloggingPredictions.length === 0) {
      store.fetchPredictions();
    }
    if (isAdmin) {
      store.fetchPredictionRefreshStatus().then((status) => {
        if (status && status.cooldown_active && status.next_available_at) {
          const ms = new Date(status.next_available_at).getTime() - Date.now();
          if (ms > 0) {
            setCooldownRemaining(Math.floor(ms / 1000));
          }
        }
      });
    }
  }, [isAdmin]);

  // Cooldown countdown tick effect
  useEffect(() => {
    if (cooldownRemaining === null || cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          setShowCooldownBadge(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const formatCountdown = (totalSec) => {
    if (!totalSec || totalSec <= 0) return "00:00:00";
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleRunPrediction = async () => {
    if (!isAdmin) return;
    audioEngine.playUiChirp(1150);
    if (cooldownRemaining && cooldownRemaining > 0) {
      setShowCooldownBadge(true);
      return;
    }
    const res = await store.triggerPredictionRefresh();
    if (res.success) {
      setRunSuccessNotice(true);
      setShowCooldownBadge(false);
      setTimeout(() => setRunSuccessNotice(false), 4000);
    } else if (res.cooldownActive && res.nextAvailableAt) {
      const msUntil = new Date(res.nextAvailableAt).getTime() - Date.now();
      const sec = Math.max(0, Math.floor(msUntil / 1000));
      setCooldownRemaining(sec);
      setCooldownMessage(res.message || "Cooldown Active");
      setShowCooldownBadge(true);
    } else if (res.autoInProgress) {
      setCooldownMessage("Auto update in progress, please try later.");
      setShowCooldownBadge(true);
    } else {
      setCooldownMessage(res.message || "Refresh rejected");
      setShowCooldownBadge(true);
    }
  };

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

      // 3. RISK ZONES (Polygon - Derived strictly from submitted risk areas)
      const dynamicRiskData = getRiskZonesGeoJson(store.riskZones || store.incidents || []);
      if (!map.getSource("risk-source")) {
        map.addSource("risk-source", {
          type: "geojson",
          data: dynamicRiskData,
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

        map.on("click", "risk-fill", (e) => {
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            const zone = (store.riskZones || []).find((z) => z.id === props.id) || props;
            store.setSelectedRiskZone?.(zone);
          }
        });
      } else {
        map.getSource("risk-source").setData(dynamicRiskData);
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

      // 1. ACTIVE WATERLOGGING PREDICTIONS & INCIDENTS
      if (activeLayers.incidents) {
        // Filter live incidents: exclude Resolved reports, and exclude reports older than 2 days (48h)
        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
        const nowMs = Date.now();

        const rawLiveList = store.incidents && store.incidents.length > 0 ? store.incidents : [];
        const activeLiveIncidents = rawLiveList.filter((inc) => {
          // Vanish resolved reports from the map
          const status = String(inc.status || "").toLowerCase().trim();
          if (status === "resolved") return false;

          // Remove reports submitted more than 2 days (48h) ago
          const dateVal =
            inc.createdAt ||
            inc.created_at ||
            inc.submitted_at ||
            inc.firstSubmittedAt ||
            inc.updated_at ||
            inc.last_reported_at;
          if (dateVal) {
            const timeMs =
              typeof dateVal === "number"
                ? dateVal
                : new Date(dateVal).getTime();
            if (!isNaN(timeMs) && nowMs - timeMs > TWO_DAYS_MS) {
              return false;
            }
          }
          return true;
        });

        const rawPredList =
          store.waterloggingPredictions && store.waterloggingPredictions.length > 0
            ? store.waterloggingPredictions
            : [];

        let allIncidents = [];
        if (!isAdmin) {
          // Non-admin (Citizen or Supervisor) sees the standard combined view
          if (activeLiveIncidents.length > 0) {
            const liveLocs = new Set(activeLiveIncidents.map((i) => (i.location || "").toLowerCase().trim()));
            const extraPredictions = rawPredList.filter(
              (p) => !liveLocs.has((p.locality || "").toLowerCase().trim())
            );
            allIncidents = [...activeLiveIncidents, ...extraPredictions];
          } else {
            allIncidents = rawPredList;
          }
        } else {
          // Admin User Toggle Logic:
          if (showReported && !showPredicted) {
            // 1. Only locations reported by citizens
            allIncidents = [...activeLiveIncidents];
          } else if (!showReported && showPredicted) {
            // 2. Only locations with predicted waterlogging
            allIncidents = [...rawPredList];
          } else if (showReported && showPredicted) {
            // 3. Both reported and predicted locations (with deduplication)
            if (activeLiveIncidents.length > 0) {
              const liveLocs = new Set(activeLiveIncidents.map((i) => (i.location || "").toLowerCase().trim()));
              const extraPredictions = rawPredList.filter(
                (p) => !liveLocs.has((p.locality || "").toLowerCase().trim())
              );
              allIncidents = [...activeLiveIncidents, ...extraPredictions];
            } else {
              allIncidents = rawPredList;
            }
          } else {
            // 4. Both unselected:
            // Predicted locations are shown, PLUS ONLY live reported locations having risk level CRITICAL
            const criticalLiveIncidents = activeLiveIncidents.filter((inc) => {
              const sev = String(inc.severity || inc.risk_level || "").toUpperCase();
              return (
                sev === "CRITICAL" ||
                (inc.verifiedReports && inc.verifiedReports >= 5) ||
                (inc.report_count && inc.report_count >= 5) ||
                (inc.verifiedReports >= 3 && (inc.waterLevelCm || 0) >= 25)
              );
            });
            const critLocs = new Set(criticalLiveIncidents.map((i) => (i.location || "").toLowerCase().trim()));
            const extraPredictions = rawPredList.filter(
              (p) => !critLocs.has((p.locality || "").toLowerCase().trim())
            );
            allIncidents = [...criticalLiveIncidents, ...extraPredictions];
          }
        }

        const incidentsToRender = allIncidents.filter((inc) => {
          if (!activeSeverityFilter || activeSeverityFilter === "ALL") return true;

          const isPred = inc.severity_score !== undefined;
          const isCritical = isPred
            ? (inc.risk_level === "HIGH" || inc.severity_score >= 0.65)
            : (inc.severity === "CRITICAL" || inc.severity === "HIGH");

          const isMedium = isPred
            ? (inc.risk_level === "MEDIUM" || (inc.severity_score >= 0.35 && inc.severity_score < 0.65))
            : (inc.severity === "MEDIUM");

          const dotColor = isCritical ? "#ef4444" : (isMedium ? "#f59e0b" : "#10b981");

          if (activeSeverityFilter === "CRITICAL") {
            return dotColor === "#ef4444" || inc.severity === "CRITICAL" || inc.risk_level === "CRITICAL";
          }
          if (activeSeverityFilter === "HIGH") {
            return dotColor === "#f97316" || inc.severity === "HIGH" || (dotColor !== "#ef4444" && inc.risk_level === "HIGH");
          }
          if (activeSeverityFilter === "MODERATE") {
            return dotColor === "#eab308" || dotColor === "#f59e0b" || inc.severity === "MODERATE" || (!isCritical && isMedium);
          }
          if (activeSeverityFilter === "LOW") {
            return dotColor === "#22c55e" || dotColor === "#10b981" || inc.severity === "LOW" || (!isCritical && !isMedium);
          }
          return true;
        });

        incidentsToRender.forEach((inc) => {
          const isPred = inc.severity_score !== undefined;
          const coords =
            inc.longitude && inc.latitude
              ? [inc.longitude, inc.latitude]
              : kmToGeoCoord(inc.x || 0, inc.y || 0);

          const isCritical = isPred
            ? (inc.risk_level === "HIGH" || inc.severity_score >= 0.65)
            : (inc.severity === "CRITICAL" || inc.severity === "HIGH");

          const isMedium = isPred
            ? (inc.risk_level === "MEDIUM" || (inc.severity_score >= 0.35 && inc.severity_score < 0.65))
            : (inc.severity === "MEDIUM");

          const dotColor = isCritical ? "#ef4444" : (isMedium ? "#f59e0b" : "#10b981");
          const rippleColor = isCritical
            ? "rgba(239, 68, 68, 0.75)"
            : (isMedium ? "rgba(245, 158, 11, 0.7)" : "rgba(16, 185, 129, 0.6)");

          const tagText = isPred
            ? `Sev ${(inc.severity_score * 100).toFixed(0)}% · Prio ${(inc.priority_score * 100).toFixed(0)}%`
            : (inc.waterDepth || "Active Hotspot");

          const titleText = isPred
            ? `${inc.locality}: Severity ${(inc.severity_score * 100).toFixed(0)}%, Priority ${(inc.priority_score * 100).toFixed(0)}% [${inc.risk_level}]`
            : `${inc.name}: ${inc.waterDepth}`;

          const el = document.createElement("div");
          el.className = "cursor-pointer group relative flex items-center justify-center transition-transform duration-300 kwi-incident-marker";
          el.setAttribute("data-cursor", "incident");
          el.setAttribute("data-incident-id", inc.id || inc.locality);
          el.setAttribute("title", titleText);
          el.innerHTML = `
            <div class="kwi-incident-marker-body" style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
              <!-- Outer radar pulse ripple -->
              <span class="kwi-incident-ripple" style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${rippleColor}; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              
              <!-- Center solid badge -->
              <span class="kwi-incident-dot" style="position: relative; width: 15px; height: 15px; border-radius: 9999px; background-color: ${dotColor}; border: 2.5px solid #ffffff; box-shadow: 0 0 12px rgba(0,0,0,0.6); transition: all 0.3s ease;"></span>
            </div>
          `;

          el.addEventListener("click", (e) => {
            e.stopPropagation();
            audioEngine.playUiChirp(1200);

            const selectedData = isPred ? {
              id: inc.id,
              name: inc.locality,
              location: `${inc.locality}${inc.ward ? ` (Ward ${inc.ward})` : ""}`,
              subdivision: inc.ulb_name || inc.district || "KMC METROPOLITAN",
              severity: inc.risk_level,
              waterDepth: `Sev: ${(inc.severity_score * 100).toFixed(0)}%`,
              rainfall: `${inc.forecast_rain_24h_mm || 0} mm / 24h`,
              verifiedReports: `Priority Score: ${(inc.priority_score * 100).toFixed(0)}%`,
              probability: `${(inc.waterlogging_probability * 100).toFixed(0)}%`,
              status: inc.status || "ACTIVE",
              timestamp: "Waterlogging Prediction Intelligence",
              latitude: inc.latitude,
              longitude: inc.longitude,
            } : inc;

            store.setSelectedIncident(selectedData);
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
          incidentMarkerMapRef.current[inc.id || inc.locality] = { marker, el, inc };
        });
      }

      // 2. PUMPING STATIONS
      if (activeLayers.pumps) {
        PUMPING_STATIONS.forEach((ps) => {
          const coords = kmToGeoCoord(ps.x, ps.y);
          const isCap = ps.isAtCapacity;

          const isMobileScreen = typeof window !== "undefined" && window.innerWidth <= 640;
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
            }; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); font-family: monospace; white-space: nowrap; ${isMobileScreen ? 'display: none;' : ''}">
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
        const currentZoom = map.getZoom ? map.getZoom() : 12;
        const isMobileScreen = typeof window !== "undefined" && window.innerWidth <= 640;

        REAL_KOLKATA_LANDMARKS.forEach((lm) => {
          // On mobile or zoom < 13.0, keep major hubs to avoid label piling
          if (isMobileScreen && currentZoom < 13.0) {
            const majorHubs = ["howrah_bridge", "esplanade", "salt_lake", "behala", "victoria_memorial"];
            if (!majorHubs.includes(lm.id)) return;
          }

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
      // Only render at high zoom (>= 15.2) to prevent obstructing citywide overview
      if (activeLayers.drainage) {
        const currentZoom = map.getZoom ? map.getZoom() : 12;
        if (currentZoom >= 15.2) {
          WARD63_CALIBRATION_POINTS.forEach((cp) => {
            const el = document.createElement("div");
            el.className = "cursor-pointer group relative flex flex-col items-center select-none";
            el.setAttribute("data-cursor", "target");
            el.setAttribute("title", `${cp.id}: ${cp.name}`);
            el.innerHTML = `
              <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
                <span style="position: absolute; inset: 0; border-radius: 9999px; border: 1.5px dashed #06b6d4; animation: spin 8s linear infinite; background: rgba(6, 182, 212, 0.2);"></span>
                <span style="position: relative; width: 10px; height: 10px; border-radius: 9999px; background-color: #22d3ee; border: 2px solid #ffffff; box-shadow: 0 0 10px #06b6d4;"></span>
                <span style="position: absolute; width: 24px; height: 1px; background: rgba(34, 211, 238, 0.7); pointer-events: none;"></span>
                <span style="position: absolute; width: 1px; height: 24px; background: rgba(34, 211, 238, 0.7); pointer-events: none;"></span>
              </div>
              
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
      }
    },
    [
      activeLayers.incidents,
      activeLayers.pumps,
      activeLayers.landmarks,
      activeLayers.drainage,
      is3DMode,
      store.waterloggingPredictions,
      store.incidents,
      activeSeverityFilter,
      showReported,
      showPredicted,
      isAdmin,
    ]
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
  // Synchronize Risk Zones (Derived strictly from submitted risk areas)
  // -------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("risk-source");
    if (source) {
      source.setData(getRiskZonesGeoJson(store.riskZones || store.incidents || []));
    }
  }, [store.riskZones, store.incidents]);

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
      let coords = null;
      if (selectedIncident.longitude && selectedIncident.latitude && !isNaN(Number(selectedIncident.longitude)) && !isNaN(Number(selectedIncident.latitude))) {
        coords = [Number(selectedIncident.longitude), Number(selectedIncident.latitude)];
      } else if (selectedIncident.lng && selectedIncident.lat && !isNaN(Number(selectedIncident.lng)) && !isNaN(Number(selectedIncident.lat))) {
        coords = [Number(selectedIncident.lng), Number(selectedIncident.lat)];
      } else if (selectedIncident.x !== undefined && selectedIncident.y !== undefined && Math.abs(Number(selectedIncident.x)) < 50 && Math.abs(Number(selectedIncident.y)) < 50) {
        coords = kmToGeoCoord(selectedIncident.x, selectedIncident.y);
      } else {
        coords = KOLKATA_CENTER_GEO;
      }

      if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
        map.flyTo({
          center: coords,
          zoom: 14.5,
          pitch: is3DMode ? 42 : 0,
          duration: 1100,
        });
      }
      return;
    }

    if (selectedPumpStation) {
      const coords = kmToGeoCoord(selectedPumpStation.x, selectedPumpStation.y);
      if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
        map.flyTo({
          center: coords,
          zoom: 14.5,
          pitch: is3DMode ? 40 : 0,
          duration: 1100,
        });
      }
      return;
    }

    if (selectedRiskZone && selectedRiskZone.center) {
      const coords = kmToGeoCoord(selectedRiskZone.center[0], selectedRiskZone.center[1]);
      if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
        map.flyTo({
          center: coords,
          zoom: 13.8,
          pitch: is3DMode ? 35 : 0,
          duration: 1100,
        });
      }
      return;
    }

    if (selectedDistrict) {
      const landmark = REAL_KOLKATA_LANDMARKS.find((item) => item.id === selectedDistrict);
      if (landmark && landmark.coordinates && !isNaN(landmark.coordinates[0]) && !isNaN(landmark.coordinates[1])) {
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
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 text-white font-mono text-[10px] sm:text-[11px] shadow-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-300 font-bold tracking-tight">
            <span className="inline sm:hidden">KOLKATA GIS</span>
            <span className="hidden sm:inline">KOLKATA MUNICIPAL GRID</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline">WGS84 22.57°N, 88.36°E</span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-emerald-400 font-bold hidden md:inline">
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
      {/* Bottom Center: AI Spread Timeline Scrubber + Run Button */}
      {/* ------------------------------------------------------------- */}
      {!simulateState && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-1 sm:gap-2 max-w-[96vw]">
          {/* AI Spread Full Bar */}
          {activeLayers.spread && (
            <div className="flex items-center gap-0.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 text-white shadow-2xl">
              <div className="flex items-center gap-1 sm:gap-1.5 pr-1.5 sm:pr-2 border-r border-white/15 text-cyan-400 font-mono text-[10px] sm:text-[11px] font-bold uppercase">
                <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
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
                    className={`px-1.5 sm:px-2.5 py-1 rounded-lg font-mono text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${active
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)] border border-cyan-300/40"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                  >
                    {mins === 0 ? "NOW" : `+${mins}m`}
                  </button>
                );
              })}
            </div>
          )}

          {/* Manual Run Prediction Button & Dynamic Cooldown Tooltip (Admin Only) */}
          {isAdmin && (
            <div className="relative flex items-center">
              {/* Inline Dynamic Cooldown Tooltip Pill (Appears only when clicked or active in cooldown) */}
              {showCooldownBadge && (
                <div className="absolute -top-11 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-30 px-3 py-1.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-amber-500/60 text-amber-300 text-[11px] font-mono font-bold shadow-2xl flex items-center gap-2 whitespace-nowrap animate-in fade-in zoom-in-95">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                  <span>
                    {cooldownRemaining && cooldownRemaining > 0
                      ? `Cooldown: ${formatCountdown(cooldownRemaining)}`
                      : (cooldownMessage || "Cooldown Active")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCooldownBadge(false)}
                    className="text-slate-400 hover:text-white ml-1 cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Run Success Temporary Notification Pill */}
              {runSuccessNotice && (
                <div className="absolute -top-11 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-30 px-3 py-1.5 rounded-xl bg-emerald-950/95 backdrop-blur-xl border border-emerald-400/60 text-emerald-300 text-[11px] font-mono font-bold shadow-2xl flex items-center gap-1.5 whitespace-nowrap animate-in fade-in zoom-in-95">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Prediction Queued</span>
                </div>
              )}

              {/* Run Action Button */}
              <button
                type="button"
                id="kwi-run-prediction-btn"
                onClick={handleRunPrediction}
                disabled={store.isRefreshingPredictions}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer shadow-2xl backdrop-blur-xl border ${store.isRefreshingPredictions
                    ? "bg-slate-800 text-cyan-300 border-cyan-500/40 opacity-80 cursor-wait"
                    : cooldownRemaining && cooldownRemaining > 0
                      ? "bg-slate-900/95 hover:bg-slate-800/95 text-amber-400 border-amber-500/40 hover:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)] active:scale-95"
                      : "bg-gradient-to-r from-cyan-500 via-blue-600 to-teal-500 hover:from-cyan-400 hover:to-blue-500 text-white border-cyan-300/50 shadow-[0_0_16px_rgba(6,182,212,0.4)] active:scale-95"
                  }`}
                title={
                  cooldownRemaining && cooldownRemaining > 0
                    ? `Cooldown Active (${formatCountdown(cooldownRemaining)}) - Click for status`
                    : "Run Waterlogging Prediction Update"
                }
              >
                {store.isRefreshingPredictions ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current text-white" />
                    <span>Run</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Bottom Right: Operational Layers Selector Drawer Button */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-[60px] sm:bottom-[68px] xl:bottom-4 right-3 sm:right-4 z-20 pointer-events-auto flex flex-col items-end gap-2">
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

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isAdmin && (
            <>
              {/* Reported Button */}
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(showReported ? 780 : 1080);
                  setShowReported((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl backdrop-blur-md border shadow-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${showReported
                    ? "bg-rose-500/20 text-rose-300 border-rose-400/60 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                    : "bg-slate-900/90 text-slate-400 border-white/15 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                title="Toggle live citizen reported locations on the map"
              >
                <span
                  className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border transition-colors ${showReported
                      ? "bg-rose-500 border-rose-400 text-white"
                      : "border-slate-500 bg-slate-800/80"
                    }`}
                >
                  {showReported && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span>Reported</span>
              </button>

              {/* Predicted Button */}
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(showPredicted ? 780 : 1080);
                  setShowPredicted((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl backdrop-blur-md border shadow-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${showPredicted
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    : "bg-slate-900/90 text-slate-400 border-white/15 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                title="Toggle AI predicted waterlogging locations on the map"
              >
                <span
                  className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border transition-colors ${showPredicted
                      ? "bg-cyan-500 border-cyan-400 text-slate-950"
                      : "border-slate-500 bg-slate-800/80"
                    }`}
                >
                  {showPredicted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span>Predicted</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl backdrop-blur-md border shadow-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${showLayerMenu
              ? "bg-cyan-500 text-slate-950 border-cyan-400"
              : "bg-slate-900/90 text-slate-200 border-white/15 hover:bg-slate-800"
              }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Overlays & </span><span>Layers</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Bottom Left: Quiet GIS Map Legend & Color Filter (Separate tier from bottom timeline) */}
      {/* ------------------------------------------------------------- */}
      {showLegend && (
        <div className="absolute bottom-[60px] sm:bottom-[68px] xl:bottom-4 left-2 sm:left-4 z-20 pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-xl p-2 sm:p-3 text-[10.5px] sm:text-[11px] text-slate-300 shadow-xl space-y-1.5 sm:space-y-2 max-w-[calc(100vw-1rem)] sm:max-w-none">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
            <button
              type="button"
              onClick={() => handleFilterSelect("ALL")}
              title="Show all points (Reset filter)"
              className={`flex items-center gap-1.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${activeSeverityFilter === "ALL"
                  ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                  : "text-slate-400 hover:text-slate-200"
                }`}
            >
              <span className="hidden min-[380px]:inline">Hydrological Legend</span>
              <span className="min-[380px]:hidden">Legend</span>
              <span
                className={`text-[8.5px] sm:text-[9px] px-1.5 py-0.5 rounded font-sans font-semibold transition-all ${activeSeverityFilter === "ALL"
                    ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/40"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5"
                  }`}
              >
                ALL
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsLegendExpanded(!isLegendExpanded)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              title={isLegendExpanded ? "Collapse Legend" : "Expand Legend"}
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLegendExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>

          {isLegendExpanded && (
            <>
              <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => handleFilterSelect("LOW")}
                  title="Filter: Low severity points only (Green)"
                  className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[9.5px] sm:text-[10.5px] transition-all cursor-pointer ${activeSeverityFilter === "LOW"
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] font-semibold"
                      : "hover:bg-slate-800/80 text-slate-300 border border-transparent"
                    }`}
                >
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
                  <span>Low</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFilterSelect("MODERATE")}
                  title="Filter: Moderate severity points only (Yellow)"
                  className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[9.5px] sm:text-[10.5px] transition-all cursor-pointer ${activeSeverityFilter === "MODERATE"
                      ? "bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)] font-semibold"
                      : "hover:bg-slate-800/80 text-slate-300 border border-transparent"
                    }`}
                >
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#eab308] shadow-[0_0_6px_#eab308]" />
                  <span>Moderate</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFilterSelect("HIGH")}
                  title="Filter: High severity points only (Orange)"
                  className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[9.5px] sm:text-[10.5px] transition-all cursor-pointer ${activeSeverityFilter === "HIGH"
                      ? "bg-orange-500/25 text-orange-300 border border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)] font-semibold"
                      : "hover:bg-slate-800/80 text-slate-300 border border-transparent"
                    }`}
                >
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#f97316] shadow-[0_0_6px_#f97316]" />
                  <span>High</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFilterSelect("CRITICAL")}
                  title="Filter: Critical points only (Red)"
                  className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[9.5px] sm:text-[10.5px] transition-all cursor-pointer ${activeSeverityFilter === "CRITICAL"
                      ? "bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)] font-semibold"
                      : "hover:bg-slate-800/80 text-slate-300 border border-transparent"
                    }`}
                >
                  <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_6px_#ef4444]" />
                  <span>Critical</span>
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 pt-1 border-t border-white/10 text-[9.5px] sm:text-[10px] text-slate-400 flex-wrap sm:flex-nowrap">
                <span className="flex items-center gap-1">
                  <span className="w-2 sm:w-2.5 h-0.5 bg-cyan-400" />
                  Canal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 sm:w-2.5 h-0.5 bg-blue-400 border-dashed" />
                  Conduit
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-xs bg-sky-500" />
                  Pump
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-rose-500" />
                  Incident
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Docked AI VERIFIED INCIDENT Intelligence Panel */}
      {/* ------------------------------------------------------------- */}
      {selectedIncident && (
        <div className="absolute top-12 left-2 right-2 sm:left-auto sm:right-4 z-30 w-auto sm:w-full sm:max-w-md max-h-[82vh] overflow-y-auto bg-slate-900/98 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl text-white space-y-3.5 pointer-events-auto animate-in fade-in slide-in-from-right-3">
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
              {isIncidentSimulated && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                  SIMULATION ACTIVE
                </span>
              )}
            </div>

            {!isIncidentSimulated ? (
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(1300);
                  if (selectedIncident) {
                    store.setSelectedIncident?.(selectedIncident);
                    if (selectedIncident.id) {
                      store.setActiveSimulationIncidentId?.(selectedIncident.id);
                    }
                  }
                  store.navigate("/simulate");
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Intervention</span>
              </button>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-200">
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
                    className={`py-1.5 rounded-lg text-xs font-bold font-mono cursor-pointer transition-all ${simulateState === "AFTER" || !simulateState
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
                      {simulateState === "BEFORE" ? (
                        <span className="text-rose-400">
                          {activeOutcome?.baselineDepthCm || "28 cm (Critical)"}
                        </span>
                      ) : (
                        <span className="text-emerald-400">
                          {activeOutcome?.simulatedDepthCm || "6 cm (-78% reduction)"}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Inundation Footprint:</span>
                    <span className="font-bold text-white">
                      {simulateState === "BEFORE" ? (
                        <span className="text-rose-400">
                          {activeOutcome?.baselineAreaM2 || "12,400 m² (Expanded)"}
                        </span>
                      ) : (
                        <span className="text-emerald-400">
                          {activeOutcome?.simulatedAreaM2 || "3,200 m² (Contained)"}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-400">Time to Drain:</span>
                    <span className="font-bold text-cyan-300">
                      {simulateState === "BEFORE"
                        ? (!activeOutcome?.baselineDrainTime || String(activeOutcome.baselineDrainTime).includes("undefined"))
                          ? "Over 4 hours"
                          : activeOutcome.baselineDrainTime
                        : (!activeOutcome?.simulatedDrainTime || String(activeOutcome.simulatedDrainTime).includes("undefined"))
                          ? "22 mins"
                          : activeOutcome.simulatedDrainTime}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default KolkataGisMap;
