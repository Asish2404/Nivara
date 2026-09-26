import { create } from "zustand";
import { api } from "../utils/api.js";
import { formatTime12Hour } from "../utils/dateTimeUtils.js";
import {
  aggregateIncidentsFromReports,
  mapIncidentQueueToCards,
  deriveRiskZonesFromIncidents,
} from "../utils/incidentAggregator.js";



// Helper to check public routes
export const isPublicRoute = (path) => {
  if (!path) return true;
  const clean = path.split("?")[0].split("#")[0];
  return (
    clean === "/" ||
    clean === "/signup" ||
    clean === "/login" ||
    clean === "/signin" ||
    clean === "/auth"
  );
};

// Helper to check if a user is a supervisor
export const isUserSupervisor = (user) => {
  if (!user) return false;
  if (user.portal === "supervisor") return true;
  if (user.id && String(user.id).startsWith("SUP-")) return true;
  if (user.badgeId && String(user.badgeId).startsWith("SUP-")) return true;
  if (user.badge_id && String(user.badge_id).startsWith("SUP-")) return true;
  const role = (user.role || "").toLowerCase();
  return role.includes("supervisor") || role.includes("team_head");
};

// Helper to check if a user belongs to admin operational portal
export const isUserAdmin = (user) => {
  if (!user) return false;
  // Supervisors have their own dedicated supervisor portal/role (not admin)
  if (isUserSupervisor(user)) return false;

  // Explicit citizen ID prefix or portal
  if (user.id && String(user.id).startsWith("USR-") && !String(user.id).includes("SUP")) return false;
  if (user.portal === "user") return false;

  if (user.portal === "admin") return true;
  if (user.badgeId || user.badge_id) return true;
  if (user.id && String(user.id).startsWith("ADM-")) return true;

  const role = (user.role || "").toLowerCase();
  if (
    role.includes("admin") ||
    role.includes("officer") ||
    role.includes("commander") ||
    role.includes("director") ||
    role.includes("commissioner")
  ) {
    return true;
  }
  return false;
};

// Role-based route permission checker:
// - Supervisor: Home ('/'), Profile ('/profile'), Respond ('/action-center', '/respond'), Auth
// - User: Home ('/'), Reports ('/reports', '/my-reports'), Profile ('/profile'), Auth ('/login', '/signup')
// - Admin: Home ('/'), Live Map ('/live-city'), Simulate ('/simulate'), Respond ('/action-center'), Profile ('/profile'), Auth
// - Unauthenticated: Home ('/'), Auth ('/signup', '/login')
export const isRouteAllowedForUser = (path, user) => {
  const cleanPath = (path || "/").split("?")[0].split("#")[0];

  if (isPublicRoute(cleanPath)) return true;
  if (!user) return false;

  // For supervisor: only homepage, profile and respond page are allowed
  if (isUserSupervisor(user)) {
    return (
      cleanPath === "/" ||
      cleanPath === "/profile" ||
      cleanPath === "/my-profile" ||
      cleanPath.startsWith("/profile/") ||
      cleanPath === "/action-center" ||
      cleanPath === "/respond" ||
      cleanPath.startsWith("/action-center/") ||
      cleanPath.startsWith("/respond/")
    );
  }

  const admin = isUserAdmin(user);
  const isReportRoute =
    cleanPath === "/reports" ||
    cleanPath === "/report" ||
    cleanPath === "/my-reports" ||
    cleanPath.startsWith("/reports/") ||
    cleanPath.startsWith("/my-reports/");

  const isAdminOnlyRoute =
    cleanPath === "/dashboard" ||
    cleanPath === "/admin-dashboard" ||
    cleanPath === "/live-city" ||
    cleanPath === "/incidents" ||
    cleanPath === "/forecast" ||
    cleanPath === "/simulate" ||
    cleanPath === "/action-center" ||
    cleanPath === "/respond" ||
    cleanPath.startsWith("/dashboard/") ||
    cleanPath.startsWith("/live-city/") ||
    cleanPath.startsWith("/simulate/") ||
    cleanPath.startsWith("/action-center/");

  const isProfileRoute =
    cleanPath === "/profile" ||
    cleanPath === "/my-profile" ||
    cleanPath.startsWith("/profile/");

  const isNotificationsRoute =
    cleanPath === "/notifications" ||
    cleanPath === "/alerts" ||
    cleanPath.startsWith("/notifications/");

  if (isProfileRoute || isNotificationsRoute) return true;

  if (admin) {
    // Admin can see home, live map, simulate, respond, profile; Report page is restricted from admin
    return !isReportRoute;
  } else {
    // User can see home, report page, profile; all other pages are restricted for user
    return !isAdminOnlyRoute;
  }
};

// Helper to determine initial route safely
const getInitialRoute = () => {
  if (typeof window !== "undefined") {
    const p = window.location.pathname;
    const hasToken = !!localStorage.getItem("kwi_token");
    let cachedUser = null;
    try {
      const raw = localStorage.getItem("kwi_user");
      if (raw && hasToken) cachedUser = JSON.parse(raw);
    } catch { }

    if (!cachedUser && !isPublicRoute(p)) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, "", "/login");
      }
      return "/login";
    }

    if (cachedUser && !isRouteAllowedForUser(p, cachedUser)) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, "", "/");
      }
      return "/";
    }

    return p;
  }
  return "/";
};

const routeToSection = (path) => {
  switch (path) {
    case "/":
      return "HOME";
    case "/dashboard":
    case "/admin-dashboard":
      return "DASHBOARD";
    case "/live-city":
    case "/incidents":
    case "/forecast":
      return "LIVE_MAP";
    case "/reports":
    case "/report":
      return "REPORT";
    case "/my-reports":
      return "MY_REPORTS";
    case "/simulate":
      return "SIMULATE";
    case "/action-center":
    case "/respond":
      return "RESPOND";
    case "/profile":
    case "/my-profile":
      return "PROFILE";
    case "/notifications":
    case "/alerts":
      return "NOTIFICATIONS";
    case "/signup":
    case "/login":
    case "/auth":
      return "LOGIN";
    default:
      return "HOME";
  }
};

// Helper for location matching between reported location and incident location
export const isLocationMatch = (loc1, loc2) => {
  if (!loc1 || !loc2) return false;
  const l1 = String(loc1).toLowerCase().trim();
  const l2 = String(loc2).toLowerCase().trim();
  if (l1 === l2) return true;
  if (l1.includes(l2) || l2.includes(l1)) return true;

  const stopwords = new Set([
    "ward", "street", "st", "road", "rd", "crossing", "lane",
    "kolkata", "near", "opposite", "area", "more", "the", "and", "&"
  ]);
  const words1 = l1.split(/[\s,•\-\/]+/).filter((w) => w.length > 2 && !stopwords.has(w));
  const words2 = l2.split(/[\s,•\-\/]+/).filter((w) => w.length > 2 && !stopwords.has(w));

  return words1.some((w) => words2.includes(w));
};

// Citizen User Notifications: Strictly 3 Types:
// 1. Report Submitted Successfully
// 2. Incident Status In Progress (for reported location)
// 3. Incident Status Resolved (for reported location)
export const INITIAL_USER_NOTIFICATIONS = [];

// Municipal Admin Broadcast Notifications (Dynamically synchronized with Backend SQLite Database across 4 Categories)
export const INITIAL_ADMIN_NOTIFICATIONS = [];

export const INITIAL_NOTIFICATIONS = [
  ...INITIAL_USER_NOTIFICATIONS,
  ...INITIAL_ADMIN_NOTIFICATIONS,
];

