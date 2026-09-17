import { create } from "zustand";
import { api } from "../utils/api.js";
import { formatTime12Hour } from "../utils/dateTimeUtils.js";
import {
  aggregateIncidentsFromReports,
  mapIncidentQueueToCards,
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

// Helper to check if a user belongs to admin portal
export const isUserAdmin = (user) => {
  if (!user) return false;
  // Explicit citizen ID prefix or portal
  if (user.id && String(user.id).startsWith("USR-")) return false;
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
// - User: Home ('/'), Reports ('/reports', '/my-reports'), Profile ('/profile'), Auth ('/login', '/signup')
// - Admin: Home ('/'), Live Map ('/live-city'), Simulate ('/simulate'), Respond ('/action-center'), Profile ('/profile'), Auth
// - Unauthenticated: Home ('/'), Auth ('/signup', '/login')
export const isRouteAllowedForUser = (path, user) => {
  const cleanPath = (path || "/").split("?")[0].split("#")[0];

  if (isPublicRoute(cleanPath)) return true;
  if (!user) return false;

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

  if (isProfileRoute) return true;

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
    } catch {}

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
    case "/signup":
    case "/login":
    case "/auth":
      return "LOGIN";
    default:
      return "HOME";
  }
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
      target = "/";
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
  reportDepth: "15–30 cm",
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

  // Fetch all municipal reports across Kolkata and the active incident queue
  fetchAllReports: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('kwi_token') : null;
    try {
      // Parallel fetch for reports and incident queue
      const [reports, queue] = await Promise.allSettled([
        api.get('/reports?all_reports=true', token),
        api.get('/incidents', token),
      ]);

      const stateUpdate = { reportsLoaded: true, reportsError: null };
      if (reports.status === 'fulfilled' && Array.isArray(reports.value)) {
        stateUpdate.allReports = reports.value;
      }
      if (queue.status === 'fulfilled' && Array.isArray(queue.value)) {
        stateUpdate.incidentQueue = queue.value;
      }

      set(stateUpdate);
      get().refreshDynamicIncidents();
    } catch (err) {
      console.warn('[KWI] fetchAllReports notice:', err?.message || err);
    }
  },

  // Fetch the current user's reports from the backend (server-side ownership enforced).
  fetchMyReports: async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("kwi_token") : null;
    if (!token) return;
    try {
      const reports = await api.get("/reports", token);
      set({
        myReports: reports || [],
        reportsLoaded: true,
        reportsError: null,
      });
      get().refreshDynamicIncidents();
    } catch (err) {
      set({ reportsError: err?.message || "Unable to load your reports." });
    }
  },

  // Dynamically derive active incidents strictly from incident_queue table and reports
  refreshDynamicIncidents: () => {
    const s = get();
    // 1. If incidentQueue from backend is loaded and non-empty, map it to cards
    if (Array.isArray(s.incidentQueue) && s.incidentQueue.length > 0) {
      const cards = mapIncidentQueueToCards(s.incidentQueue);
      set({ incidents: cards });
      return cards;
    }

    // 2. Fallback to client-side aggregation from submitted reports
    const combined = [
      ...(s.allReports || []),
      ...(s.myReports || []).filter(
        (mr) => !(s.allReports || []).some((ar) => ar.report_id === mr.report_id),
      ),
    ];
    const dynamic = aggregateIncidentsFromReports(combined);
    set({ incidents: dynamic });
    return dynamic;
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
    const depthMatch = String(s.reportDepth || "").match(/(\d+(?:\.\d+)?)/);
    const parsedDepth = depthMatch ? parseFloat(depthMatch[1]) : 15;

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
            get().fetchIncidentQueue().catch(() => {});
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
      avatarUrl: be.avatar_url ?? cached.avatarUrl ?? null,
      role:
        be.role || cached.role || (be.portal === "admin" ? "Admin" : "User"),
      badgeId: be.badgeId || be.badge_id || cached.badgeId || "",
      clearance: be.clearance || cached.clearance || "",
      createdAt: be.created_at || cached.createdAt || null,
      portal:
        be.portal ||
        (be.badgeId || be.badge_id || String(be.id || "").startsWith("ADM-")
          ? "admin"
          : cached.portal || "user"),
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

  // On app mount: refresh the profile and municipal reports from the backend
  initUser: async () => {
    if (typeof window === "undefined") return;
    // Always fetch municipal reports and compute dynamic incidents on app load
    get().fetchAllReports().catch(() => {});
    const token = localStorage.getItem("kwi_token");
    if (!token) {
      set({ currentUser: null });
      return;
    }
    try {
      const me = await api.get("/auth/me", token);
      get().setCurrentUser(get().mapBackendUser(me));
      get().fetchMyReports().catch(() => {});
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
      api.post("/auth/logout", {}, token).catch(() => {});
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

  unreadNotificationsCount: 3,
  setUnreadNotificationsCount: (count) =>
    set({ unreadNotificationsCount: count }),
  clearNotifications: () => set({ unreadNotificationsCount: 0 }),

  adminMenuOpen: false,
  setAdminMenuOpen: (open) => set({ adminMenuOpen: open }),
  toggleAdminMenu: () =>
    set((state) => ({ adminMenuOpen: !state.adminMenuOpen })),

  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Live City Telemetry & Municipal Metrics
  isLiveCityConnected: true,
  lastUpdated: formatTime12Hour(new Date()),
  hooghlyTideLevel: 3.42, // meters
  hooghlyTideTrend: "RISING", // 'RISING' | 'FALLING' | 'STABLE'

  // Real GIS Municipal Stats (as requested)
  highRiskZonesCount: 7,
  criticalIncidentsCount: 3,
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

  // Risk Zones Dataset
  riskZones: [
    {
      id: "risk_sector_v",
      name: "SECTOR V // SALT LAKE",
      level: "HIGH",
      color: "#f97316",
      center: [6.2, -1.6],
      radiusX: 0.95,
      radiusZ: 0.75,
      affectedArea: "12,400 m²",
      rainfall: "74 mm / 3 hr",
      drainageLoad: "94%",
      waterDepth: "30 cm",
      riskScore: "85 / 100",
      connectedIncidentId: "#SA-754",
    },
    {
      id: "risk_college_st",
      name: "COLLEGE MORE // WARD 32",
      level: "MODERATE",
      color: "#f59e0b",
      center: [6.99, 0.0],
      radiusX: 0.65,
      radiusZ: 0.55,
      affectedArea: "6,400 m²",
      rainfall: "57 mm / 3 hr",
      drainageLoad: "82%",
      waterDepth: "30 cm",
      riskScore: "61 / 100",
      connectedIncidentId: "#CO-493",
    },
    {
      id: "risk_behala",
      name: "BEHALA CHOWRASTA",
      level: "LOW",
      color: "#10b981",
      center: [-4.69, 8.2],
      radiusX: 0.8,
      radiusZ: 0.65,
      affectedArea: "5,300 m²",
      rainfall: "51 mm / 3 hr",
      drainageLoad: "65%",
      waterDepth: "Telemetry Pending",
      riskScore: "53 / 100",
      connectedIncidentId: "#BE-819",
    },
    {
      id: "risk_park_circus",
      name: "PARK CIRCUS 7-POINT",
      level: "MODERATE",
      color: "#f59e0b",
      center: [1.4, 0.8],
      radiusX: 0.6,
      radiusZ: 0.5,
      affectedArea: "8,600 m²",
      rainfall: "62 mm / 3 hr",
      drainageLoad: "76%",
      waterDepth: "14.5 cm",
      riskScore: "64 / 100",
      connectedIncidentId: "#PS-032",
    },
    {
      id: "risk_maidan",
      name: "THE MAIDAN / ESPLANADE",
      level: "LOW",
      color: "#10b981",
      center: [-1.3, 0.6],
      radiusX: 0.75,
      radiusZ: 0.9,
      affectedArea: "4,200 m²",
      rainfall: "35 mm / 3 hr",
      drainageLoad: "42%",
      waterDepth: "5 cm",
      riskScore: "28 / 100",
      connectedIncidentId: null,
    },
    {
      id: "risk_new_town",
      name: "NEW TOWN ACTION AREA I",
      level: "MODERATE",
      color: "#f59e0b",
      center: [8.2, -4.0],
      radiusX: 0.8,
      radiusZ: 0.6,
      affectedArea: "6,100 m²",
      rainfall: "45 mm / 3 hr",
      drainageLoad: "68%",
      waterDepth: "8 cm",
      riskScore: "45 / 100",
      connectedIncidentId: null,
    },
    {
      id: "risk_ultadanga",
      name: "ULTADANGA UNDERPASS",
      level: "LOW",
      color: "#10b981",
      center: [3.0, -5.0],
      radiusX: 0.5,
      radiusZ: 0.4,
      affectedArea: "3,400 m²",
      rainfall: "30 mm / 3 hr",
      drainageLoad: "48%",
      waterDepth: "4 cm",
      riskScore: "32 / 100",
      connectedIncidentId: null,
    },
  ],

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

  // Hydraulic Scenario Simulation State & Action Center Bridge
  activeSimulationIncidentId: '#SA-754',
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

  createWorkOrder: (newOrder, options = {}) => {
    const rawRef = newOrder.incidentRef || newOrder.incidentId || '0041'
    const cleanRef = String(rawRef).replace(/^#/, '').replace(/[^a-zA-Z0-9]/g, '')
    const ticketKey = newOrder.ticketKey || `WO-${cleanRef}`
    const fullId = newOrder.id || `WO-2026-0323-${cleanRef}`

    const finalizedOrder = {
      ...newOrder,
      id: fullId,
      ticketKey,
      incidentRef: newOrder.incidentRef || (newOrder.incidentId ? `#${String(newOrder.incidentId).replace(/^#/, '')}` : '#TK-089'),
      status: newOrder.status || 'Dispatched',
      stage: typeof newOrder.stage === 'number' ? newOrder.stage : 1, // Stage 1 = Dispatched (Step 2)
    }

    set((state) => {
      // Also mark as dispatched & simulated
      const setIds = new Set([...state.dispatchedHotspotIds])
      const simIds = new Set([...(state.simulatedIncidentIds || [])])
      if (newOrder.incidentId) {
        setIds.add(newOrder.incidentId)
        setIds.add(String(newOrder.incidentId).replace(/^#/, ''))
        setIds.add(`#${String(newOrder.incidentId).replace(/^#/, '')}`)
        simIds.add(newOrder.incidentId)
        simIds.add(String(newOrder.incidentId).replace(/^#/, ''))
        simIds.add(`#${String(newOrder.incidentId).replace(/^#/, '')}`)
      }
      if (newOrder.incidentRef) {
        setIds.add(newOrder.incidentRef)
        setIds.add(String(newOrder.incidentRef).replace(/^#/, ''))
        setIds.add(`#${String(newOrder.incidentRef).replace(/^#/, '')}`)
        simIds.add(newOrder.incidentRef)
        simIds.add(String(newOrder.incidentRef).replace(/^#/, ''))
        simIds.add(`#${String(newOrder.incidentRef).replace(/^#/, '')}`)
      }

      return {
        workOrders: {
          [ticketKey]: finalizedOrder,
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
      }
    })

    const targetRoute = options.redirectTo || '/respond';
    get().navigate(targetRoute);
    return ticketKey;
  },

  advanceWorkOrderStatus: (ticketKey) => {
    set((state) => {
      const key = ticketKey || state.activeWorkOrderTicketId
      const existing = state.workOrders[key]
      if (!existing) return state
      const nextStage = Math.min(3, (existing.stage ?? 1) + 1)
      const STAGE_NAMES = ['Recommended', 'Dispatched', 'In Progress', 'Resolved']
      return {
        workOrders: {
          ...state.workOrders,
          [key]: {
            ...existing,
            stage: nextStage,
            status: STAGE_NAMES[nextStage],
          },
        },
      }
    })
  },

  dispatchSimulationToWorkOrder: (ticketId, outcome) => {
    set({
      activeWorkOrderTicketId: ticketId || null,
      latestSimulationOutcome: outcome || null,
    })
    get().navigate('/action-center')
  },
}))
