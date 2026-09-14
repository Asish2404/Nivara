import * as THREE from 'three'

/**
 * Deterministic Geographic Data for Kolkata Metropolitan Area
 * Coordinates:
 *   X: West (negative) -> East (positive)
 *   Z: North (negative) -> South (positive)
 *   Y: Elevation (metres / scaled units)
 * Center (0, 0) corresponds to Central Kolkata (Esplanade / BBD Bagh ~22.57° N, 88.36° E)
 */

// 1. Hooghly River S-Curve centerline points from North (Dakshineswar) to South (Garden Reach / Batanagar)
export const HOOGHLY_RIVER_POINTS = [
  { x: -4.8, z: -8.5, width: 1.4 }, // Dakshineswar / Bally
  { x: -4.3, z: -7.0, width: 1.5 }, // Baranagar / Belur
  { x: -3.8, z: -5.2, width: 1.6 }, // Cossipore / Salkia
  { x: -3.3, z: -3.6, width: 1.5 }, // Bagbazar / Howrah North
  { x: -3.1, z: -2.2, width: 1.4 }, // Howrah Bridge (Rabindra Setu)
  { x: -3.3, z: -1.0, width: 1.6 }, // BBD Bagh / Fairlie / Howrah Station
  { x: -3.4, z: -0.5, width: 1.7 }, // Vidyasagar Setu (2nd Hooghly Bridge)
  { x: -3.9, z: +0.8, width: 1.8 }, // Prinsep Ghat / Hastings
  { x: -4.6, z: +2.2, width: 1.9 }, // Kidderpore / Shalimar
  { x: -5.4, z: +4.0, width: 2.1 }, // Garden Reach / Botanical Garden
  { x: -6.2, z: +6.0, width: 2.3 }, // Metiabruz
  { x: -6.8, z: +8.2, width: 2.5 }, // Batanagar / Pujali
]

// 2. Iconic Hooghly River Bridges
export const KOLKATA_BRIDGES = [
  {
    name: 'Howrah Bridge (Rabindra Setu)',
    start: [-3.8, 0.08, -2.2],
    end: [-2.4, 0.08, -2.2],
    width: 0.16,
    height: 0.28,
  },
  {
    name: 'Vidyasagar Setu (Second Hooghly Bridge)',
    start: [-4.2, 0.12, -0.5],
    end: [-2.5, 0.12, -0.5],
    width: 0.18,
    height: 0.34,
  },
]

// 3. Prominent Water Bodies & Lakes
export const WATER_BODIES = [
  {
    name: 'Rabindra Sarobar',
    center: [1.3, 3.6],
    radiusX: 1.1,
    radiusZ: 0.24,
    rotation: -0.15,
  },
  {
    name: 'Subhas Sarobar',
    center: [3.3, -0.6],
    radiusX: 0.45,
    radiusZ: 0.35,
    rotation: 0.2,
  },
  {
    name: 'Nalban Bhery',
    center: [5.8, -1.0],
    radiusX: 0.85,
    radiusZ: 0.6,
    rotation: 0.35,
  },
  {
    name: 'Central Park Lake',
    center: [4.8, -2.4],
    radiusX: 0.4,
    radiusZ: 0.3,
    rotation: 0.1,
  },
  {
    name: 'Eco Park Lake',
    center: [8.5, -4.5],
    radiusX: 1.2,
    radiusZ: 0.75,
    rotation: -0.2,
  },
]

// 4. East Kolkata Wetlands (Ramsar Conservation Site & Natural Drainage Sink)
export const WETLANDS_POLYGON = [
  { x: 4.8, z: 0.2 },
  { x: 6.8, z: 0.0 },
  { x: 9.2, z: 1.0 },
  { x: 9.6, z: 3.5 },
  { x: 8.8, z: 6.0 },
  { x: 6.5, z: 6.5 },
  { x: 4.5, z: 4.8 },
  { x: 4.2, z: 2.5 },
]

