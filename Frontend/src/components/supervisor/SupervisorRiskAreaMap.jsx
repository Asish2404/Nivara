import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import {
  MapPin,
  Navigation,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Crosshair,
  Droplets,
  X,
} from "lucide-react";
import { useKWIStore, isUserSupervisor } from "../../store/useKWIStore";
import { audioEngine } from "../../utils/audioEngine";

// Canonical Kolkata Landmark Coordinates
const LANDMARK_LOCATIONS = {
  howrah: {
    id: "howrah",
    name: "Howrah",
    label: "Howrah",
    lng: 88.3300,
    lat: 22.5850,
    defaultRisk: "MEDIUM",
  },
  north_kolkata: {
    id: "north_kolkata",
    name: "North Kolkata",
    label: "North Kolkata",
    lng: 88.3700,
    lat: 22.6000,
    defaultRisk: "HIGH",
  },
  lake_town: {
    id: "lake_town",
    name: "Lake Town",
    label: "Lake Town",
    lng: 88.4050,
    lat: 22.6050,
    defaultRisk: "MEDIUM",
  },
  kolkata_center: {
    id: "kolkata_center",
    name: "Kolkata",
    label: "Kolkata",
    lng: 88.3512,
    lat: 22.5697,
    isMajorLabel: true,
  },
  central: {
    id: "central",
    name: "Central",
    label: "Central",
    lng: 88.3650,
    lat: 22.5680,
    defaultRisk: "CRITICAL",
  },
  salt_lake: {
    id: "salt_lake",
    name: "Milan Nagar, Bidhannagar",
    label: "Milan Nagar",
    sublabel: "Bidhannagar",
    lng: 88.4280,
    lat: 22.5730,
    defaultRisk: "CRITICAL",
  },
  tangra: {
    id: "tangra",
    name: "Tangra",
    label: "Tangra",
    lng: 88.3900,
    lat: 22.5500,
    defaultRisk: "MEDIUM",
  },
  park_street: {
    id: "park_street",
    name: "Park Street",
    label: "Park Street",
    lng: 88.3520,
    lat: 22.5530,
    defaultRisk: "CRITICAL",
  },
  new_alipore: {
    id: "new_alipore",
    name: "New Alipore",
    label: "New Alipore",
    lng: 88.3280,
    lat: 22.5100,
    defaultRisk: "MEDIUM",
  },
  behala: {
    id: "behala",
    name: "Behala",
    label: "Behala",
    sublabel: "Ward 128",
    lng: 88.3150,
    lat: 22.4900,
    defaultRisk: "LOW",
  },
  tollygunge: {
    id: "tollygunge",
    name: "Tollygunge",
    label: "Tollygunge",
    lng: 88.3470,
    lat: 22.4980,
    defaultRisk: "LOW",
  },
  jadavpur: {
    id: "jadavpur",
    name: "Jadavpur",
    label: "Jadavpur",
    lng: 88.3710,
    lat: 22.4990,
    defaultRisk: "LOW",
  },
};

// Color definitions matching the screenshot
const RISK_COLORS = {
  CRITICAL: {
    name: "Critical",
    dot: "#f43f5e",
    ring: "#f43f5e",
    halo: "rgba(244, 63, 94, 0.45)",
    bg: "bg-[#f43f5e]",
    border: "border-rose-400",
  },
  HIGH: {
    name: "High",
    dot: "#f97316",
    ring: "#f97316",
    halo: "rgba(249, 115, 22, 0.45)",
    bg: "bg-[#f97316]",
    border: "border-orange-400",
  },
  MEDIUM: {
    name: "Medium",
    dot: "#eab308",
    ring: "#eab308",
    halo: "rgba(234, 179, 8, 0.45)",
    bg: "bg-[#eab308]",
    border: "border-amber-400",
  },
  LOW: {
    name: "Low",
    dot: "#10b981",
    ring: "#10b981",
    halo: "rgba(16, 185, 129, 0.45)",
    bg: "bg-[#10b981]",
    border: "border-emerald-400",
  },
};

