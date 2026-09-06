
import { create } from 'zustand'

// Helper to determine initial route safely
const getInitialRoute = () => {
  if (typeof window !== 'undefined') {
    const p = window.location.pathname
    if (
      p === '/live-city' ||
      p === '/incidents' ||
      p === '/forecast' ||
      p === '/simulate' ||
      p === '/reports' ||
      p === '/report' ||
      p === '/my-reports' ||
      p === '/action-center' ||
      p === '/respond' ||
      p === '/login' ||
      p === '/auth'
    ) {
      return p
    }
    return '/'
  }
  return '/'
}

const routeToSection = (path) => {
  switch (path) {
    case '/':
      return 'HOME'
    case '/live-city':
      return 'LIVE_MAP'
    case '/reports':
    case '/report':
      return 'REPORT'
    case '/my-reports':
      return 'MY_REPORTS'
    case '/incidents':
      return 'INTELLIGENCE'
    case '/forecast':
      return 'PREDICT'
    case '/simulate':
      return 'SIMULATE'
    case '/action-center':
    case '/respond':
      return 'RESPOND'
    case '/login':
    case '/auth':
      return 'LOGIN'
    default:
      return 'HOME'
  }
}

export const useKWIStore = create((set, get) => ({
  // Active Route & Section Navigation
  currentRoute: getInitialRoute(),
  activeSection: routeToSection(getInitialRoute()),
  
  navigate: (path) => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path)
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
    const section = routeToSection(path)
    set({ currentRoute: path, activeSection: section })
  },

  // Shared Mobile Report & Verification State (Stores original user input)
  reportPhoto: null,
  reportDescription: '',
  reportLocation: 'Salt Lake, Sector V, Kolkata',
  reportLocality: 'Salt Lake, Sector V',
  reportCity: 'Kolkata, West Bengal',
  reportCoords: { lat: 22.5735, lon: 88.4331, accuracy: 10 },
  reportDepth: '15–30 cm',
  reportTimestamp: 'Just now',
  isReportSubmitted: false,
  reportVerificationStage: 0, // 0 = idle, 1..5 = stages
  isReportVerified: false,

  setReportPhoto: (photo) => set({ reportPhoto: photo }),
  setReportDescription: (desc) => set({ reportDescription: desc }),
  setReportLocation: (loc) => set({ reportLocation: loc }),
  setReportLocality: (loc) => set({ reportLocality: loc }),
  setReportCity: (city) => set({ reportCity: city }),
  setReportCoords: (coords) => set({ reportCoords: coords }),
  setReportDepth: (depth) => set({ reportDepth: depth }),

  submitCitizenReport: () => {
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    set({
      isReportSubmitted: true,
      reportVerificationStage: 1,
      isReportVerified: false,
      reportTimestamp: now,
    })
    setTimeout(() => {
      set({ reportVerificationStage: 2 })
    }, 600)
    setTimeout(() => {
      set({ reportVerificationStage: 3 })
    }, 1200)
    setTimeout(() => {
      set({ reportVerificationStage: 4 })
    }, 1800)
    setTimeout(() => {
      set({ reportVerificationStage: 5, isReportVerified: true })
    }, 2400)
  },

  resetCitizenReport: () => {
    set({
      isReportSubmitted: false,
      reportVerificationStage: 0,
      isReportVerified: false,
      reportPhoto: null,
      reportDescription: '',
    })
  },

  setActiveSection: (section) => {
    const routeMap = {
      HOME: '/',
      LIVE_MAP: '/live-city',
      REPORT: '/reports',
      MY_REPORTS: '/my-reports',
      INTELLIGENCE: '/incidents',
      PREDICT: '/forecast',
      SIMULATE: '/simulate',
      RESPOND: '/action-center',
      LOGIN: '/login',
      // backward compatibility aliases
      CITY: '/live-city',
      INCIDENTS: '/incidents',
      FORECAST: '/forecast',
      REPORTS: '/reports',
      ACTIONS: '/action-center',
      AUTH: '/login',
    }
    const targetRoute = routeMap[section] || '/'
    if (typeof window !== 'undefined' && window.location.pathname !== targetRoute) {
      window.history.pushState({}, '', targetRoute)
    }
    set({ activeSection: section, currentRoute: targetRoute })
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
  mapMode: '3D', // '3D' | '2D'
  setMapMode: (mode) => set({ mapMode: mode }),
  toggleMapMode: () =>
    set((state) => ({ mapMode: state.mapMode === '3D' ? '2D' : '3D' })),

  zoomTrigger: 0,
  triggerZoomIn: () => set((state) => ({ zoomTrigger: state.zoomTrigger + 1 })),
  triggerZoomOut: () => set((state) => ({ zoomTrigger: state.zoomTrigger - 1 })),

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
  toggleAskKolkata: () => set((state) => ({ askKolkataOpen: !state.askKolkataOpen })),

  // Login & Authentication state
  isLoginModalOpen: false,
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
  toggleLoginModal: () => set((state) => ({ isLoginModalOpen: !state.isLoginModalOpen })),

  currentUser: typeof window !== 'undefined' && localStorage.getItem('kwi_user')
    ? JSON.parse(localStorage.getItem('kwi_user'))
    : null,

  loginUser: (userData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kwi_user', JSON.stringify(userData))
    }
    set({ currentUser: userData, isLoginModalOpen: false })
  },

  logoutUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kwi_user')
    }
    set({ currentUser: null })
  },

  adminMenuOpen: false,
  setAdminMenuOpen: (open) => set({ adminMenuOpen: open }),
  toggleAdminMenu: () => set((state) => ({ adminMenuOpen: !state.adminMenuOpen })),

  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Live City Telemetry & Municipal Metrics
  isLiveCityConnected: true,
  lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  hooghlyTideLevel: 3.42, // meters
  hooghlyTideTrend: 'RISING', // 'RISING' | 'FALLING' | 'STABLE'
  
  // Real GIS Municipal Stats (as requested)
  highRiskZonesCount: 7,
  criticalIncidentsCount: 3,
  rainfallDisplay: '74 mm / 3 hr',
  rainfallIntensity: 'HEAVY',
  pumpsAtCapacityCount: 2,
  activePumps: 78,
  totalPumps: 84,

  // Incidents Dataset
  incidents: [
    {
      id: '#SV-024',
      ward: 'Ward 31',
      borough: 'Bidhannagar MC',
      location: 'Sector V / Salt Lake (College More & Ring Rd)',
      waterLevel: '28 cm',
      waterLevelCm: 28.0,
      rainfall: '74 mm / 3 hr',
      verifiedReports: 18,
      affectedArea: '12,400 m²',
      riskScore: '82 / 100',
      connectedDrainage: 'Sector V Main Trunk',
      nearestPump: 'PS-07',
      probableCause: 'Rainfall exceeding local drainage capacity.',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      reportedAt: '12 mins ago',
      position: [6.2, 0.25, -1.6],
    },
    {
      id: '#BH-019',
      ward: 'Ward 122',
      borough: 'Borough XIII',
      location: 'Behala Chowrasta / Diamond Harbour Rd',
      waterLevel: '19.8 cm',
      waterLevelCm: 19.8,
      rainfall: '68 mm / 3 hr',
      verifiedReports: 14,
      affectedArea: '15,200 m²',
      riskScore: '78 / 100',
      connectedDrainage: 'Keorapukur Khal Outfall',
      nearestPump: 'PS-09',
      probableCause: 'Culvert blockage near Metro construction pier P-142.',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      reportedAt: '24 mins ago',
      position: [-2.5, 0.25, 5.0],
    },
    {
      id: '#PS-032',
      ward: 'Ward 63',
      borough: 'Borough VII',
      location: 'Park Street & Chowringhee Intersection',
      waterLevel: '14.5 cm',
      waterLevelCm: 14.5,
      rainfall: '55 mm / 3 hr',
      verifiedReports: 9,
      affectedArea: '7,800 m²',
      riskScore: '64 / 100',
      connectedDrainage: 'Camac St Box Drain to Palmer Bridge',
      nearestPump: 'PS-02',
      probableCause: 'Grate clogging from surface stormwater debris.',
      severity: 'MODERATE',
      status: 'ACTIVE',
      reportedAt: '38 mins ago',
      position: [0.1, 0.25, 0.8],
    },
    {
      id: 'INC-2026-089',
      ward: 'Ward 49',
      borough: 'Borough V',
      location: 'Thanthania Kali Bari & College St Intersection',
      waterLevel: '28.4 cm',
      waterLevelCm: 28.4,
      rainfall: '81 mm / 3 hr',
      verifiedReports: 22,
      affectedArea: '9,800 m²',
      riskScore: '89 / 100',
      connectedDrainage: 'Circular Canal Outfall',
      nearestPump: 'PS-01',
      probableCause: 'High silt accumulation obstructing gravity outfall.',
      severity: 'CRITICAL',
      status: 'ACTIVE',
      reportedAt: '15 mins ago',
      position: [-0.3, 0.25, -2.4],
    },
  ],

  // Pumping Stations
  pumpingStations: [
    {
      id: 'PS-07',
      name: 'PS-07 Sector V Booster Station',
      position: [5.6, 0.15, -1.2],
      status: 'AT CAPACITY',
      capacity: '100%',
      pumpsRunning: '3/3',
      dischargeRate: '85 cusecs',
      connectedCanal: 'Bagjola Canal Outfall',
      ward: 'Sector V IT Corridor',
      loadPct: 100,
      critical: true,
    },
    {
      id: 'PS-02',
      name: 'PS-02 Palmer Bridge Drainage Station',
      position: [1.8, 0.15, 0.2],
      status: 'ACTIVE',
      capacity: '80%',
      pumpsRunning: '4/5',
      dischargeRate: '140 cusecs',
      connectedCanal: 'Palmer Bridge Outfall',
      ward: 'Borough VII',
      loadPct: 80,
      critical: false,
    },
    {
      id: 'PS-04',
      name: 'PS-04 Ballygunge Drainage Station',
      position: [1.8, 0.15, 2.8],
      status: 'AT CAPACITY',
      capacity: '100%',
      pumpsRunning: '3/3',
      dischargeRate: '120 cusecs',
      connectedCanal: 'Ballygunge Trunk Outfall',
      ward: 'Borough VIII',
      loadPct: 100,
      critical: true,
    },
    {
      id: 'PS-09',
      name: 'PS-09 Mominpore / Behala Booster',
      position: [-2.6, 0.15, 4.2],
      status: 'ACTIVE',
      capacity: '75%',
      pumpsRunning: '3/4',
      dischargeRate: '95 cusecs',
      connectedCanal: 'Keorapukur Khal',
      ward: 'Borough XIII',
      loadPct: 75,
      critical: false,
    },
  ],

  // Risk Zones Dataset
  riskZones: [
    {
      id: 'risk_sector_v',
      name: 'SECTOR V // SALT LAKE',
      level: 'HIGH',
      color: '#f97316',
      center: [6.2, -1.6],
      radiusX: 0.95,
      radiusZ: 0.75,
      affectedArea: '12,400 m²',
      rainfall: '74 mm / 3 hr',
      drainageLoad: '94%',
      waterDepth: '28 cm',
      riskScore: '82 / 100',
      connectedIncidentId: '#SV-024',
    },
    {
      id: 'risk_college_st',
      name: 'THANTHANIA // COLLEGE STREET',
      level: 'CRITICAL',
      color: '#ef4444',
      center: [-0.3, -2.4],
      radiusX: 0.65,
      radiusZ: 0.55,
      affectedArea: '9,800 m²',
      rainfall: '81 mm / 3 hr',
      drainageLoad: '98%',
      waterDepth: '28.4 cm',
      riskScore: '89 / 100',
      connectedIncidentId: 'INC-2026-089',
    },
    {
      id: 'risk_behala',
      name: 'BEHALA CHOWRASTA',
      level: 'HIGH',
      color: '#f97316',
      center: [-2.5, 5.0],
      radiusX: 0.8,
      radiusZ: 0.65,
      affectedArea: '15,200 m²',
      rainfall: '68 mm / 3 hr',
      drainageLoad: '92%',
      waterDepth: '19.8 cm',
      riskScore: '78 / 100',
      connectedIncidentId: '#BH-019',
    },
    {
      id: 'risk_park_circus',
      name: 'PARK CIRCUS 7-POINT',
      level: 'MODERATE',
      color: '#f59e0b',
      center: [1.4, 0.8],
      radiusX: 0.6,
      radiusZ: 0.5,
      affectedArea: '8,600 m²',
      rainfall: '62 mm / 3 hr',
      drainageLoad: '76%',
      waterDepth: '14.5 cm',
      riskScore: '64 / 100',
      connectedIncidentId: '#PS-032',
    },
    {
      id: 'risk_maidan',
      name: 'THE MAIDAN / ESPLANADE',
      level: 'LOW',
      color: '#10b981',
      center: [-1.3, 0.6],
      radiusX: 0.75,
      radiusZ: 0.9,
      affectedArea: '4,200 m²',
      rainfall: '35 mm / 3 hr',
      drainageLoad: '42%',
      waterDepth: '5 cm',
      riskScore: '28 / 100',
      connectedIncidentId: null,
    },
    {
      id: 'risk_new_town',
      name: 'NEW TOWN ACTION AREA I',
      level: 'MODERATE',
      color: '#f59e0b',
      center: [8.2, -4.0],
      radiusX: 0.8,
      radiusZ: 0.6,
      affectedArea: '6,100 m²',
      rainfall: '45 mm / 3 hr',
      drainageLoad: '68%',
      waterDepth: '8 cm',
      riskScore: '45 / 100',
      connectedIncidentId: null,
    },
    {
      id: 'risk_ultadanga',
      name: 'ULTADANGA UNDERPASS',
      level: 'LOW',
      color: '#10b981',
      center: [3.0, -5.0],
      radiusX: 0.5,
      radiusZ: 0.4,
      affectedArea: '3,400 m²',
      rainfall: '30 mm / 3 hr',
      drainageLoad: '48%',
      waterDepth: '4 cm',
      riskScore: '32 / 100',
      connectedIncidentId: null,
    },
  ],

  // Incident filter/resolution
  resolveIncident: (id) =>
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === id ? { ...inc, severity: 'RESOLVED', status: 'RESOLVED', waterLevel: '2.0 cm' } : inc
      ),
    })),

  getCriticalCount: () => {
    return get().incidents.filter((inc) => inc.severity === 'CRITICAL').length
  },

  // Copilot Ask Kolkata state
  copilotQuery: '',
  setCopilotQuery: (q) => set({ copilotQuery: q }),
  chatMessages: [
    {
      sender: 'system',
      text: 'Kolkata Water Intelligence Copilot online. Telemetry synchronized with KMC Drainage Department, Hooghly River Sluice Grid, and 84 municipal pumping stations.',
      timestamp: '13:00',
    },
  ],
  sendCopilotMessage: (text) => {
    if (!text.trim()) return
    const userMsg = { sender: 'user', text, timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }
    
    let reply = "Processing municipal GIS query for Kolkata Metropolitan Area..."
    const lower = text.toLowerCase()
    
    if (lower.includes('sector v') || lower.includes('sv-024') || lower.includes('ps-07')) {
      reply = "Sector V Incident #SV-024: 28cm water depth at College More. 74 mm/3 hr rainfall recorded. PS-07 booster station operating at 100% capacity discharging 85 cusecs into Bagjola Canal."
    } else if (lower.includes('critical') || lower.includes('incident') || lower.includes('waterlog')) {
      reply = "There are currently 3 CRITICAL waterlogging incidents: Sector V (#SV-024, 28cm), Thanthania Kali Bari (Ward 49, 28.4cm), and Behala Chowrasta (#BH-019, 19.8cm). 2 pump stations (PS-07 and PS-04) are running at 100% capacity."
    } else if (lower.includes('tide') || lower.includes('hooghly') || lower.includes('river') || lower.includes('sluice')) {
      reply = "Hooghly River tidal gauge at Princep Ghat reports 3.42m (RISING). Lock gates at Circular Canal and Palmer Bridge are currently throttled to prevent river backflow into city storm drains."
    } else if (lower.includes('pump') || lower.includes('palmer') || lower.includes('ballygunge')) {
      reply = "78 of 84 major KMC pumping units are active. PS-07 and PS-04 are at 100% capacity. Palmer Bridge is running 4/5 pumps discharging 140 cusecs."
    } else if (lower.includes('forecast') || lower.includes('rain')) {
      reply = "Monsoon squall band over Alipore & Central Kolkata is depositing 74 mm / 3 hr. Intensity is HEAVY, with high runoff entering Sector V Main Trunk and Circular Canal."
    } else {
      reply = `Telemetry check for "${text}": All sensor networks in Boroughs I through XVI are transmitting valid hydraulic pressure and depth data.`
    }

    const botMsg = { sender: 'bot', text: reply, timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg, botMsg],
      copilotQuery: '',
    }))
  },
}))