// 5. Municipal Drainage Canals (Khals)
export const DRAINAGE_CANALS = [
  // Circular Canal: Bagbazar to Palmer Bridge
  [
    [-3.0, -3.8],
    [-1.0, -3.6],
    [1.0, -3.2],
    [2.8, -2.0],
    [3.2, -0.8],
  ],
  // Bagjola Canal: Northern stormwater outlet to eastern basin
  [
    [-0.5, -6.5],
    [1.8, -6.2],
    [4.2, -5.8],
    [6.8, -5.2],
    [9.0, -4.8],
  ],
  // Adi Ganga (Tolly's Nullah): Hastings through Kalighat & Tollygunge
  [
    [-3.6, 1.2],
    [-2.2, 2.2],
    [-1.2, 3.4],
    [-0.2, 4.8],
    [0.8, 6.2],
  ],
  // Eastern Drainage Channel: Central Kolkata outfall into East Kolkata Wetlands
  [
    [1.6, 0.6],
    [2.8, 0.6],
    [4.5, 0.8],
    [6.5, 1.4],
  ],
]

// Deterministic Underground Drainage Trunk Conduits & Municipal Grid
export const DRAINAGE_TRUNK_CONDUITS = [
  // Sector V Main Trunk -> PS-07 -> Bagjola Canal
  [
    [6.4, -1.8],
    [6.0, -1.5],
    [5.6, -1.2], // PS-07
    [5.2, -2.8],
    [5.0, -4.5],
    [4.2, -5.8], // Connects to Bagjola
  ],
  // Central Kolkata / College Street Trunk -> Circular Canal
  [
    [-0.4, -2.2],
    [0.4, -2.4],
    [1.2, -2.6],
    [1.8, -3.0],
    [2.8, -2.0], // Circular Canal confluence
  ],
  // Camac Street & Park Street Box Drain -> Palmer Bridge (PS-02)
  [
    [0.2, 0.8],
    [0.8, 0.8],
    [1.4, 0.8],
    [1.8, 0.2], // PS-02 Palmer Bridge
    [2.8, 0.6], // Eastern Drainage Canal
  ],
  // Behala DH Road Trunk -> Mominpore Booster (PS-09) -> Keorapukur Khal
  [
    [-2.6, 5.2],
    [-2.6, 4.6],
    [-2.6, 4.2], // PS-09
    [-2.0, 3.2],
    [-1.2, 3.4], // Adi Ganga confluence
  ],
  // Ballygunge Circular Box Drain -> PS-04
  [
    [0.8, 2.6],
    [1.4, 2.7],
    [1.8, 2.8], // PS-04 Ballygunge
    [3.2, 2.4],
    [4.5, 2.0], // Wetlands outfall
  ],
]

// Drainage Junctions
export const DRAINAGE_JUNCTIONS = [
  { id: 'J-01', name: 'Bagbazar Sluice Gate', pos: [-3.0, 0.08, -3.8] },
  { id: 'J-02', name: 'Chingrighata Hydraulic Gate', pos: [3.4, 0.08, -1.5] },
  { id: 'J-03', name: 'Taratala Syphon Inflow', pos: [-2.2, 0.08, 2.0] },
  { id: 'J-04', name: 'Science City Siphon Junction', pos: [3.5, 0.08, 0.4] },
  { id: 'J-05', name: 'Palmer Bridge Outfall Gate', pos: [2.8, 0.08, 0.6] },
]

// 6. Hierarchical Road Network
export const PRIMARY_ROADS = [
  // Eastern Metropolitan Bypass (EM Bypass)
  [
    [3.0, -5.0],
    [3.2, -3.2],
    [3.4, -1.5],
    [3.5, 0.4],
    [3.6, 2.2],
    [3.7, 4.2],
    [3.7, 6.5],
  ],
  // Maa Flyover & AJC Bose Road
  [
    [-1.5, 0.5],
    [-0.2, 0.6],
    [1.4, 0.8],
    [2.5, 0.6],
    [3.5, 0.4],
  ],
  // Central Avenue (CR Avenue) & Chowringhee
  [
    [-0.6, -6.0],
    [-0.6, -4.0],
    [-0.6, -1.8],
    [-0.6, 0.0],
    [-0.6, 1.2],
    [-0.6, 2.4],
    [-0.6, 4.0],
  ],
  // Strand Road
  [
    [-2.8, -3.5],
    [-2.8, -1.8],
    [-3.0, 0.0],
    [-3.2, 1.2],
  ],
  // Diamond Harbour Road
  [
    [-2.2, 2.0],
    [-2.4, 3.5],
    [-2.6, 5.0],
    [-2.8, 6.8],
  ],
  // VIP Road / Biswa Bangla Sarani
  [
    [3.0, -5.0],
    [4.8, -4.8],
    [6.8, -4.2],
    [8.4, -4.2],
    [9.5, -4.0],
  ],
  // Sector V Connector
  [
    [3.4, -1.5],
    [5.0, -1.5],
    [6.4, -1.5],
    [7.5, -2.5],
  ],
]