// Professional GIS Basemap Styles for Kolkata
const MAP_STYLES = {
  satellite: {
    id: "satellite",
    name: "Satellite",
    spec: {
      version: 8,
      sources: {
        "esri-satellite": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "© Esri, Maxar",
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
      ],
    },
  },
};

// Generate GeoJSON polygon circle around a coordinate in meters
function createGeoJsonCircle(center, radiusInMeters, points = 64) {
  const [lng, lat] = center;
  const coords = [];
  const distanceX = radiusInMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusInMeters / 110540;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([lng + x, lat + y]);
  }
  coords.push(coords[0]);
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

// Distance between two lat/lng coordinates in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper to map reported work order location string to landmark coordinates
const findLandmarkForWorkOrder = (wo) => {
  if (!wo) return LANDMARK_LOCATIONS.salt_lake;
  const raw = `${wo.location || ""} ${wo.borough || ""} ${wo.ward || ""} ${wo.assigned_ulb_name || ""}`.toLowerCase();

  if (
    raw.includes("salt lake") ||
    raw.includes("bidhannagar") ||
    raw.includes("milan nagar") ||
    raw.includes("sector v") ||
    raw.includes("saltlake")
  ) {
    return LANDMARK_LOCATIONS.salt_lake;
  }
  if (
    raw.includes("behala") ||
    raw.includes("chowrasta") ||
    raw.includes("ward 128") ||
    raw.includes("borough xiv")
  ) {
    return LANDMARK_LOCATIONS.behala;
  }
  if (raw.includes("park street") || raw.includes("camac") || raw.includes("mullick")) {
    return LANDMARK_LOCATIONS.park_street;
  }
  if (raw.includes("new alipore") || raw.includes("alipore") || raw.includes("chetla")) {
    return LANDMARK_LOCATIONS.new_alipore;
  }
  if (raw.includes("howrah") || raw.includes("shibpur") || raw.includes("salkia")) {
    return LANDMARK_LOCATIONS.howrah;
  }
  if (raw.includes("tangra") || raw.includes("topsia") || raw.includes("dhapa")) {
    return LANDMARK_LOCATIONS.tangra;
  }
  if (
    raw.includes("lake town") ||
    raw.includes("laketown") ||
    raw.includes("dum dum") ||
    raw.includes("bangur") ||
    raw.includes("vip road")
  ) {
    return LANDMARK_LOCATIONS.lake_town;
  }
  if (
    raw.includes("north") ||
    raw.includes("shyambazar") ||
    raw.includes("hatibagan") ||
    raw.includes("sovabazar")
  ) {
    return LANDMARK_LOCATIONS.north_kolkata;
  }
  if (
    raw.includes("tollygunge") ||
    raw.includes("kudghat") ||
    raw.includes("ranikuthi") ||
    raw.includes("golf green")
  ) {
    return LANDMARK_LOCATIONS.tollygunge;
  }
  if (raw.includes("jadavpur") || raw.includes("santoshpur") || raw.includes("garia")) {
    return LANDMARK_LOCATIONS.jadavpur;
  }
  if (
    raw.includes("central") ||
    raw.includes("esplanade") ||
    raw.includes("chandni") ||
    raw.includes("sealdah") ||
    raw.includes("college street")
  ) {
    return LANDMARK_LOCATIONS.central;
  }

  for (const loc of Object.values(LANDMARK_LOCATIONS)) {
    if (
      raw.includes(loc.name.toLowerCase()) ||
      (loc.sublabel && raw.includes(loc.sublabel.toLowerCase()))
    ) {
      return loc;
    }
  }

  return LANDMARK_LOCATIONS.salt_lake;
};