// Helper to normalize notifications fetched from backend database
export const mapBackendNotification = (n) => {
  let category = "reports";
  let severity = "medium";
  let metrics = null;
  let action = null;
  const isAdminBroadcast = n.user_id === "ADMIN_BROADCAST" || n.recipientType === "admin";

  if (n.type === "report_submitted" && !isAdminBroadcast) {
    category = "reports";
    severity = "medium";
    metrics = { label: "Report Status", value: "Submitted", status: "Registered" };
    action = { label: "View My Reports", route: "/my-reports" };
  } else if (n.type === "incident_in_progress" && !isAdminBroadcast) {
    category = "pumps";
    severity = "high";
    metrics = { label: "Incident Status", value: "In Progress", status: "Team on Site" };
    action = { label: "Track Live Status", route: "/my-reports" };
  } else if (n.type === "incident_resolved" && !isAdminBroadcast) {
    category = "resolved";
    severity = "resolved";
    metrics = { label: "Incident Status", value: "Resolved", status: "Cleared" };
    action = { label: "View My Reports", route: "/my-reports" };
  } else if (n.type === "location_forecast" && !isAdminBroadcast) {
    category = "system";
    severity = "medium";
    metrics = { label: "24h Rain Risk", value: "Forecast", status: "Active" };
    action = { label: "View Location Reports", route: "/my-reports" };
  } else {
    // Admin operational telemetry across 4 active categories: urgent, pumps, reports, resolved
    category = n.category && n.category !== "system" ? n.category : (
      n.type === "urgent" ? "urgent" :
      n.type === "pumps" ? "pumps" :
      (n.type === "resolved" || n.type === "incident_resolved") ? "resolved" : "reports"
    );
    severity = n.severity || (category === "urgent" ? "critical" : category === "resolved" ? "resolved" : "high");
    metrics = n.metrics || null;
    if (!action) {
      if (category === "urgent") {
        action = { label: "View on GIS Map", route: "/live-city" };
      } else if (category === "pumps") {
        action = { label: "Inspect Drainage Action", route: "/action-center" };
      } else if (category === "reports") {
        action = { label: "Review Incident Queue", route: "/action-center" };
      } else if (category === "resolved") {
        action = { label: "Inspect Completed Action", route: "/action-center" };
      } else {
        action = { label: "Review Incident Queue", route: "/action-center" };
      }
    }
  }

  return {
    id: n.notification_id || String(n.id),
    dbId: n.id,
    notification_id: n.notification_id || String(n.id),
    type: n.type,
    category,
    severity,
    title: n.title,
    message: n.message,
    location: n.location || "",
    ward: n.ward || "",
    timestamp: n.timestamp || "Recently",
    created_at: n.created_at,
    isRead: Boolean(n.is_read || n.isRead),
    metrics,
    action,
    reportId: n.report_id,
    workId: n.work_id,
    recipientType: isAdminBroadcast ? "admin" : (n.type?.startsWith("incident_") || n.type === "report_submitted" || n.type === "location_forecast" ? "user" : "admin"),
    relatedLocation: n.location,
  };
};