export const SECONDARY_ROADS = [
  // Park Street
  [
    [-0.6, 0.8],
    [0.4, 0.8],
    [1.4, 0.8],
  ],
  // Rashbehari Avenue
  [
    [-1.0, 3.6],
    [0.4, 3.6],
    [1.8, 3.6],
    [3.6, 3.6],
  ],
  // Gariahat Road
  [
    [1.8, 1.8],
    [1.8, 3.6],
    [1.8, 5.2],
  ],
  // MG Road
  [
    [-2.8, -2.2],
    [-0.6, -2.2],
    [1.2, -2.2],
  ],
  // Belgharia Expressway
  [
    [-4.2, -8.0],
    [-1.0, -7.8],
    [2.5, -7.5],
  ],
  // Salt Lake 1st & 2nd Avenues
  [
    [3.6, -3.2],
    [5.4, -3.2],
    [6.2, -2.8],
  ],
  [
    [3.6, -2.2],
    [5.5, -2.2],
    [6.5, -2.0],
  ],
]

// 7. Green Reserves
export const GREEN_RESERVES = [
  {
    name: 'The Maidan',
    center: [-1.4, 0.6],
    size: [1.5, 2.2],
    rotation: 0.05,
    features: [
      { name: 'Victoria Memorial', pos: [-1.0, 0.06, 1.0], size: [0.32, 0.16, 0.28] },
      { name: 'Eden Gardens Stadium', pos: [-1.8, 0.06, -0.2], size: [0.45, 0.14, 0.45], round: true },
      { name: 'Racecourse Ground', pos: [-1.5, 0.04, 0.6], size: [0.8, 0.02, 1.2], round: true },
    ],
  },
  {
    name: 'Salt Lake Central Park',
    center: [4.7, -2.4],
    size: [0.9, 0.8],
    rotation: 0.0,
    features: [],
  },
  {
    name: 'Rabindra Sarobar Green Belt',
    center: [1.3, 3.6],
    size: [2.2, 0.6],
    rotation: -0.15,
    features: [],
  },
  {
    name: 'Eco Park Grounds',
    center: [8.5, -4.5],
    size: [2.0, 1.5],
    rotation: -0.1,
    features: [],
  },
]

// 8. Key Districts
export const DISTRICT_TARGETS = [
  {
    id: 'central',
    name: 'Central Kolkata',
    tag: 'ESPLANADE / BBD BAGH',
    coords: [0.0, 0.0],
    cameraPos: [-0.8, 4.2, 5.0],
    lookAt: [0.0, 0.0, 0.0],
    description: 'Dense historical civic core, BBD Bagh colonial architecture & The Maidan.',
  },
  {
    id: 'sector_v',
    name: 'Salt Lake Sector V',
    tag: 'IT HUB / LOW GRADIENT',
    coords: [6.2, -1.6],
    cameraPos: [4.8, 3.2, 1.5],
    lookAt: [6.2, 0.0, -1.6],
    description: 'Modern planned IT campuses, commercial glass towers & active drainage risk.',
  },
  {
    id: 'hooghly',
    name: 'Hooghly River & Bridges',
    tag: 'WESTERN WATER ARTERY',
    coords: [-3.3, -1.2],
    cameraPos: [-4.8, 3.8, 1.8],
    lookAt: [-3.3, 0.0, -1.2],
    description: 'Major tidal waterway carrying 3.4m tide, Howrah Bridge and Vidyasagar Setu.',
  },
  {
    id: 'behala',
    name: 'Behala & Tollygunge',
    tag: 'SOUTH BASIN / RESIDENTIAL',
    coords: [-2.2, 4.5],
    cameraPos: [-1.2, 3.8, 7.2],
    lookAt: [-2.2, 0.0, 4.5],
    description: 'High-density mixed residential district draining to Keorapukur Khal.',
  },
  {
    id: 'new_town',
    name: 'New Town Rajarhat',
    tag: 'EASTERN PLANNED TOWNSHIP',
    coords: [8.2, -4.0],
    cameraPos: [6.8, 4.0, -1.5],
    lookAt: [8.2, 0.0, -4.0],
    description: 'Contemporary planned expansion, wide avenues and Eco Park reservoir basin.',
  },
]