export function SupervisorRiskAreaMap() {
  const {
    currentUser,
    workOrders,
    allReports,
    fetchWorkOrders,
    fetchAllReports,
    navigate,
    setActiveWorkOrderTicketId,
  } = useKWIStore();

  useEffect(() => {
    fetchWorkOrders?.().catch(() => {});
    fetchAllReports?.().catch(() => {});
  }, [fetchWorkOrders, fetchAllReports]);

  // Active Map Mode State
  const [activeStyleKey, setActiveStyleKey] = useState("satellite"); // Default: Satellite
  const [selectedIncident, setSelectedIncident] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Find the active work order stored in the work_orders table assigned ONLY to this occupied supervisor
  const activeWorkOrder = useMemo(() => {
    if (!isUserSupervisor(currentUser)) return null;

    const all = Object.values(workOrders || {});
    if (all.length === 0) return null;

    const activeOrders = all.filter((wo) => {
      const st = String(wo.status || "").toLowerCase().trim();
      return st !== "resolved" && st !== "closed" && st !== "completed";
    });

    if (activeOrders.length === 0) return null;

    const supName = (
      currentUser?.name ||
      currentUser?.fullName ||
      currentUser?.username ||
      ""
    )
      .trim()
      .toLowerCase();
    const supEmail = (currentUser?.email || "").trim().toLowerCase();

    const myOrder = activeOrders.find((wo) => {
      const woTeamHead = (wo.team_head_name || "").trim().toLowerCase();
      const woCrew = (wo.assignedCrew || "").trim().toLowerCase();
      const woChief = (wo.chief || "").trim().toLowerCase();

      if (supName) {
        if (
          woTeamHead &&
          (woTeamHead.includes(supName) || supName.includes(woTeamHead))
        )
          return true;
        if (
          woChief &&
          (woChief.includes(supName) || supName.includes(woChief))
        )
          return true;
        if (woCrew && woCrew.includes(supName)) return true;
      }

      if (
        !woTeamHead &&
        (supEmail === "supervisor@kolkata-water.gov.in" ||
          supName === "supervisor")
      ) {
        return true;
      }

      return false;
    });

    return myOrder || null;
  }, [workOrders, currentUser]);

  const hasActiveIncident = Boolean(activeWorkOrder);

  // Determine assigned landmark location from the reported work order
  const assignedArea = useMemo(() => {
    if (!activeWorkOrder) return LANDMARK_LOCATIONS.salt_lake;
    return findLandmarkForWorkOrder(activeWorkOrder);
  }, [activeWorkOrder]);

  // Center geographic coordinates for the sector
  const centerCoords = useMemo(() => {
    if (
      activeWorkOrder?.latitude &&
      activeWorkOrder?.longitude &&
      !isNaN(Number(activeWorkOrder.latitude)) &&
      !isNaN(Number(activeWorkOrder.longitude)) &&
      Number(activeWorkOrder.latitude) !== 0
    ) {
      return [Number(activeWorkOrder.longitude), Number(activeWorkOrder.latitude)];
    }
    if (
      activeWorkOrder?.lat &&
      activeWorkOrder?.lng &&
      !isNaN(Number(activeWorkOrder.lat)) &&
      !isNaN(Number(activeWorkOrder.lng)) &&
      Number(activeWorkOrder.lat) !== 0
    ) {
      return [Number(activeWorkOrder.lng), Number(activeWorkOrder.lat)];
    }
    return [assignedArea.lng || 88.4280, assignedArea.lat || 22.5730];
  }, [activeWorkOrder, assignedArea]);

  // Clear selected incident if it gets resolved
  useEffect(() => {
    if (selectedIncident && !hasActiveIncident) {
      setSelectedIncident(null);
    }
  }, [hasActiveIncident, selectedIncident]);

  // Risk level for the assigned area dot:
  const assignedRiskLevel = useMemo(() => {
    if (activeWorkOrder) {
      const p = String(
        activeWorkOrder.priority || activeWorkOrder.risk_level || ""
      ).toUpperCase();
      if (p.includes("CRIT")) return "CRITICAL";
      if (p.includes("HIGH")) return "HIGH";
      if (p.includes("MED") || p.includes("MOD")) return "MEDIUM";
      if (p.includes("LOW")) return "LOW";
    }
    return assignedArea.defaultRisk || "CRITICAL";
  }, [activeWorkOrder, assignedArea]);

  const CIRCLE_RADIUS_METERS = 500; // 500m radius

  // Incident object for the assigned central place dot (null if no active incident)
  const assignedCenterIncident = useMemo(() => {
    if (!hasActiveIncident || !activeWorkOrder) return null;

    const dbLocation = activeWorkOrder.location || `${assignedArea.name}, Kolkata`;
    const dbWard =
      activeWorkOrder.ward ||
      activeWorkOrder.borough ||
      (assignedArea.sublabel
        ? `Ward / ${assignedArea.sublabel}`
        : "Operational Zone");
    const dbStatus = activeWorkOrder.status || "Dispatched";

    let dbWaterDepth = "0 cm depth";
    if (
      activeWorkOrder.water_depth !== undefined &&
      activeWorkOrder.water_depth !== null
    ) {
      dbWaterDepth = `${activeWorkOrder.water_depth} cm depth`;
    } else if (activeWorkOrder.waterDepth) {
      dbWaterDepth = activeWorkOrder.waterDepth;
    }

    const dbDetails =
      activeWorkOrder.intervention_type ||
      activeWorkOrder.reason ||
      activeWorkOrder.trigger ||
      `Active work order dispatched for ${dbLocation}.`;

    return {
      id: activeWorkOrder.id || activeWorkOrder.work_id || "WO-ACTIVE",
      incidentRef:
        activeWorkOrder.incidentRef ||
        `#${activeWorkOrder.incident_id || activeWorkOrder.id || ""}`,
      name: dbLocation,
      ward: dbWard,
      location: dbLocation,
      lng: centerCoords[0],
      lat: centerCoords[1],
      riskLevel: assignedRiskLevel,
      status: dbStatus,
      waterDepth: dbWaterDepth,
      details: dbDetails,
      isAssignedCenter: true,
      ticketKey:
        activeWorkOrder.ticketKey ||
        activeWorkOrder.id ||
        activeWorkOrder.work_id,
    };
  }, [
    assignedArea,
    activeWorkOrder,
    hasActiveIncident,
    assignedRiskLevel,
    centerCoords,
  ]);

  // Filter reports inside the 1900m circle:
  const visibleReports = useMemo(() => {
    if (!hasActiveIncident) return [];

    const centerLng = centerCoords[0];
    const centerLat = centerCoords[1];

    if (!Array.isArray(allReports)) return [];

    const norm = (str) =>
      (str || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const assignedLocNorm = norm(activeWorkOrder?.location || assignedArea.name);
    const assignedAreaName = assignedArea.name.toLowerCase();
    const assignedSublabel = (assignedArea.sublabel || "").toLowerCase();
    const assignedTicketRef = (activeWorkOrder?.incidentRef || "")
      .replace(/^#/, "")
      .toLowerCase();
    const assignedWorkId = (
      activeWorkOrder?.work_id ||
      activeWorkOrder?.id ||
      ""
    ).toLowerCase();

    return allReports
      .filter((r) => {
        const rStatus = String(r.status || "").toLowerCase();
        if (
          rStatus === "resolved" ||
          rStatus === "closed" ||
          rStatus === "completed"
        ) {
          return false;
        }

        const rLocNorm = norm(r.location);

        // Skip if same location as assigned center
        if (
          rLocNorm &&
          assignedLocNorm &&
          (rLocNorm === assignedLocNorm ||
            rLocNorm.includes(assignedLocNorm) ||
            assignedLocNorm.includes(rLocNorm))
        ) {
          return false;
        }

        const rRef = (r.report_id || "").toLowerCase();
        if (
          assignedTicketRef &&
          (rRef === assignedTicketRef || rRef.includes(assignedTicketRef))
        ) {
          return false;
        }
        if (
          assignedWorkId &&
          (assignedWorkId.includes(rRef) || rRef.includes(assignedWorkId))
        ) {
          return false;
        }

        const loc = (r.location || r.ward || "").toLowerCase();
        return (
          loc.includes(assignedAreaName) ||
          (assignedSublabel && loc.includes(assignedSublabel)) ||
          r.latitude
        );
      })
      .map((r, idx) => {
        let rLng, rLat;
        const rawLat = Number(r.latitude || r.lat);
        const rawLng = Number(r.longitude || r.lng);

        if (!isNaN(rawLat) && !isNaN(rawLng) && rawLat !== 0 && rawLng !== 0) {
          if (getDistanceMeters(centerLat, centerLng, rawLat, rawLng) > CIRCLE_RADIUS_METERS) {
            return null;
          }
          rLat = rawLat;
          rLng = rawLng;
        } else {
          // Disperse realistically within the 1.9km radius circle
          const angle = (idx + 1) * 1.85;
          const radiusRatio = 0.25 + ((idx * 0.17) % 0.65);
          const radiusMeters = CIRCLE_RADIUS_METERS * radiusRatio;
          const dx = radiusMeters / (111320 * Math.cos((centerLat * Math.PI) / 180));
          const dy = radiusMeters / 110540;
          rLng = centerLng + dx * Math.cos(angle);
          rLat = centerLat + dy * Math.sin(angle);
        }

        const depth = Number(r.water_depth || 0);
        const riskLevel =
          depth > 30
            ? "CRITICAL"
            : depth > 20
              ? "HIGH"
              : depth > 10
                ? "MEDIUM"
                : "LOW";

        return {
          id: `db-rep-${r.id || r.report_id}`,
          incidentRef: r.report_id ? `#${r.report_id}` : `#REP-${r.id}`,
          name: r.location || `${assignedArea.name} Citizen Report`,
          ward: r.ward ? `Ward ${r.ward}` : assignedArea.sublabel || "Field Sector",
          location: r.location || `${assignedArea.name}, Kolkata`,
          lng: rLng,
          lat: rLat,
          riskLevel,
          status: r.status || "Under Review",
          waterDepth: r.water_depth ? `${r.water_depth} cm depth` : "15 cm depth",
          rainfall: "50 mm / 3 hr",
          details:
            r.description ||
            "Live citizen ground report registered in municipal database.",
          ticketKey: `WO-${r.report_id || r.id}`,
        };
      })
      .filter(Boolean);
  }, [
    assignedArea,
    allReports,
    activeWorkOrder,
    hasActiveIncident,
    centerCoords,
    CIRCLE_RADIUS_METERS,
  ]);

  // Handler for dot clicks
  const handleSelectIncident = useCallback((incident) => {
    audioEngine?.playUiChirp(1200);
    setSelectedIncident((prev) => (prev?.id === incident?.id ? null : incident));
  }, []);

  // -------------------------------------------------------------
  // MapLibre Synchronization: Circle Layer & Markers
  // -------------------------------------------------------------
  const syncMapElements = useCallback(
    (map) => {
      if (!map || !map.isStyleLoaded()) return;

      // 1. Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (!hasActiveIncident) return;

      // 2. Add / Update 1.9km GeoJSON Circle
      const circleData = createGeoJsonCircle(centerCoords, CIRCLE_RADIUS_METERS);

      if (!map.getSource("assigned-circle-source")) {
        map.addSource("assigned-circle-source", {
          type: "geojson",
          data: circleData,
        });

        // Circle soft blue translucent fill
        map.addLayer({
          id: "assigned-circle-fill",
          type: "fill",
          source: "assigned-circle-source",
          paint: {
            "fill-color": "#007dfc",
            "fill-opacity": 0.22,
          },
        });

        // Circle perimeter dashed border
        map.addLayer({
          id: "assigned-circle-line",
          type: "line",
          source: "assigned-circle-source",
          paint: {
            "line-color": "#38bdf8",
            "line-width": 2.5,
            "line-dasharray": [3.5, 3],
            "line-opacity": 0.95,
          },
        });
      } else {
        map.getSource("assigned-circle-source").setData(circleData);
      }

      // 3. Add "500m Radius" Floating Badge at Northern Circle Peak
      const topBadgeCoord = [
        centerCoords[0],
        centerCoords[1] + CIRCLE_RADIUS_METERS / 110540,
      ];
      const badgeEl = document.createElement("div");
      badgeEl.className = "select-none pointer-events-none";
      badgeEl.innerHTML = `
        <div style="background-color: #007dfc; color: #ffffff; font-size: 11px; font-weight: 800; padding: 3px 12px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.5); border: 1.5px solid rgba(255,255,255,0.4); font-family: ui-sans-serif, system-ui, sans-serif; white-space: nowrap;">
          500m Radius
        </div>
      `;
      const badgeMarker = new maplibregl.Marker({
        element: badgeEl,
        anchor: "center",
      })
        .setLngLat(topBadgeCoord)
        .addTo(map);
      markersRef.current.push(badgeMarker);

      // 4. Central Assigned Location Teardrop Pin
      if (assignedCenterIncident) {
        const centerEl = document.createElement("div");
        centerEl.className =
          "cursor-pointer group flex flex-col items-center select-none";
        centerEl.style.transformOrigin = "bottom center";
        centerEl.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <span style="position: absolute; width: 38px; height: 38px; border-radius: 9999px; background-color: rgba(0, 125, 252, 0.45); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></span>
            <svg width="36" height="44" viewBox="0 0 34 42" fill="none" style="filter: drop-shadow(0 4px 12px rgba(0,125,252,0.7));">
              <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="#007dfc" />
              <circle cx="17" cy="17" r="7" fill="#ffffff" />
            </svg>
          </div>
          <div style="margin-top: 4px; text-align: center; font-weight: 800; font-size: 12px; color: #ffffff; text-shadow: 0 2px 6px rgba(0,0,0,0.95), 0 0 3px #000000; line-height: 1.15; font-family: ui-sans-serif, system-ui, sans-serif; white-space: nowrap;">
            <div>${assignedCenterIncident.name}</div>
            <div style="font-size: 10px; font-weight: 600; color: #cbd5e1;">${assignedCenterIncident.ward}</div>
          </div>
        `;

        centerEl.addEventListener("click", (e) => {
          e.stopPropagation();
          handleSelectIncident(assignedCenterIncident);
        });

        const centerMarker = new maplibregl.Marker({
          element: centerEl,
          anchor: "bottom",
        })
          .setLngLat(centerCoords)
          .addTo(map);
        markersRef.current.push(centerMarker);
      }

      // 5. Incident Pins (inside the circle)
      visibleReports.forEach((rep) => {
        const colors = RISK_COLORS[rep.riskLevel] || RISK_COLORS.LOW;
        const isSelected = selectedIncident?.id === rep.id;
        const repCoords = [rep.lng, rep.lat];

        const el = document.createElement("div");
        el.className =
          "cursor-pointer group flex flex-col items-center transition-transform hover:scale-125 select-none";
        el.style.transformOrigin = "bottom center";
        el.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <span style="position: absolute; width: 30px; height: 30px; border-radius: 9999px; background-color: ${colors.halo}; animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></span>
            <svg width="30" height="38" viewBox="0 0 34 42" fill="none" style="filter: drop-shadow(0 3px 8px ${colors.halo});">
              <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="${colors.dot}" />
              <circle cx="17" cy="17" r="6" fill="#ffffff" />
            </svg>
            ${
              isSelected
                ? `
              <span style="position: absolute; inset: -4px; border-radius: 9999px; border: 2.5px dashed #007dfc; animation: spin 8s linear infinite;"></span>
            `
                : ""
            }
          </div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          handleSelectIncident(rep);
        });

        const marker = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat(repCoords)
          .addTo(map);
        markersRef.current.push(marker);
      });
    },
    [
      centerCoords,
      hasActiveIncident,
      assignedCenterIncident,
      visibleReports,
      selectedIncident,
      handleSelectIncident,
      CIRCLE_RADIUS_METERS,
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
      center: centerCoords,
      zoom: 14.8,
      minZoom: 10,
      maxZoom: 18.5,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    map.on("load", () => {
      syncMapElements(map);
    });

    mapInstanceRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount



  // Synchronize Map Elements when dependencies update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;
    syncMapElements(map);
  }, [syncMapElements]);

  // Recenter map when assigned center changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo({
      center: centerCoords,
      zoom: 14.8,
      duration: 1200,
    });
  }, [centerCoords]);

  // Controls Handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetView = () => {
    audioEngine?.playUiChirp(950);
    mapInstanceRef.current?.flyTo({
      center: centerCoords,
      zoom: 14.8,
      pitch: 0,
      bearing: 0,
      duration: 1000,
    });
    setSelectedIncident(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Outer Card Container */}
      <div className="w-full bg-white dark:bg-[#071324] rounded-3xl border border-slate-200/90 dark:border-[#142d54] shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8 transition-colors">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#102444]">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/50 flex items-center justify-center shrink-0 shadow-2xs">
              <MapPin className="w-5 h-5 text-[#007dfc]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
                Risk Area Map
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Visualize risk zones and incident density across Kolkata
              </p>
            </div>
          </div>
        </div>

        {/* Main Map Container */}
        <div
          onClick={() => setSelectedIncident(null)}
          className="relative w-full aspect-16/10 min-h-[500px] max-h-[700px] bg-[#0c1628] rounded-2xl border border-slate-200/80 dark:border-[#102444] overflow-hidden select-none mt-4 shadow-lg"
        >
          {/* MapLibre WebGL Canvas Mount */}
          <div
            ref={mapContainerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* ========================================================================= */}
          {/* FLOATING TOP SECTOR & STYLE HEADER BAR (Matching Screenshot)              */}
          {/* ========================================================================= */}
          <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-4 z-20 flex items-center justify-between gap-2 pointer-events-none flex-wrap">
            {/* Left: Sector & Perimeter Indicator */}
            {hasActiveIncident ? (
              <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2 rounded-full bg-[#0a1628]/85 backdrop-blur-md border border-white/10 text-white text-xs sm:text-[13px] shadow-xl">
                <MapPin className="w-4 h-4 text-[#007dfc] shrink-0" />
                <span className="font-semibold text-slate-200">
                  Assigned Field Sector:{" "}
                  <strong className="text-sky-400 font-bold underline cursor-pointer">
                    {activeWorkOrder?.location || assignedArea.name} (
                    {activeWorkOrder?.ward || assignedArea.sublabel || "Field Sector"}
                    )
                  </strong>
                </span>
                <span className="text-white/30 hidden sm:inline">|</span>
                <span className="font-semibold text-slate-300 hidden sm:inline">
                  Sector Perimeter:{" "}
                  <strong className="text-sky-400 font-bold">500m Radius</strong>
                </span>
              </div>
            ) : (
              <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0a1628]/85 backdrop-blur-md border border-white/10 text-white text-xs shadow-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">
                  No active work order assigned to supervisor • Standby
                </span>
              </div>
            )}

            {/* Right: Recenter Target Button */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetView();
                }}
                title="Recenter Assigned Sector"
                className="w-8 h-8 rounded-full bg-[#0a1628]/85 backdrop-blur-md border border-white/10 text-slate-200 hover:text-white hover:bg-[#007dfc] flex items-center justify-center transition-colors shadow-xl cursor-pointer"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FLOATING BOTTOM-LEFT RISK LEVEL LEGEND (Matching Screenshot)              */}
          {/* ========================================================================= */}
          <div className="absolute bottom-4 left-4 z-20 bg-[#0a1628]/90 backdrop-blur-md rounded-2xl border border-white/10 p-3 shadow-xl pointer-events-auto select-none">
            <div className="space-y-1.5">
              {Object.entries(RISK_COLORS).map(([key, item]) => (
                <div key={key} className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.dot }}
                  />
                  <span className="text-xs font-medium text-slate-200">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FLOATING BOTTOM-RIGHT CONTROLS + SCALE BAR (Matching Screenshot)          */}
          {/* ========================================================================= */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-auto select-none">
            {/* Compass / Orientation Reset */}
            <button
              type="button"
              onClick={handleResetView}
              title="Reset Orientation"
              className="w-8 h-8 rounded-full bg-[#0a1628]/90 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4 fill-white text-white -rotate-45" />
            </button>

            {/* Zoom In & Zoom Out Controls */}
            <div className="flex flex-col rounded-full bg-[#0a1628]/90 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                title="Zoom In"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition-colors border-b border-white/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                title="Zoom Out"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Map Scale Bar (Matching Screenshot) */}
            <div className="flex items-center gap-2 text-[9.5px] font-mono text-slate-300 bg-[#0a1628]/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/10">
              <span>0</span>
              <div className="w-10 h-0.5 bg-slate-300 relative">
                <span className="absolute left-0 -top-1 w-0.5 h-2 bg-slate-300" />
                <span className="absolute right-0 -top-1 w-0.5 h-2 bg-slate-300" />
              </div>
              <span>500 m</span>
              <div className="w-10 h-0.5 bg-slate-300 relative">
                <span className="absolute right-0 -top-1 w-0.5 h-2 bg-slate-300" />
              </div>
              <span>1 km</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FLOATING INCIDENT DETAILS POPUP (Appears on Marker Click)                 */}
          {/* ========================================================================= */}
          {selectedIncident && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute z-40 top-18 left-1/2 -translate-x-1/2 w-80 sm:w-92 max-w-[92vw] bg-[#0a1628]/95 backdrop-blur-xl rounded-2xl border border-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.7)] p-4 text-white animate-in fade-in zoom-in-95 pointer-events-auto"
            >
              {/* Header: Risk Level Badge + Incident ID + Close Button */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold text-white uppercase shadow-2xs ${
                      RISK_COLORS[selectedIncident.riskLevel]?.bg || "bg-rose-600"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{selectedIncident.riskLevel} Risk</span>
                  </span>
                  <span className="text-[11.5px] font-bold text-slate-300 font-mono">
                    {selectedIncident.incidentRef || selectedIncident.id}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    audioEngine?.playUiChirp(850);
                    setSelectedIncident(null);
                  }}
                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & Ward */}
              <div className="mt-2.5">
                <h4 className="text-sm font-bold text-white leading-tight">
                  {selectedIncident.name}
                </h4>
                <p className="text-[11.5px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#007dfc] shrink-0" />
                  <span>{selectedIncident.ward || selectedIncident.location}</span>
                </p>
              </div>

              {/* Metrics: Water Depth & Status */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <div className="flex items-center gap-1 text-cyan-400">
                    <Droplets className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      Water Level
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-white block mt-0.5">
                    {selectedIncident.waterDepth}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                  <div className="flex items-center gap-1 text-cyan-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      Status
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-white block mt-0.5 truncate">
                    {selectedIncident.status || "Dispatched"}
                  </span>
                </div>
              </div>

              {/* Narrative Telemetry Note */}
              {selectedIncident.details && (
                <p className="text-[11px] text-slate-300 mt-2.5 pt-2 border-t border-white/10 leading-relaxed">
                  {selectedIncident.details}
                </p>
              )}

              {/* Action Button: Open Work Order in Respond Center */}
              <button
                type="button"
                onClick={() => {
                  audioEngine?.playUiChirp(1300);
                  if (setActiveWorkOrderTicketId && selectedIncident.ticketKey) {
                    setActiveWorkOrderTicketId(selectedIncident.ticketKey);
                  }
                  navigate("/action-center");
                }}
                className="w-full mt-3 py-2.5 px-3 rounded-xl bg-[#007dfc] hover:bg-[#006ee0] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(0,125,252,0.4)] transition-all active:scale-[0.99]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Work Order In Respond</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupervisorRiskAreaMap;