export const useKWIStore = create((set, get) => ({
  // Theme preference: 'light' | 'dark' | 'system' (persisted)
  theme:
    (typeof window !== "undefined" && localStorage.getItem("kwi_theme")) ||
    "system",
  setTheme: (t) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kwi_theme", t);
    }
    set({ theme: t });
  },

  // Active Route & Section Navigation
  currentRoute: getInitialRoute(),
  activeSection: routeToSection(getInitialRoute()),
  profileActiveTab: "overview",
  setProfileActiveTab: (tab) => set({ profileActiveTab: tab }),

  // Pending redirect after sign-in for guarded navigation
  postLoginRedirect: null,
  setPostLoginRedirect: (path) => set({ postLoginRedirect: path }),

  navigate: (path) => {
    const { currentUser } = get();
    let target = path;
    if (!currentUser && !isPublicRoute(path)) {
      set({ postLoginRedirect: path });
      target = "/login";
    } else if (currentUser && !isRouteAllowedForUser(path, currentUser)) {
      target = isUserSupervisor(currentUser) ? "/action-center" : "/";
    }

    if (typeof window !== "undefined") {
      if (window.location.pathname !== target) {
        window.history.pushState({}, "", target);
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    const section = routeToSection(target);
    set({ currentRoute: target, activeSection: section });
  },

  // Shared Mobile Report & Verification State (Stores original user input)
  reportPhoto: null,
  reportPhotoName: null,
  reportPhotoValidation: null,
  reportDescription: "",
  reportLocation: "Salt Lake, Sector V, Kolkata",
  reportLocality: "Salt Lake, Sector V",
  reportCity: "Kolkata, West Bengal",
  reportCoords: { lat: 22.5735, lon: 88.4331, accuracy: 10 },
  reportDepth: "16-40cm",
  reportTimestamp: "Just now",
  isReportSubmitted: false,
  reportVerificationStage: 0, // 0 = idle, 1..5 = stages
  isReportVerified: false,

  setReportPhoto: (photo) => set({ reportPhoto: photo }),
  setReportPhotoName: (name) => set({ reportPhotoName: name }),
  setReportPhotoValidation: (validation) => set({ reportPhotoValidation: validation }),
  setReportDescription: (desc) => set({ reportDescription: desc }),
  setReportLocation: (loc) => set({ reportLocation: loc }),
  setReportLocality: (loc) => set({ reportLocality: loc }),
  setReportCity: (city) => set({ reportCity: city }),
  setReportCoords: (coords) => set({ reportCoords: coords }),
  setReportDepth: (depth) => set({ reportDepth: depth }),

  // ---- Waterlogging Predictions & Refresh Intelligence ----
  waterloggingPredictions: [],
  waterloggingLoading: false,
  waterloggingLastUpdated: null,
  waterloggingBatchId: null,
  waterloggingRefreshStatus: null,
  waterloggingCooldownUntil: null,
  isRefreshingPredictions: false,
  waterloggingError: null,

  fetchPredictions: async () => {
    set({ waterloggingLoading: true });
    try {
      const data = await api.get("/waterlogging/predictions");
      if (data && Array.isArray(data.predictions)) {
        set({
          waterloggingPredictions: data.predictions,
          waterloggingLastUpdated: data.prediction_timestamp,
          waterloggingBatchId: data.batch_id,
          waterloggingLoading: false,
          waterloggingError: null,
        });
        return data.predictions;
      }
    } catch (err) {
      console.warn("[KWI] fetchPredictions notice:", err?.message || err);
      set({ waterloggingLoading: false, waterloggingError: err?.message });
    }
    return [];
  },

  fetchPredictionRefreshStatus: async () => {
    try {
      const status = await api.get("/waterlogging/status");
      if (status) {
        set({
          waterloggingRefreshStatus: status,
          waterloggingCooldownUntil: status.cooldown_active ? status.next_available_at : null,
        });
        return status;
      }
    } catch (err) {
      console.warn("[KWI] fetchPredictionRefreshStatus notice:", err?.message || err);
    }
    return null;
  },

  triggerPredictionRefresh: async () => {
    set({ isRefreshingPredictions: true });
    try {
      const res = await api.post("/waterlogging/refresh");
      set({ isRefreshingPredictions: false });
      // If accepted (202), wait a moment for background worker then refresh predictions
      setTimeout(() => {
        get().fetchPredictions();
        get().fetchPredictionRefreshStatus();
      }, 3000);
      return { success: true, data: res };
    } catch (err) {
      set({ isRefreshingPredictions: false });
      const status = err?.status;
      const data = err?.data || {};

      if (status === 429) {
        const nextAvail = data.next_available_at || new Date(Date.now() + 2 * 3600 * 1000).toISOString();
        set({ waterloggingCooldownUntil: nextAvail });
        return {
          success: false,
          cooldownActive: true,
          nextAvailableAt: nextAvail,
          message: err?.message || "Cooldown active. Earliest next run is scheduled.",
        };
      }

      if (status === 409) {
        return {
          success: false,
          autoInProgress: true,
          message: "Auto update in progress, please try later.",
        };
      }

      return {
        success: false,
        message: err?.message || "Failed to trigger prediction refresh.",
      };
    }
  },

  // ---- "My Submitted Reports", Incident Queue, and City-Wide Municipal Reports ----
  myReports: [],
  allReports: [],
  incidentQueue: [],
  reportsLoaded: false,
  reportsError: null,

  // Fetch dynamic active incidents grouped from incident_queue table
  fetchIncidentQueue: async () => {
    try {
      const queue = await api.get('/incidents');
      if (Array.isArray(queue)) {
        set({ incidentQueue: queue });
        get().refreshDynamicIncidents();
      }
    } catch (err) {
      console.warn('[KWI] fetchIncidentQueue notice:', err?.message || err);
    }
  },

  // Fetch all persisted work orders from the work_orders table
  fetchWorkOrders: async () => {
    try {
      const orders = await api.get('/work-orders');
      if (Array.isArray(orders)) {
        const ordersMap = {};
        const setIds = new Set();
        const simIds = new Set();
        const outcomes = { ...(get().simulationOutcomes || {}) };

        orders.forEach((wo) => {
          if (String(wo.status || '').toLowerCase() === 'resolved') {
            return;
          }

          const cleanRef = String(wo.incident_id || '').replace(/^#/, '').trim();
          const cleanWorkId = wo.work_id || `WO-${cleanRef}`;
          const rawTicketKey = cleanWorkId;
          let eqList = ['High-Volume Suction Desilter'];
          if (wo.equipment) {
            try {
              eqList = typeof wo.equipment === 'string' && wo.equipment.startsWith('[')
                ? JSON.parse(wo.equipment)
                : [wo.equipment];
            } catch {
              eqList = [wo.equipment];
            }
          }

          ordersMap[rawTicketKey] = {
            id: cleanWorkId,
            work_id: cleanWorkId,
            ticketKey: rawTicketKey,
            incidentRef: `#${cleanRef}`,
            incidentId: cleanRef,
            location: wo.location,
            ward: wo.ward || '',
            borough: wo.ward || wo.assigned_ulb_name || 'KMC Ward',
            priority: wo.risk_level || 'CRITICAL',
            risk_level: wo.risk_level || 'CRITICAL',
            status: wo.status || 'Dispatched',
            water_depth: wo.water_depth !== undefined && wo.water_depth !== null ? Number(wo.water_depth) : 0,
            waterDepth: wo.water_depth !== undefined && wo.water_depth !== null ? `${wo.water_depth} cm depth` : '0 cm depth',
            reports_number: wo.reports_number || 1,
            issue_type: wo.issue_type || 'Waterlogging',
            intervention_type: wo.intervention_type || '',
            reason: wo.reason || '',
            latitude: wo.latitude || 0,
            longitude: wo.longitude || 0,
            assigned_ulb_id: wo.assigned_ulb_id || '',
            assigned_ulb_name: wo.assigned_ulb_name || '',
            admin_name: wo.admin_name || '',
            team_head_name: wo.team_head_name || '',
            stage: typeof wo.stage === 'number'
              ? wo.stage
              : (wo.status === 'Resolved' ? 3 : wo.status === 'In Progress' ? 2 : wo.status === 'Dispatched' ? 1 : 0),
            riskScore: `${wo.risk_level || 'HIGH'} / 100`,
            expectedImpact: wo.expected_impact || (wo.water_depth ? `-${Math.round(wo.water_depth * 0.45)} cm depth` : '-14 cm depth'),
            assignedNode: wo.assigned_node || 'PS-07 Central Sump',
            assignedCrew: wo.team_head_name ? `Supervisor: ${wo.team_head_name}` : (wo.assigned_crew || 'Central Rapid Sluice Taskforce 01'),
            chief: wo.team_head_name ? wo.team_head_name : (wo.chief || 'Er. K. Bhattacharya'),
            radio: wo.radio || 'CH-01-TAC',
            equipment: eqList,
            eta: wo.eta || '12 minutes',
            trigger: wo.intervention_type || wo.reason || wo.trigger_reason || (wo.water_depth ? `${wo.issue_type || 'Waterlogging'} (Depth: ${wo.water_depth} cm)` : 'Field intervention dispatched'),
            simulationOutcome: wo.parsed_simulation_outcome || null,
            createdAt: wo.created_at,
          };

          if (wo.incident_id) {
            setIds.add(wo.incident_id);
            setIds.add(cleanRef);
            setIds.add(`#${cleanRef}`);
            simIds.add(wo.incident_id);
            simIds.add(cleanRef);
            simIds.add(`#${cleanRef}`);
          }
          if (wo.parsed_simulation_outcome) {
            outcomes[cleanRef] = wo.parsed_simulation_outcome;
            outcomes[`#${cleanRef}`] = wo.parsed_simulation_outcome;
          }
        });

        set((state) => {
          const filteredLocal = {};
          Object.entries(state.workOrders || {}).forEach(([k, v]) => {
            if (v && String(v.status || '').toLowerCase() !== 'resolved') {
              filteredLocal[k] = v;
            }
          });
          const merged = { ...filteredLocal, ...ordersMap };
          let nextActiveId = state.activeWorkOrderTicketId;
          if (nextActiveId && !merged[nextActiveId]) {
            const keys = Object.keys(merged);
            nextActiveId = keys.length > 0 ? keys[0] : null;
          }

          return {
            workOrders: merged,
            activeWorkOrderTicketId: nextActiveId,
            dispatchedHotspotIds: Array.from(setIds),
            simulatedIncidentIds: Array.from(simIds),
            simulationOutcomes: outcomes,
          };
        });
      }
    } catch (err) {
      console.warn('[KWI] fetchWorkOrders notice:', err?.message || err);
    }
  },

  // Fetch all municipal reports across Kolkata, the active incident queue, work orders, and historical places
  fetchAllReports: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kwi_token') : null;
    try {
      // Parallel fetch for reports, incident queue, work orders, and historical places
      const [reports, queue, workOrdersRes, histRes] = await Promise.allSettled([
        api.get('/reports?all_reports=true', token),
        api.get('/incidents', token),
        get().fetchWorkOrders(),
        api.get('/historical-places', token),
      ]);

      const stateUpdate = { reportsLoaded: true, reportsError: null };
      if (reports.status === 'fulfilled' && Array.isArray(reports.value)) {
        stateUpdate.allReports = reports.value;
      }
      if (queue.status === 'fulfilled' && Array.isArray(queue.value)) {
        stateUpdate.incidentQueue = queue.value;
      }
      if (histRes.status === 'fulfilled' && Array.isArray(histRes.value)) {
        stateUpdate.historicalPlaces = histRes.value;
      }

      set(stateUpdate);
      get().refreshDynamicIncidents();
    } catch (err) {
      console.warn('[KWI] fetchAllReports notice:', err?.message || err);
    }
  },

  fetchHistoricalPlaces: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kwi_token') : null;
    try {
      const places = await api.get('/historical-places', token);
      if (Array.isArray(places)) {
        set({ historicalPlaces: places });
      }
    } catch (err) {
      console.warn('[KWI] fetchHistoricalPlaces notice:', err?.message || err);
    }
  },

  // Fetch the current user's reports from the backend (server-side ownership enforced).
  fetchMyReports: async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
    try {
      const reports = await api.get(token ? "/reports" : "/reports?all_reports=true", token);
      const userReports = Array.isArray(reports) ? reports : [];
      set({
        myReports: userReports,
        reportsLoaded: true,
        reportsError: null,
      });
      get().refreshDynamicIncidents();
      get().syncReportNotifications(userReports);
      get().fetchNotifications().catch(() => { });
    } catch (err) {
      set({ reportsError: err?.message || "Unable to load your reports." });
    }
  },

  // Dynamically derive active incidents strictly from incident_queue table
  refreshDynamicIncidents: () => {
    const s = get();
    // 1. If incidentQueue from backend is loaded (it is an Array), map it directly
    let cards = [];
    if (Array.isArray(s.incidentQueue)) {
      cards = mapIncidentQueueToCards(s.incidentQueue);
    } else if (!s.reportsLoaded) {
      // Temporary client fallback only before initial backend fetch completes
      const combined = [
        ...(s.allReports || []),
        ...(s.myReports || []).filter(
          (mr) => !(s.allReports || []).some((ar) => ar.report_id === mr.report_id),
        ),
      ];
      cards = aggregateIncidentsFromReports(combined);
    }

    const dynamicRiskZones = deriveRiskZonesFromIncidents(cards);

    set({
      incidents: cards,
      criticalIncidentsCount: cards.length,
      riskZones: dynamicRiskZones,
      highRiskZonesCount: dynamicRiskZones.length,
    });
    return cards;
  },


  submitCitizenReport: () => {
    const now = formatTime12Hour(new Date());
    set({
      isReportSubmitted: true,
      reportVerificationStage: 1,
      isReportVerified: false,
      reportTimestamp: now,
    });
    setTimeout(() => {
      set({ reportVerificationStage: 2 });
    }, 600);
    setTimeout(() => {
      set({ reportVerificationStage: 3 });
    }, 1200);
    setTimeout(() => {
      set({ reportVerificationStage: 4 });
    }, 1800);
    setTimeout(() => {
      set({ reportVerificationStage: 5, isReportVerified: true });
    }, 2400);

    const s = get();
    let parsedDepth = 28;
    const depthStr = String(s.reportDepth || "").trim();
    if (depthStr.includes("1-15") || depthStr.includes("1–15") || depthStr.toLowerCase().includes("ankle")) {
      parsedDepth = 12;
    } else if (depthStr.includes("16-40") || depthStr.includes("16–40") || depthStr.toLowerCase().includes("between")) {
      parsedDepth = 28;
    } else if (depthStr.includes("41-50") || depthStr.includes("41–50") || depthStr.toLowerCase().includes("knee")) {
      parsedDepth = 45;
    } else if (depthStr.includes("51-70") || depthStr.includes("51–70") || depthStr.toLowerCase().includes("thigh")) {
      parsedDepth = 60;
    } else {
      const depthMatch = depthStr.match(/(\d+(?:\.\d+)?)/);
      parsedDepth = depthMatch ? parseFloat(depthMatch[1]) : 28;
    }

    // Instantly generate a local preview report so the new hotspot card immediately appears
    const localReport = {
      report_id: `RPT-LOC-${Date.now()}`,
      location: s.reportLocation || "Kolkata Waterlogging Site",
      latitude: s.reportCoords?.lat ?? 0,
      longitude: s.reportCoords?.lon ?? 0,
      issue_type: "Waterlogging",
      description: s.reportDescription || "",
      water_depth: parsedDepth,
      submitted_at: new Date().toISOString(),
      status: "Under Review",
    };

    set((state) => ({
      myReports: [localReport, ...(state.myReports || [])],
      allReports: [localReport, ...(state.allReports || [])],
    }));
    get().refreshDynamicIncidents();

    // Trigger 1: User gets a notification of report submitted successfully
    get().addReportSubmittedNotification(
      s.reportLocation || "Kolkata Waterlogging Site",
      localReport.report_id
    );

    // Persist to the backend so the report appears in "My Submitted Reports"
    const token =
      typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
    const form = new FormData();
    form.append("location", s.reportLocation || "");
    form.append("latitude", String(s.reportCoords?.lat ?? 0));
    form.append("longitude", String(s.reportCoords?.lon ?? 0));
    form.append("issueType", "Waterlogging");
    form.append("description", s.reportDescription || "");
    form.append("waterDepth", String(parsedDepth));

    const dispatchSubmission = (pForm) => {
      api
        .postForm("/reports", pForm, token)
        .then((report) => {
          console.log(
            "[KWI] Report successfully saved to database with jurisdiction:",
            report,
          );
          if (report) {
            set((state) => ({
              myReports: [
                report,
                ...state.myReports.filter(
                  (r) =>
                    r.report_id !== report.report_id &&
                    r.report_id !== localReport.report_id,
                ),
              ],
              allReports: [
                report,
                ...(state.allReports || []).filter(
                  (r) =>
                    r.report_id !== report.report_id &&
                    r.report_id !== localReport.report_id,
                ),
              ],
              reportsLoaded: true,
            }));
            get().refreshDynamicIncidents();
            get().fetchIncidentQueue().catch(() => { });
            get().fetchNotifications().catch(() => { });
          }
        })

        .catch((err) => {
          console.warn(
            "[KWI] Report submission notification:",
            err?.message || err,
          );
        });
    };

    // Include the original photo (lossless data-URL → File) so the exact image is stored.
    if (
      s.reportPhoto &&
      typeof s.reportPhoto === "string" &&
      s.reportPhoto.startsWith("data:")
    ) {
      fetch(s.reportPhoto)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File(
            [blob],
            s.reportPhotoName || "waterlogging-report.jpg",
            {
              type: blob.type || "image/jpeg",
            },
          );
          form.append("image", file, file.name);
          dispatchSubmission(form);
        })
        .catch(() => {
          dispatchSubmission(form);
        });
    } else {
      // No photo captured; submit the report metadata without an image.
      dispatchSubmission(form);
    }
  },

  resetCitizenReport: () => {
    set({
      isReportSubmitted: false,
      reportVerificationStage: 0,
      isReportVerified: false,
      reportPhoto: null,
      reportPhotoName: null,
      reportPhotoValidation: null,
      reportDescription: "",
    });
  },

  setActiveSection: (section) => {
    const routeMap = {
      HOME: "/",
      DASHBOARD: "/dashboard",
      ADMIN_DASHBOARD: "/dashboard",
      LIVE_MAP: "/live-city",
      REPORT: "/reports",
      MY_REPORTS: "/my-reports",
      SIMULATE: "/simulate",
      RESPOND: "/action-center",
      LOGIN: "/login",
      // backward compatibility aliases
      CITY: "/live-city",
      INCIDENTS: "/live-city",
      FORECAST: "/live-city",
      INTELLIGENCE: "/live-city",
      PREDICT: "/live-city",
      REPORTS: "/reports",
      ACTIONS: "/action-center",
      AUTH: "/login",
    };
    const targetRoute = routeMap[section] || "/";
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== targetRoute
    ) {
      window.history.pushState({}, "", targetRoute);
    }
    set({ activeSection: section, currentRoute: targetRoute });
  },

  // Map Operational Layers
  activeLayers: {
    rain: true,
    risk: true,
    incidents: true,
    drainage: true,
    pumps: true,
    forecast: true,
  },
  toggleLayer: (layerKey) =>
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layerKey]: !state.activeLayers[layerKey],
      },
    })),
  setLayer: (layerKey, enabled) =>
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layerKey]: enabled,
      },
    })),

  // 2D / 3D Map Mode & Camera Action Triggers
  mapMode: "3D", // '3D' | '2D'
  setMapMode: (mode) => set({ mapMode: mode }),
  toggleMapMode: () =>
    set((state) => ({ mapMode: state.mapMode === "3D" ? "2D" : "3D" })),

  zoomTrigger: 0,
  triggerZoomIn: () => set((state) => ({ zoomTrigger: state.zoomTrigger + 1 })),
  triggerZoomOut: () =>
    set((state) => ({ zoomTrigger: state.zoomTrigger - 1 })),

  resetCameraTrigger: 0,
  triggerResetCamera: () =>
    set((state) => ({
      resetCameraTrigger: state.resetCameraTrigger + 1,
      selectedIncident: null,
      selectedRiskZone: null,
      selectedPumpStation: null,
      selectedDistrict: null,
    })),

  // Interactive Selection State (Synchronized across application)
  hoveredIncidentId: null,
  setHoveredIncidentId: (id) => set({ hoveredIncidentId: id }),

  selectedIncident: null,
  setSelectedIncident: (incident) =>
    set({
      selectedIncident: incident,
      selectedRiskZone: null,
      selectedPumpStation: null,
    }),

  selectedRiskZone: null,
  setSelectedRiskZone: (zone) =>
    set({
      selectedRiskZone: zone,
      selectedIncident: null,
      selectedPumpStation: null,
    }),

  selectedPumpStation: null,
  setSelectedPumpStation: (station) =>
    set({
      selectedPumpStation: station,
      selectedIncident: null,
      selectedRiskZone: null,
    }),

  selectedDistrict: null,
  setSelectedDistrict: (districtId) => set({ selectedDistrict: districtId }),

  clearSelections: () =>
    set({
      selectedIncident: null,
      selectedRiskZone: null,
      selectedPumpStation: null,
      selectedDistrict: null,
    }),

  // UI state for drawers & menus
  askKolkataOpen: false,
  setAskKolkataOpen: (open) => set({ askKolkataOpen: open }),
  toggleAskKolkata: () =>
    set((state) => ({ askKolkataOpen: !state.askKolkataOpen })),

  // Login & Authentication state
  isLoginModalOpen: false,
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  toggleLoginModal: () =>
    set((state) => ({ isLoginModalOpen: !state.isLoginModalOpen })),

  // Real user identity — hydrated from localStorage cache only if a token also exists
  currentUser:
    typeof window !== "undefined" &&
      localStorage.getItem("kwi_token") &&
      localStorage.getItem("kwi_user")
      ? JSON.parse(localStorage.getItem("kwi_user"))
      : null,

  // Helper: normalize a backend UserResponse into the frontend profile shape,
  // preserving any local-only fields (institution, username) not served by the API.
  mapBackendUser: (be) => {
    const cached = get().currentUser || {};
    const email = be.email || cached.email || "";
    return {
      ...cached, // keep local-only fields (institution, username)
      id: be.id || cached.id || null,
      name: be.name || be.full_name || cached.name || "",
      username: cached.username || email.split("@")[0] || "",
      email,
      phone: be.phone ?? cached.phone ?? "",
      location: be.location ?? cached.location ?? "",
      institution: cached.institution ?? "",
      department: be.department || cached.department || "",
      bio: be.bio ?? cached.bio ?? "",
      role:
        be.role || cached.role || (be.portal === "admin" ? "Admin" : be.portal === "supervisor" ? "Supervisor" : "User"),
      badgeId: be.badgeId || be.badge_id || cached.badgeId || "",
      clearance: be.clearance || cached.clearance || "",
      createdAt: be.created_at || cached.createdAt || null,
      portal:
        be.portal ||
        (isUserSupervisor(be)
          ? "supervisor"
          : (be.badgeId || be.badge_id || String(be.id || "").startsWith("ADM-")
            ? "admin"
            : cached.portal || "user")),
      status: be.status || cached.status || "active",
    };
  },

  // Persist a hydrated/authenticated user.
  setCurrentUser: (userData) => {
    if (typeof window !== "undefined") {
      if (userData) {
        localStorage.setItem("kwi_user", JSON.stringify(userData));
      } else {
        localStorage.removeItem("kwi_user");
      }
    }
    set({ currentUser: userData });
  },

  // On app mount: refresh the profile, device location, and municipal reports from backend
  initUser: async () => {
    if (typeof window === "undefined") return;
    // Auto-fetch device location immediately when website opens
    get().fetchDeviceLocation().catch(() => { });
    // Always fetch municipal reports and compute dynamic incidents on app load
    get().fetchAllReports().catch(() => { });
    const token = localStorage.getItem("kwi_token");
    if (!token) {
      set({ currentUser: null });
      return;
    }
    try {
      const me = await api.get("/auth/me", token);
      get().setCurrentUser(get().mapBackendUser(me));
      get().fetchMyReports().catch(() => { });
      get().fetchNotifications().catch(() => { });
    } catch (err) {
      // Unauthorized / invalid token → drop the stale session.
      if (
        err?.message &&
        /unauthorized|invalid|expired|not found|inactive/i.test(err.message)
      ) {
        localStorage.removeItem("kwi_token");
        localStorage.removeItem("kwi_user");
        set({ currentUser: null });
      }
      // Otherwise (backend offline) keep the cached localStorage user.
    }
  },

  // Persist a login/signup result: JWT token + normalized user.
  loginUser: (userData) => {
    if (typeof window !== "undefined") {
      if (userData?.access_token) {
        localStorage.setItem("kwi_token", userData.access_token);
      }
    }
    const user = get().mapBackendUser(userData?.user || userData || {});
    get().setCurrentUser(user);
    get().fetchNotifications().catch(() => { });
    set({ isLoginModalOpen: false });
  },

  // Merge local edits into state + localStorage, and best-effort sync to backend.
  updateUserProfile: (profileData) => {
    const merged = { ...(get().currentUser || {}), ...profileData };
    get().setCurrentUser(merged);
    // Best-effort backend sync (non-blocking; ignore failures when server is down).
    const token =
      typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
    if (!token) return;
    api
      .patch(
        "/auth/me",
        {
          fullName: merged.name ?? undefined,
          department: merged.department ?? undefined,
          phone: merged.phone ?? "",
          location: merged.location ?? "",
          bio: merged.bio ?? "",
          avatar_url: merged.avatarUrl ?? "",
        },
        token,
      )
      .then((me) => {
        // Refresh with any server-normalized values (e.g. full name).
        get().setCurrentUser(get().mapBackendUser({ ...me, ...merged }));
      })
      .catch(() => {
        // Keep local state; the next successful sync covers the difference.
      });
  },

  logoutUser: () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
    if (token) {
      api.post("/auth/logout", {}, token).catch(() => { });
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("kwi_user");
      localStorage.removeItem("kwi_token");
    }
    set({
      currentUser: null,
      myReports: [],
      reportsLoaded: false,
      reportsError: null,
      postLoginRedirect: null,
    });
    get().navigate("/");
  },

  // Real-time device geolocation state
  deviceLocation: (() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("kwi_device_location");
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return null;
  })(),
  locationPermission:
    typeof window !== "undefined"
      ? localStorage.getItem("kwi_location_perm") || "prompt"
      : "prompt",
  isLocatingDevice: false,

  // Prompt device for geolocation permission and automatically fetch coordinates & locality
  fetchDeviceLocation: async (force = false) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      set({ locationPermission: "unsupported", isLocatingDevice: false });
      return null;
    }

    set({ isLocatingDevice: true });

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy || 10);

          let locality = "";
          let city = "Kolkata, West Bengal";
          let ward = "";

          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              locality =
                data.address?.suburb ||
                data.address?.neighbourhood ||
                data.address?.road ||
                data.address?.city_district ||
                "";
              city =
                data.address?.city ||
                data.address?.town ||
                data.address?.state ||
                "Kolkata, West Bengal";
              const fullAddr = [locality, data.address?.road, data.address?.neighbourhood]
                .filter(Boolean)
                .join(" ");
              const wardMatch = fullAddr.match(/ward\s*(\d+)/i);
              if (wardMatch) ward = `Ward ${wardMatch[1]}`;
            }
          } catch {}

          if (!locality) {
            // Intelligent Kolkata metro zone resolver based on coordinates
            if (lat >= 22.56 && lat <= 22.60 && lon >= 88.40 && lon <= 88.46) {
              locality = "Salt Lake, Sector V";
              ward = "Ward 32";
            } else if (lat >= 22.58 && lat <= 22.62) {
              locality = "Maniktala / Ultadanga";
              ward = "Ward 14";
            } else if (lat >= 22.50 && lat <= 22.54) {
              locality = "Gariahat / Ballygunge";
              ward = "Ward 85";
            } else if (lat >= 22.48 && lat <= 22.52 && lon <= 88.35) {
              locality = "Behala Chowrasta";
              ward = "Ward 128";
            } else {
              locality = "Kolkata Municipal Area";
            }
          }

          const fullLocation = `${locality}, ${city}`;
          const locData = {
            lat,
            lon,
            accuracy,
            locality,
            city,
            location: fullLocation,
            ward,
            timestamp: new Date().toISOString(),
          };

          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("kwi_device_location", JSON.stringify(locData));
              localStorage.setItem("kwi_location_perm", "granted");
            } catch {}
          }

          set({
            deviceLocation: locData,
            locationPermission: "granted",
            isLocatingDevice: false,
          });

          // Automatically refresh notifications with this device location
          get().fetchNotifications(locData).catch(() => {});

          // Synchronize profile location if citizen user is logged in
          const { currentUser } = get();
          if (currentUser && !currentUser.location) {
            const token = localStorage.getItem("kwi_token");
            if (token) {
              api.patch("/auth/me", { location: fullLocation }, token).catch(() => {});
            }
          }

          resolve(locData);
        },
        (error) => {
          console.warn("[KWI] Device geolocation lookup notice:", error?.message || error);
          if (error.code === 1) {
            // Permission Denied
            if (typeof window !== "undefined") {
              localStorage.setItem("kwi_location_perm", "denied");
            }
            set({ locationPermission: "denied", isLocatingDevice: false });
          } else {
            set({ isLocatingDevice: false });
          }
          resolve(get().deviceLocation || null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  },

  // Notifications & Alerts Center State (Synchronized with Backend SQLite Database)
  notifications: INITIAL_NOTIFICATIONS,
  unreadNotificationsCount: INITIAL_NOTIFICATIONS.filter((n) => !n.isRead).length,
  setUnreadNotificationsCount: (count) =>
    set({ unreadNotificationsCount: count }),

  // Fetch persisted notifications directly from Backend SQLite database with current location telemetry
  fetchNotifications: async (locParams = null) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
    try {
      let url = "/notifications";
      const loc = locParams || get().deviceLocation || null;
      if (loc) {
        const params = new URLSearchParams();
        if (loc.lat && loc.lon) {
          params.append("lat", String(loc.lat));
          params.append("lon", String(loc.lon));
        }
        if (loc.location || loc.locality) {
          params.append("location", loc.location || loc.locality);
        }
        const qs = params.toString();
        if (qs) url += `?${qs}`;
      }

      const res = await api.get(url, token);
      if (Array.isArray(res)) {
        const mapped = res.map(mapBackendNotification);
        const { currentUser } = get();
        const isAdmin = isUserAdmin(currentUser);
        let merged = mapped;

        // Strict deduplication, single forecast & 7-day citizen expiration enforcement:
        const seenIds = new Set();
        const seenEvents = new Set();
        let seenForecast = false;
        const deduped = [];
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        for (const n of merged) {
          const idKey = n.id || n.notification_id;
          const locKey = String(n.location || n.relatedLocation || "").toLowerCase().trim();
          const titleKey = String(n.title || "").toLowerCase().trim();
          
          // Form a robust event key for deduplication across all roles
          let eventKey = "";
          if (n.reportId) {
            eventKey = `${n.type || ""}|report:${n.reportId}`;
          } else if (n.workId) {
            eventKey = `${n.type || ""}|work:${n.workId}`;
          } else if (titleKey) {
            eventKey = `${n.type || ""}|${titleKey}|${locKey}`;
          } else {
            eventKey = `${n.type || ""}|${locKey}`;
          }

          if (seenIds.has(idKey)) continue;
          if (eventKey && seenEvents.has(eventKey)) continue;

          // For regular citizens only: prune any notifications older than 7 days (admins keep full history)
          if (!isAdmin) {
            const rawDate = n.created_at || n.createdAt;
            if (rawDate) {
              const parsedTime = new Date(rawDate).getTime();
              if (!isNaN(parsedTime) && parsedTime < sevenDaysAgo) {
                continue;
              }
            }
          }

          // For regular citizens, only allow ONE current-location forecast notification:
          if (!isAdmin && n.type === "location_forecast") {
            if (seenForecast) continue;
            seenForecast = true;
          }

          seenIds.add(idKey);
          if (eventKey) {
            seenEvents.add(eventKey);
          }
          deduped.push(n);
        }

        set({
          notifications: deduped,
          unreadNotificationsCount: deduped.filter((n) => !n.isRead).length,
        });
        return deduped;
      }
    } catch (err) {
      console.warn("[KWI] fetchNotifications notice:", err?.message || err);
    }
    return [];
  },

  markNotificationAsRead: (id) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id || n.notification_id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications: updated,
        unreadNotificationsCount: updated.filter((n) => !n.isRead).length,
      };
    });
    // Async persist to backend database
    api.patch(`/notifications/${encodeURIComponent(id)}/read`, {}, token).catch(() => { });
  },

  markAllNotificationsAsRead: () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, isRead: true }));
      return {
        notifications: updated,
        unreadNotificationsCount: 0,
      };
    });
    // Async persist to backend database
    api.patch("/notifications/mark-all-read", {}, token).catch(() => { });
  },

  deleteNotification: async (id) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
    const cleanId = String(id || "").trim();
    if (!cleanId) return;

    set((state) => {
      const updated = state.notifications.filter(
        (n) =>
          String(n.id) !== cleanId &&
          String(n.notification_id) !== cleanId &&
          String(n.dbId) !== cleanId
      );
      return {
        notifications: updated,
        unreadNotificationsCount: updated.filter((n) => !n.isRead).length,
      };
    });

    // Async persist to backend database
    try {
      await api.delete(`/notifications/${encodeURIComponent(cleanId)}`, token);
    } catch (err) {
      console.warn("[KWI] deleteNotification backend notice:", err?.message || err);
    }
  },

  clearAllNotifications: () => {
    set({
      notifications: [],
      unreadNotificationsCount: 0,
    });
  },

  clearReadNotifications: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
    set((state) => {
      const updated = state.notifications.filter((n) => !n.isRead);
      return {
        notifications: updated,
        unreadNotificationsCount: updated.filter((n) => !n.isRead).length,
      };
    });

    // Async persist to backend database
    try {
      await api.delete("/notifications/clear-read", token);
    } catch (err) {
      console.warn("[KWI] clearReadNotifications backend notice:", err?.message || err);
    }
  },

  // 1. Report Submitted Successfully Notification
  addReportSubmittedNotification: (location, reportId) => {
    const loc = location || "Kolkata Reported Site";
    const repId = reportId || `RPT-${Date.now()}`;
    const newNotif = {
      id: `NOTIF-SUBMIT-${Date.now()}`,
      type: "report_submitted",
      category: "reports",
      severity: "medium",
      title: "Report Submitted Successfully",
      message: `Your waterlogging report for ${loc} has been submitted successfully and registered with the municipal emergency response desk. Incident tracking ID #${repId}.`,
      location: loc,
      ward: loc,
      timestamp: "Just now",
      isRead: false,
      metrics: { label: "Report Status", value: "Submitted", status: "Registered" },
      action: { label: "View My Reports", route: "/my-reports" },
      recipientType: "user",
      relatedLocation: loc,
    };

    set((state) => {
      const updated = [newNotif, ...state.notifications];
      return {
        notifications: updated,
        unreadNotificationsCount: updated.filter((n) => !n.isRead).length,
      };
    });
  },

  // 2 & 3. Incident Status Change Notification:
  // When an incident status changes to "In Progress" or "Resolved",
  // all users who generated reports for that incident location get a message.
  notifyIncidentStatusChange: (incidentLocation, newStatus, workId) => {
    if (!incidentLocation || !newStatus) return;
    const s = get();
    const loc = String(incidentLocation).trim();
    const statusNormalized = newStatus.trim().toLowerCase();

    // Check if the user generated reports for that incident location
    const matchingReports = (s.myReports || []).filter((r) =>
      isLocationMatch(r.location, loc)
    );

    // If user generated reports for that incident location, dispatch notification
    if (matchingReports.length > 0) {
      const alreadyHasStatusNotif = (s.notifications || []).some(
        (n) => n.type === (statusNormalized === "in progress" ? "incident_in_progress" : "incident_resolved") &&
               isLocationMatch(n.relatedLocation || n.location, loc)
      );
      if (alreadyHasStatusNotif) return;

      if (statusNormalized === "in progress") {
        const inProgNotif = {
          id: `NOTIF-IN_PROG-${workId || Date.now()}-${Date.now()}`,
          type: "incident_in_progress",
          category: "pumps",
          severity: "high",
          title: "Response In Progress: Field Team Deployed",
          message: `Municipal response crews and high-capacity drainage units have been deployed to ${loc} for your reported incident. Active clearing operations in progress.`,
          location: loc,
          ward: matchingReports[0]?.ward ? `Ward ${matchingReports[0].ward}` : loc,
          timestamp: "Just now",
          isRead: false,
          metrics: { label: "Incident Status", value: "In Progress", status: "Team on Site" },
          action: { label: "Track Live Status", route: "/my-reports" },
          recipientType: "user",
          relatedLocation: loc,
        };

        set((state) => {
          const updated = [inProgNotif, ...state.notifications];
          return {
            notifications: updated,
            unreadNotificationsCount: updated.filter((n) => !n.isRead).length,
          };
        });
      } else if (statusNormalized === "resolved") {
        const resolvedNotif = {
          id: `NOTIF-RESOLVED-${workId || Date.now()}-${Date.now()}`,
          type: "incident_resolved",
          category: "resolved",
          severity: "resolved",
          title: "Incident Resolved: Water Cleared",
          message: `Waterlogging incident at ${loc} has been successfully resolved and drained. Municipal crews have completed road clearance and reopened traffic.`,
          location: loc,
          ward: matchingReports[0]?.ward ? `Ward ${matchingReports[0].ward}` : loc,
          timestamp: "Just now",
          isRead: false,
          metrics: { label: "Incident Status", value: "Resolved", status: "Cleared" },
          action: { label: "View My Reports", route: "/my-reports" },
          recipientType: "user",
          relatedLocation: loc,
        };

        set((state) => {
          const updated = [resolvedNotif, ...state.notifications];
          return {
            notifications: updated,
            unreadNotificationsCount: updated.filter((n) => !n.isRead).length,
          };
        });
      }
    }
  },

  // Synchronize reports status changes with user notifications
  syncReportNotifications: (reports) => {
    if (!Array.isArray(reports) || reports.length === 0) return;
    const existing = get().notifications || [];
    const newNotifs = [];

    reports.forEach((rep) => {
      const repLoc = rep.location || "Kolkata Site";
      const repStatus = (rep.status || "").toLowerCase();

      if (repStatus === "in progress" || (rep.dispatch_status && rep.dispatch_status.toLowerCase().includes("in progress"))) {
        const alreadyExists = existing.some(
          (n) => n.type === "incident_in_progress" && isLocationMatch(n.relatedLocation || n.location, repLoc)
        );
        if (!alreadyExists && !newNotifs.some((n) => n.type === "incident_in_progress" && isLocationMatch(n.relatedLocation || n.location, repLoc))) {
          newNotifs.push({
            id: `NOTIF-IN_PROG-${rep.report_id || Date.now()}`,
            type: "incident_in_progress",
            category: "pumps",
            severity: "high",
            title: "Response In Progress: Field Team Deployed",
            message: `Municipal response crews and high-capacity drainage units have been deployed to ${repLoc} for your reported incident. Active clearing operations in progress.`,
            location: repLoc,
            ward: rep.ward ? `Ward ${rep.ward}` : repLoc,
            timestamp: "Recently",
            isRead: false,
            metrics: { label: "Incident Status", value: "In Progress", status: "Team on Site" },
            action: { label: "Track Live Status", route: "/my-reports" },
            recipientType: "user",
            relatedLocation: repLoc,
          });
        }
      }

      if (repStatus === "resolved") {
        const alreadyExists = existing.some(
          (n) => n.type === "incident_resolved" && isLocationMatch(n.relatedLocation || n.location, repLoc)
        );
        if (!alreadyExists && !newNotifs.some((n) => n.type === "incident_resolved" && isLocationMatch(n.relatedLocation || n.location, repLoc))) {
          newNotifs.push({
            id: `NOTIF-RESOLVED-${rep.report_id || Date.now()}`,
            type: "incident_resolved",
            category: "resolved",
            severity: "resolved",
            title: "Incident Resolved: Water Cleared",
            message: `Waterlogging incident at ${repLoc} has been successfully resolved and drained. Municipal crews have completed road clearance and reopened traffic.`,
            location: repLoc,
            ward: rep.ward ? `Ward ${rep.ward}` : repLoc,
            timestamp: "Recently",
            isRead: false,
            metrics: { label: "Incident Status", value: "Resolved", status: "Cleared" },
            action: { label: "View My Reports", route: "/my-reports" },
            recipientType: "user",
            relatedLocation: repLoc,
          });
        }
      }
    });

    if (newNotifs.length > 0) {
      set((state) => {
        const updated = [...newNotifs, ...state.notifications];
        return {
          notifications: updated,
          unreadNotificationsCount: updated.filter((n) => !n.isRead).length,
        };
      });
    }
  },

  clearNotifications: () => {
    get().markAllNotificationsAsRead();
  },


  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Live City Telemetry & Municipal Metrics
  isLiveCityConnected: true,
  lastUpdated: formatTime12Hour(new Date()),
  hooghlyTideLevel: 3.42, // meters
  hooghlyTideTrend: "RISING", // 'RISING' | 'FALLING' | 'STABLE'

  // Real GIS Municipal Stats (as requested)
  highRiskZonesCount: 0,
  criticalIncidentsCount: 0,
  rainfallDisplay: "74 mm / 3 hr",
  rainfallIntensity: "HEAVY",
  pumpsAtCapacityCount: 2,
  activePumps: 78,
  totalPumps: 84,

  // Active Incidents Dataset (Derived dynamically from reports table)
  incidents: [],

  // Pumping Stations
  pumpingStations: [
    {
      id: "PS-07",
      name: "PS-07 Sector V Booster Station",
      position: [5.6, 0.15, -1.2],
      status: "AT CAPACITY",
      capacity: "100%",
      pumpsRunning: "3/3",
      dischargeRate: "85 cusecs",
      connectedCanal: "Bagjola Canal Outfall",
      ward: "Sector V IT Corridor",
      loadPct: 100,
      critical: true,
    },
    {
      id: "PS-02",
      name: "PS-02 Palmer Bridge Drainage Station",
      position: [1.8, 0.15, 0.2],
      status: "ACTIVE",
      capacity: "80%",
      pumpsRunning: "4/5",
      dischargeRate: "140 cusecs",
      connectedCanal: "Palmer Bridge Outfall",
      ward: "Borough VII",
      loadPct: 80,
      critical: false,
    },
    {
      id: "PS-04",
      name: "PS-04 Ballygunge Drainage Station",
      position: [1.8, 0.15, 2.8],
      status: "AT CAPACITY",
      capacity: "100%",
      pumpsRunning: "3/3",
      dischargeRate: "120 cusecs",
      connectedCanal: "Ballygunge Trunk Outfall",
      ward: "Borough VIII",
      loadPct: 100,
      critical: true,
    },
    {
      id: "PS-09",
      name: "PS-09 Mominpore / Behala Booster",
      position: [-2.6, 0.15, 4.2],
      status: "ACTIVE",
      capacity: "75%",
      pumpsRunning: "3/4",
      dischargeRate: "95 cusecs",
      connectedCanal: "Keorapukur Khal",
      ward: "Borough XIII",
      loadPct: 75,
      critical: false,
    },
  ],

  // Risk Zones Dataset (Dynamically populated from submitted incidents)
  riskZones: [],

  // Incident filter/resolution
  resolveIncident: (id) =>
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === id
          ? {
            ...inc,
            severity: "RESOLVED",
            status: "RESOLVED",
            waterLevel: "2.0 cm",
          }
          : inc,
      ),
    })),

  getCriticalCount: () => {
    return get().incidents.filter((inc) => inc.severity === "CRITICAL").length;
  },

  // Copilot Ask Kolkata state
  copilotQuery: "",
  setCopilotQuery: (q) => set({ copilotQuery: q }),
  chatMessages: [
    {
      sender: "system",
      text: "NIVARA Copilot online. Telemetry synchronized with KMC Drainage Department, Hooghly River Sluice Grid, and 84 municipal pumping stations.",
      timestamp: "01:00 PM",
    },
  ],
  sendCopilotMessage: (text) => {
    if (!text.trim()) return;
    const userMsg = {
      sender: "user",
      text,
      timestamp: formatTime12Hour(new Date()),
    };

    let reply;
    const lower = text.toLowerCase();

    if (lower.includes('sector v') || lower.includes('sa-754') || lower.includes('ps-07')) {
      reply = "Salt Lake Sector V Incident #SA-754: 30cm water depth logged. PS-07 booster station operating discharging into Bagjola Canal."
    } else if (lower.includes('critical') || lower.includes('incident') || lower.includes('waterlog')) {
      reply = "Active waterlogging incidents from municipal reports include Salt Lake Sector V (#SA-754, 30cm), College More (#CO-493, 30cm), and Maniktala (#MA-979, 15cm)."
    } else if (lower.includes('tide') || lower.includes('hooghly') || lower.includes('river') || lower.includes('sluice')) {
      reply = "Hooghly River tidal gauge at Princep Ghat reports 3.42m (RISING). Lock gates at Circular Canal and Palmer Bridge are currently throttled to prevent river backflow into city storm drains."
    } else if (lower.includes('pump') || lower.includes('palmer') || lower.includes('ballygunge')) {
      reply = "78 of 84 major KMC pumping units are active. PS-07 and PS-04 are at 100% capacity. Palmer Bridge is running 4/5 pumps discharging 140 cusecs."
    } else if (lower.includes('forecast') || lower.includes('rain')) {
      reply = "Monsoon squall band over Alipore & Central Kolkata is depositing 74 mm / 3 hr. Intensity is HEAVY, with high runoff entering Sector V Main Trunk and Circular Canal."
    } else {
      reply = `Telemetry check for "${text}": All sensor networks in Boroughs I through XVI are transmitting valid hydraulic pressure and depth data.`;
    }

    const botMsg = {
      sender: "bot",
      text: reply,
      timestamp: formatTime12Hour(new Date()),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg, botMsg],
      copilotQuery: "",
    }));
  },

  // Dispatched hotspots list (popped from simulation)
  dispatchedHotspotIds: [],
  markHotspotDispatched: (incidentId) => {
    if (!incidentId) return
    set((state) => {
      const setIds = new Set([...state.dispatchedHotspotIds, incidentId])
      const cleanId = String(incidentId).replace(/^#/, '')
      setIds.add(cleanId)
      setIds.add(`#${cleanId}`)
      return { dispatchedHotspotIds: Array.from(setIds) }
    })
  },
  resetDispatchedHotspots: () => set({ dispatchedHotspotIds: [] }),

  // Work Orders Store
  workOrders: {},
  historicalPlaces: [],
  setHistoricalPlaces: (places) => set({ historicalPlaces: places }),

  // Hydraulic Scenario Simulation State & Action Center Bridge
  activeSimulationIncidentId: null,
  setActiveSimulationIncidentId: (id) => set({ activeSimulationIncidentId: id }),
  activeWorkOrderTicketId: null,
  setActiveWorkOrderTicketId: (ticketId) => set({ activeWorkOrderTicketId: ticketId }),
  latestSimulationOutcome: null,
  setLatestSimulationOutcome: (outcome) => set({ latestSimulationOutcome: outcome }),
  simulatedIncidentIds: [],
  simulationOutcomes: {},
  markIncidentSimulated: (id, outcome) => {
    if (!id) return;
    const clean = String(id).replace(/^#/, "");
    set((state) => ({
      simulatedIncidentIds: Array.from(
        new Set([...(state.simulatedIncidentIds || []), id, clean, `#${clean}`])
      ),
      simulationOutcomes: {
        ...(state.simulationOutcomes || {}),
        [id]: outcome,
        [clean]: outcome,
        [`#${clean}`]: outcome,
      },
    }));
  },

  createWorkOrder: async (newOrder, options = {}) => {
    const rawRef = newOrder.incidentId || newOrder.incidentRef || 'IN-101';
    const cleanRef = String(rawRef).replace(/^#/, '').trim();
    const ticketKey = `WO-${cleanRef}`;
    const fullId = `WO-${cleanRef}`;

    const waterDepthNum = newOrder.water_depth !== undefined && newOrder.water_depth !== null
      ? Number(newOrder.water_depth)
      : (newOrder.waterDepth ? parseFloat(String(newOrder.waterDepth).replace(/[^\d.]/g, '')) : 0.0);

    const finalizedOrder = {
      ...newOrder,
      id: fullId,
      ticketKey,
      incidentRef: `#${cleanRef}`,
      incidentId: cleanRef,
      water_depth: waterDepthNum,
      waterDepth: `${waterDepthNum} cm depth`,
      status: newOrder.status || 'Dispatched',
      stage: typeof newOrder.stage === 'number' ? newOrder.stage : 1, // Stage 1 = Dispatched (Step 2)
    };

    const adminName = get().currentUser?.name || 'Municipal Administrator';

    // 1. Persist to backend first to check supervisor availability in team_head table
    let created = null;
    try {
      created = await api.post('/work-orders', {
        work_id: ticketKey,
        incident_id: cleanRef,
        incident_ref: finalizedOrder.incidentRef,
        location: finalizedOrder.location || '',
        latitude: finalizedOrder.lat ? parseFloat(String(finalizedOrder.lat).replace(/[^\d.]/g, '')) : 0.0,
        longitude: finalizedOrder.lng ? parseFloat(String(finalizedOrder.lng).replace(/[^\d.]/g, '')) : 0.0,
        ward: finalizedOrder.borough || '',
        issue_type: 'Waterlogging',
        risk_level: finalizedOrder.priority || 'CRITICAL',
        water_depth: waterDepthNum,
        intervention_type: finalizedOrder.intervention_type || finalizedOrder.interventionType || '',
        status: finalizedOrder.status || 'Dispatched',
        admin_name: adminName,
      });
    } catch (err) {
      console.warn('[KWI] Backend work order creation notice:', err?.message || err);
      throw err;
    }

    const assignedSup = created?.team_head_name || '';

    // 2. Only update local store once supervisor assignment is confirmed by backend
    set((state) => {
      const setIds = new Set([...state.dispatchedHotspotIds]);
      const simIds = new Set([...(state.simulatedIncidentIds || [])]);
      if (newOrder.incidentId) {
        setIds.add(newOrder.incidentId);
        setIds.add(String(newOrder.incidentId).replace(/^#/, ''));
        setIds.add(`#${String(newOrder.incidentId).replace(/^#/, '')}`);
        simIds.add(newOrder.incidentId);
        simIds.add(String(newOrder.incidentId).replace(/^#/, ''));
        simIds.add(`#${String(newOrder.incidentId).replace(/^#/, '')}`);
      }
      if (newOrder.incidentRef) {
        setIds.add(newOrder.incidentRef);
        setIds.add(String(newOrder.incidentRef).replace(/^#/, ''));
        setIds.add(`#${String(newOrder.incidentRef).replace(/^#/, '')}`);
        simIds.add(newOrder.incidentRef);
        simIds.add(String(newOrder.incidentRef).replace(/^#/, ''));
        simIds.add(`#${String(newOrder.incidentRef).replace(/^#/, '')}`);
      }

      return {
        workOrders: {
          [ticketKey]: {
            ...finalizedOrder,
            team_head_name: assignedSup,
            admin_name: created?.admin_name || adminName,
            assignedCrew: assignedSup ? `Supervisor: ${assignedSup}` : finalizedOrder.assignedCrew,
            chief: assignedSup || finalizedOrder.chief,
          },
          ...state.workOrders,
        },
        activeWorkOrderTicketId: ticketKey,
        latestSimulationOutcome: finalizedOrder,
        dispatchedHotspotIds: Array.from(setIds),
        simulatedIncidentIds: Array.from(simIds),
        simulationOutcomes: {
          ...(state.simulationOutcomes || {}),
          [rawRef]: newOrder.simulationOutcome,
          [cleanRef]: newOrder.simulationOutcome,
          [`#${cleanRef}`]: newOrder.simulationOutcome,
        },
      };
    });

    const targetRoute = options.redirectTo || '/respond';
    get().navigate(targetRoute);
    return ticketKey;
  },

  advanceWorkOrderStatus: (ticketKey, resolutionData = {}) => {
    // Only assigned supervisors can advance status (In Progress, Resolved)
    const currentUser = get().currentUser;
    if (!isUserSupervisor(currentUser)) {
      console.warn('[KWI] Unauthorized: Only supervisors can change work order status to In Progress or Resolved.');
      return;
    }

    const key = ticketKey || get().activeWorkOrderTicketId
    const existing = get().workOrders[key]
    if (!existing) return

    // Ensure the supervisor only advances work orders assigned to them
    const supName = (currentUser?.name || currentUser?.full_name || "").trim().toLowerCase();
    const existingSup = (existing.team_head_name || existing.chief || "").trim().toLowerCase();
    const existingCrew = (existing.assignedCrew || existing.assigned_crew || "").trim().toLowerCase();
    const isOwner =
      !existingSup ||
      (supName && (existingSup === supName || existingSup.includes(supName) || supName.includes(existingSup))) ||
      (supName && existingCrew.includes(supName));

    if (!isOwner) {
      console.warn('[KWI] Unauthorized: You can only advance work orders assigned to you.');
      return;
    }

    const currentStage = typeof existing.stage === 'number'
      ? existing.stage
      : (existing.status === 'Resolved' ? 3 : existing.status === 'In Progress' ? 2 : existing.status === 'Dispatched' ? 1 : 0)

    const nextStage = Math.min(3, currentStage + 1)
    const STAGE_NAMES = ['Recommended', 'Dispatched', 'In Progress', 'Resolved']
    const nextStatus = STAGE_NAMES[nextStage]

    const resolvedImageUrl = resolutionData?.image_url || existing.image_url || '';
    const resolvedReason = resolutionData?.reason || existing.reason || 'Resolved by Field Supervisor';

    if (nextStatus === 'Resolved') {
      // Notify all users who reported this incident location that it is Resolved (Type 3)
      get().notifyIncidentStatusChange(
        existing.location || existing.hotspot_name || existing.title || "Kolkata Site",
        'Resolved',
        key
      );

      // First update state to Resolved so resolved phase and arrow indication stay on screen for 3s
      set((state) => ({
        workOrders: {
          ...state.workOrders,
          [key]: {
            ...existing,
            stage: nextStage,
            status: nextStatus,
            image_url: resolvedImageUrl,
            reason: resolvedReason,
          },
        },
        latestSimulationOutcome:
          state.latestSimulationOutcome?.ticketKey === key
            ? { ...state.latestSimulationOutcome, stage: nextStage, status: nextStatus, image_url: resolvedImageUrl, reason: resolvedReason }
            : state.latestSimulationOutcome,
      }))

      // Increase time for resolved phase by 3s with arrow indication, then clear incident details
      setTimeout(() => {
        set((state) => {
          const nextWorkOrders = { ...state.workOrders }
          delete nextWorkOrders[key]

          const remainingKeys = Object.keys(nextWorkOrders)
          const nextActiveId = remainingKeys.length > 0 ? remainingKeys[0] : null

          return {
            workOrders: nextWorkOrders,
            activeWorkOrderTicketId: nextActiveId,
            latestSimulationOutcome:
              state.latestSimulationOutcome?.ticketKey === key ? null : state.latestSimulationOutcome,
          }
        })

        const targetId = existing.id || existing.work_id || key;
        // Async sync to backend after 3s resolved phase
        api.patch(`/work-orders/${encodeURIComponent(targetId)}/status`, {
          status: nextStatus,
          stage: nextStage,
          reason: resolvedReason,
          image_url: resolvedImageUrl,
        }).then(() => {
          // Refresh incident queue, reports, and work orders so resolved status is reflected across the app
          get().fetchAllReports().catch(() => { })
          get().fetchNotifications().catch(() => { })
          get().fetchWorkOrders().catch(() => { })
        }).catch((err) => {
          console.warn('[KWI] Backend work order status update notice:', err?.message || err)
        })
      }, 3000)
    } else {
      if (nextStatus === 'In Progress') {
        // Notify all users who reported this incident location that response is In Progress (Type 2)
        get().notifyIncidentStatusChange(
          existing.location || existing.hotspot_name || existing.title || "Kolkata Site",
          'In Progress',
          key
        );
      }

      set((state) => ({
        workOrders: {
          ...state.workOrders,
          [key]: {
            ...existing,
            stage: nextStage,
            status: nextStatus,
          },
        },
        latestSimulationOutcome:
          state.latestSimulationOutcome?.ticketKey === key
            ? { ...state.latestSimulationOutcome, stage: nextStage, status: nextStatus }
            : state.latestSimulationOutcome,
      }))

      const targetId = existing.id || existing.work_id || key;
      // Async sync to backend
      api.patch(`/work-orders/${encodeURIComponent(targetId)}/status`, {
        status: nextStatus,
        stage: nextStage,
      }).then(() => {
        // Refresh incident queue, reports, and notifications
        get().fetchAllReports().catch(() => { })
        get().fetchNotifications().catch(() => { })
      }).catch((err) => {
        console.warn('[KWI] Backend work order status update notice:', err?.message || err)
      })
    }
  },

  dispatchSimulationToWorkOrder: (ticketId, outcome) => {
    set({
      activeWorkOrderTicketId: ticketId || null,
      latestSimulationOutcome: outcome || null,
    })
    get().navigate('/action-center')
  },
}))