// 9. Restrained Geographic Risk Zones (7 Zones with Semantic GIS Styling)
export const RISK_OVERLAY_ZONES = [
  {
    id: 'risk_sector_v',
    name: 'SECTOR V // SALT LAKE',
    level: 'HIGH',
    color: '#f97316', // Restrained Orange
    center: [6.2, -1.6],
    radiusX: 0.95,
    radiusZ: 0.75,
    affectedArea: '12,400 m²',
    rainfall: '74 mm / 3 hr',
    drainageLoad: '94%',
    waterDepth: '28 cm',
    riskScore: '82 / 100',
    connectedIncidentId: '#SV-024',
    cameraPos: [5.0, 2.6, 0.8],
    lookAt: [6.2, 0.1, -1.6],
  },
  {
    id: 'risk_college_st',
    name: 'THANTHANIA // COLLEGE STREET',
    level: 'CRITICAL',
    color: '#ef4444', // Restrained Crimson
    center: [-0.3, -2.4],
    radiusX: 0.65,
    radiusZ: 0.55,
    affectedArea: '9,800 m²',
    rainfall: '81 mm / 3 hr',
    drainageLoad: '98%',
    waterDepth: '28.4 cm',
    riskScore: '89 / 100',
    connectedIncidentId: 'INC-2026-089',
    cameraPos: [-0.8, 2.8, -0.6],
    lookAt: [-0.3, 0.1, -2.4],
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
    cameraPos: [-2.0, 3.2, 7.2],
    lookAt: [-2.5, 0.1, 5.0],
  },
  {
    id: 'risk_park_circus',
    name: 'PARK CIRCUS 7-POINT',
    level: 'MODERATE',
    color: '#f59e0b', // Restrained Amber
    center: [1.4, 0.8],
    radiusX: 0.6,
    radiusZ: 0.5,
    affectedArea: '8,600 m²',
    rainfall: '62 mm / 3 hr',
    drainageLoad: '76%',
    waterDepth: '14.5 cm',
    riskScore: '64 / 100',
    connectedIncidentId: '#PS-032',
    cameraPos: [1.0, 2.8, 2.6],
    lookAt: [1.4, 0.1, 0.8],
  },
  {
    id: 'risk_maidan',
    name: 'THE MAIDAN / ESPLANADE',
    level: 'LOW',
    color: '#10b981', // Restrained Emerald
    center: [-1.3, 0.6],
    radiusX: 0.75,
    radiusZ: 0.9,
    affectedArea: '4,200 m²',
    rainfall: '35 mm / 3 hr',
    drainageLoad: '42%',
    waterDepth: '5 cm',
    riskScore: '28 / 100',
    connectedIncidentId: null,
    cameraPos: [-1.8, 3.4, 2.6],
    lookAt: [-1.3, 0.1, 0.6],
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
    cameraPos: [7.2, 3.2, -2.2],
    lookAt: [8.2, 0.1, -4.0],
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
    cameraPos: [2.5, 3.0, -3.2],
    lookAt: [3.0, 0.1, -5.0],
  },
]

// 10. Active Municipal Incidents
export const ACTIVE_INCIDENTS_GEO = [
  {
    id: '#SA-754',
    name: 'Salt Lake, Sector V Incident #SA-754',
    location: 'Salt Lake, Sector V, Kolkata',
    subdivision: 'SALT LAKE / BIDHANNAGAR',
    level: 'HIGH RISK',
    position: [7.1, 0.25, -0.1],
    waterDepth: '30 cm water depth',
    rainfall: '75 mm / 3 hr',
    verifiedReports: 5,
    affectedArea: '9,700 m²',
    riskScore: '85 / 100',
    connectedDrainage: 'Sector V Main Trunk',
    nearestPump: 'PS-07',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'CRITICAL',
    isPrimary: true,
    cameraPos: [4.6, 2.4, 0.6],
    lookAt: [7.1, 0.2, -0.1],
  },
  {
    id: '#CO-493',
    name: 'College More Incident #CO-493',
    location: 'College More, Sector V, Ward 32 (Bidhannagar)',
    subdivision: 'COLLEGE MORE / WARD 32',
    level: 'MODERATE RISK',
    position: [6.99, 0.25, 0.0],
    waterDepth: '30 cm water depth',
    rainfall: '57 mm / 3 hr',
    verifiedReports: 2,
    affectedArea: '6,400 m²',
    riskScore: '61 / 100',
    connectedDrainage: 'Sector V Ring Road Drain',
    nearestPump: 'PS-07',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'MODERATE',
    isPrimary: false,
    cameraPos: [4.8, 2.5, 0.8],
    lookAt: [6.99, 0.2, 0.0],
  },
  {
    id: '#PA-451',
    name: 'Park Street Crossing Incident #PA-451',
    location: 'Park Street Crossing',
    subdivision: 'PARK STREET / CENTRAL',
    level: 'MODERATE RISK',
    position: [-2.19, 0.25, 3.09],
    waterDepth: '20 cm water depth',
    rainfall: '51 mm / 3 hr',
    verifiedReports: 1,
    affectedArea: '5,300 m²',
    riskScore: '53 / 100',
    connectedDrainage: 'Camac St Box Drain to Palmer Bridge',
    nearestPump: 'PS-02',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'MODERATE',
    isPrimary: false,
    cameraPos: [-1.2, 2.6, 4.2],
    lookAt: [-2.19, 0.2, 3.09],
  },
]

