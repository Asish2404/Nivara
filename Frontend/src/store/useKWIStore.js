import { create } from 'zustand'

export const useKWIStore = create((set, get) => ({
  // Active Navigation Section: 'CITY' | 'INCIDENTS' | 'FORECAST' | 'SIMULATE' | 'REPORTS' | 'ACTIONS'
  activeSection: 'CITY',
  setActiveSection: (section) => set({ activeSection: section }),

  // UI state for drawers & menus
  askKolkataOpen: false,
  setAskKolkataOpen: (open) => set({ askKolkataOpen: open }),
  toggleAskKolkata: () => set((state) => ({ askKolkataOpen: !state.askKolkataOpen })),

  adminMenuOpen: false,
  setAdminMenuOpen: (open) => set({ adminMenuOpen: open }),
  toggleAdminMenu: () => set((state) => ({ adminMenuOpen: !state.adminMenuOpen })),

  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Live City Telemetry
  isLiveCityConnected: true,
  lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  hooghlyTideLevel: 3.42, // meters
  hooghlyTideTrend: 'RISING', // 'RISING' | 'FALLING' | 'STABLE'
  cityAvgRainfall: 42.8, // mm/hr
  activePumps: 78,
  totalPumps: 84,

  // Incidents Dataset
  incidents: [
    {
      id: 'INC-2026-089',
      ward: 'Ward 49',
      borough: 'Borough V',
      location: 'Thanthania Kali Bari & College St Intersection',
      waterLevelCm: 28.4,
      severity: 'CRITICAL',
      status: 'DISPATCHED',
      reportedAt: '12 mins ago',
      pumpStation: 'Thanthania Booster Pumping Station',
      pumpsRunning: 2,
      pumpsCapacity: 3,
      drainageCanal: 'Circular Canal',
      notes: 'High silt accumulation obstructing gravity outfall. Heavy vehicle traffic diverted.',
    },
    {
      id: 'INC-2026-091',
      ward: 'Ward 59',
      borough: 'Borough VII',
      location: 'Park Circus 7-Point Crossing & Suhrawardy Ave',
      waterLevelCm: 22.1,
      severity: 'CRITICAL',
      status: 'ACTIVE',
      reportedAt: '24 mins ago',
      pumpStation: 'Palmer Bridge Drainage Station',
      pumpsRunning: 4,
      pumpsCapacity: 5,
      drainageCanal: 'Palmer Bridge Outfall',
      notes: 'Submerged tram tracks. Secondary pump #4 initiated.',
    },
    {
      id: 'INC-2026-094',
      ward: 'Ward 122',
      borough: 'Borough XIII',
      location: 'Behala Chowrasta / Diamond Harbour Rd',
      waterLevelCm: 19.8,
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      reportedAt: '31 mins ago',
      pumpStation: 'Mominpore Pumping Station',
      pumpsRunning: 3,
      pumpsCapacity: 4,
      drainageCanal: 'Keorapukur Khal',
      notes: 'Culvert blockage near Metro construction pillar P-142.',
    },
    {
      id: 'INC-2026-078',
      ward: 'Ward 65',
      borough: 'Borough VII',
      location: 'Ballygunge Circular Road',
      waterLevelCm: 11.2,
      severity: 'WARNING',
      status: 'CONTROLLED',
      reportedAt: '45 mins ago',
      pumpStation: 'Ballygunge Drainage Pumping Station',
      pumpsRunning: 3,
      pumpsCapacity: 3,
      drainageCanal: 'Ballygunge Outfall',
      notes: 'Water receding at 2.5 cm/10min. Surface drains cleared.',
    },
    {
      id: 'INC-2026-062',
      ward: 'Ward 14',
      borough: 'Borough III',
      location: 'Ultadanga Underpass (VIP Road junction)',
      waterLevelCm: 4.5,
      severity: 'RESOLVED',
      status: 'RESOLVED',
      reportedAt: '1 hr ago',
      pumpStation: 'Ultadanga Heavy Pump Unit',
      pumpsRunning: 2,
      pumpsCapacity: 2,
      drainageCanal: 'Bagjola Canal',
      notes: 'Underpass traffic normal. Submersible pumps on standby.',
    },
  ],

  // Filter or resolve incident
  resolveIncident: (id) =>
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === id ? { ...inc, severity: 'RESOLVED', status: 'RESOLVED', waterLevelCm: 2.0 } : inc
      ),
    })),

  // Derived Critical Count
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
    
    // Simulate intelligent response based on query
    let reply = "Processing municipal GIS query for Kolkata Metropolitan Area..."
    const lower = text.toLowerCase()
    
    if (lower.includes('critical') || lower.includes('incident') || lower.includes('waterlog')) {
      reply = "There are currently 3 CRITICAL waterlogging incidents: Thanthania Kali Bari (Ward 49, 28.4cm), Park Circus 7-Point (Ward 59, 22.1cm), and Behala Chowrasta (Ward 122, 19.8cm). All booster stations are operating at 88% capacity."
    } else if (lower.includes('tide') || lower.includes('hooghly') || lower.includes('river') || lower.includes('sluice')) {
      reply = "Hooghly River tidal gauge at Princep Ghat reports 3.42m (RISING). Lock gates at Circular Canal and Palmer Bridge are currently throttled to prevent river backflow into city storm drains."
    } else if (lower.includes('pump') || lower.includes('palmer') || lower.includes('ballygunge')) {
      reply = "78 of 84 major KMC pumping units are active. Palmer Bridge station is running 4/5 pumps discharging 140 cusecs into the Eastern Drainage Canal."
    } else if (lower.includes('forecast') || lower.includes('rain')) {
      reply = "Monsoon squall band over Alipore & Central Kolkata is depositing 42.8 mm/hr. Intensity expected to peak between 14:30 and 16:00 IST before dissipating eastward towards Salt Lake."
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