// Backward compatibility alias for hero
export const HERO_INCIDENT = ACTIVE_INCIDENTS_GEO[0]

// 11. Municipal Pumping Stations
export const PUMPING_STATIONS_GEO = [
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
    isPrimary: true,
    cameraPos: [4.4, 2.2, 0.4],
    lookAt: [5.6, 0.15, -1.2],
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
    isPrimary: false,
    cameraPos: [1.2, 2.2, 1.8],
    lookAt: [1.8, 0.15, 0.2],
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
    isPrimary: false,
    cameraPos: [1.2, 2.4, 4.2],
    lookAt: [1.8, 0.15, 2.8],
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
    isPrimary: false,
    cameraPos: [-2.0, 2.4, 5.6],
    lookAt: [-2.6, 0.15, 4.2],
  },
]

// 12. Spatial Forecast Isobar Contours
export const FORECAST_RADAR_CELLS = [
  { center: [3.5, 0.1, -1.0], radius: 3.6, intensity: '85 mm/hr', color: 'rgba(56, 189, 248, 0.18)' },
  { center: [5.2, 0.1, -1.8], radius: 2.2, intensity: '74 mm/hr', color: 'rgba(244, 63, 94, 0.22)' },
  { center: [-1.2, 0.1, 1.4], radius: 2.8, intensity: '60 mm/hr', color: 'rgba(245, 158, 11, 0.18)' },
]

// 13. Iconic Detailed 3D Landmarks of Kolkata
export const ICONIC_LANDMARKS_3D = [
  {
    type: 'the_42',
    name: 'The 42, Chowringhee',
    position: [-0.62, 0, 0.65],
    height: 5.8,
    width: 0.38,
    depth: 0.38,
  },
  {
    type: 'victoria_memorial',
    name: 'Victoria Memorial',
    position: [-1.0, 0, 1.0],
  },
  {
    type: 'eden_gardens',
    name: 'Eden Gardens Stadium',
    position: [-1.8, 0, -0.2],
  },
  {
    type: 'biswa_bangla_gate',
    name: 'Biswa Bangla Gate',
    position: [8.4, 0, -4.2],
  },
  {
    type: 'salt_lake_stadium',
    name: 'Salt Lake Stadium',
    position: [4.05, 0, -1.6],
  },
]

// 14. Deterministic Building Generator for Authentic Kolkata 3D Skyline
export function generateKolkataUrbanFabric() {
  const buildings = []

  let seed = 42
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  // Zone 1: Central Kolkata
  for (let i = 0; i < 1100; i++) {
    const x = -2.6 + pseudoRandom() * 3.6
    const z = -3.5 + pseudoRandom() * 4.8

    if (x < -2.4) continue
    if (x > -2.2 && x < -0.7 && z > -0.4 && z < 1.7) continue

    const isDalhousie = x > -2.0 && x < -1.0 && z > -1.8 && z < -0.6
    const isParkStreet = x > -0.8 && x < 0.6 && z > 0.4 && z < 1.0

    let height = 0.8 + pseudoRandom() * 1.8
    if (isDalhousie) height += 0.8 + pseudoRandom() * 1.4
    if (isParkStreet) height += 0.6 + pseudoRandom() * 1.2

    const sx = 0.16 + pseudoRandom() * 0.22
    const sz = 0.16 + pseudoRandom() * 0.22

    const rand = pseudoRandom()
    const colorType = rand > 0.75 ? 0 : rand > 0.5 ? 1 : rand > 0.25 ? 2 : 4

    buildings.push({
      x,
      z,
      y: height / 2,
      h: height,
      sx,
      sz,
      colorType,
      hasBeacon: height > 2.5 && pseudoRandom() > 0.6,
      zone: 'central',
    })
  }

  // Zone 2: Salt Lake
  for (let i = 0; i < 850; i++) {
    const x = 3.6 + pseudoRandom() * 2.6
    const z = -3.8 + pseudoRandom() * 2.8

    if (x > 4.2 && x < 5.2 && z > -2.8 && z < -1.9) continue
    if (x > 3.6 && x < 4.5 && z > -2.0 && z < -1.2) continue

    const height = 0.6 + pseudoRandom() * 1.3
    const sx = 0.18 + pseudoRandom() * 0.18
    const sz = 0.18 + pseudoRandom() * 0.18

    const rand = pseudoRandom()
    const colorType = rand > 0.6 ? 0 : rand > 0.3 ? 3 : 4

    buildings.push({
      x,
      z,
      y: height / 2,
      h: height,
      sx,
      sz,
      colorType,
      hasBeacon: false,
      zone: 'salt_lake',
    })
  }

  // Zone 3: Sector V (IT Hub)
  for (let i = 0; i < 480; i++) {
    const x = 5.8 + pseudoRandom() * 1.8
    const z = -2.6 + pseudoRandom() * 2.0

    const height = 1.6 + pseudoRandom() * 3.2
    const sx = 0.24 + pseudoRandom() * 0.32
    const sz = 0.24 + pseudoRandom() * 0.32

    const rand = pseudoRandom()
    const colorType = rand > 0.6 ? 1 : rand > 0.3 ? 2 : 4

    buildings.push({
      x,
      z,
      y: height / 2,
      h: height,
      sx,
      sz,
      colorType,
      hasBeacon: height > 3.2,
      zone: 'sector_v',
    })
  }

  // Zone 4: New Town
  for (let i = 0; i < 550; i++) {
    const x = 7.2 + pseudoRandom() * 2.8
    const z = -5.8 + pseudoRandom() * 3.2

    if (x > 7.6 && x < 9.4 && z > -5.2 && z < -3.8) continue
    if (x > 8.0 && x < 8.8 && z > -4.5 && z < -3.9) continue

    const height = 1.2 + pseudoRandom() * 2.8
    const sx = 0.25 + pseudoRandom() * 0.28
    const sz = 0.25 + pseudoRandom() * 0.28

    const rand = pseudoRandom()
    const colorType = rand > 0.65 ? 1 : rand > 0.35 ? 3 : 0

    buildings.push({
      x,
      z,
      y: height / 2,
      h: height,
      sx,
      sz,
      colorType,
      hasBeacon: height > 2.8,
      zone: 'new_town',
    })
  }

  // Zone 5: South Kolkata
  for (let i = 0; i < 1100; i++) {
    const x = -2.8 + pseudoRandom() * 5.8
    const z = 1.6 + pseudoRandom() * 5.6

    if (x < -4.2 && z > 3.0) continue
    if (x < -5.2) continue
    if (x > 0.4 && x < 2.2 && z > 3.2 && z < 4.0) continue

    const height = 0.7 + pseudoRandom() * 1.6
    const sx = 0.16 + pseudoRandom() * 0.2
    const sz = 0.16 + pseudoRandom() * 0.2

    const rand = pseudoRandom()
    const colorType = rand > 0.7 ? 0 : rand > 0.4 ? 4 : 2

    buildings.push({
      x,
      z,
      y: height / 2,
      h: height,
      sx,
      sz,
      colorType,
      hasBeacon: height > 2.0 && pseudoRandom() > 0.7,
      zone: 'south',
    })
  }

  // Zone 6: North Kolkata
  for (let i = 0; i < 650; i++) {
    const x = -2.6 + pseudoRandom() * 4.8
    const z = -7.5 + pseudoRandom() * 3.8

    if (x < -3.2 && z > -6.0) continue
    if (x < -4.0) continue

    const height = 0.7 + pseudoRandom() * 1.4
    const sx = 0.16 + pseudoRandom() * 0.2
    const sz = 0.16 + pseudoRandom() * 0.2

    const rand = pseudoRandom()
    const colorType = rand > 0.6 ? 0 : rand > 0.3 ? 4 : 3

    buildings.push({
      x,
      z,
      y: height / 2,
      h: height,
      sx,
      sz,
      colorType,
      hasBeacon: false,
      zone: 'north',
    })
  }

  return buildings
}
