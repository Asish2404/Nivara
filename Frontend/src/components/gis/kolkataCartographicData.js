/**
 * Authentic Cartographic & GIS Dataset for Kolkata Metropolitan Area
 * Real geographic coordinates projected onto a precision cartographic canvas:
 * Coordinates (km relative to Central Kolkata / Esplanade: ~22.57° N, 88.36° E):
 *   X: West (negative) -> East (positive)
 *   Y: North (negative) -> South (positive)  [Cartographic 2D convention: North is Top]
 */

// 1. Hooghly River Shoreline Polygons & Centerline (Authentic S-Curve from Dakshineswar to Batanagar)
export const HOOGHLY_RIVER = {
  centerline: [
    { x: -4.8, y: -12.5, width: 1.35, name: 'Dakshineswar / Bally' },
    { x: -4.4, y: -10.0, width: 1.45, name: 'Baranagar / Belur' },
    { x: -3.8, y: -7.5, width: 1.55, name: 'Cossipore / Salkia' },
    { x: -3.3, y: -5.0, width: 1.45, name: 'Bagbazar / Howrah North' },
    { x: -3.1, y: -3.0, width: 1.40, name: 'Howrah Bridge (Rabindra Setu)' },
    { x: -3.3, y: -1.5, width: 1.55, name: 'BBD Bagh / Fairlie / Howrah Stn' },
    { x: -3.5, y: -0.4, width: 1.65, name: 'Vidyasagar Setu (2nd Hooghly Bridge)' },
    { x: -4.0, y: 1.2, width: 1.75, name: 'Prinsep Ghat / Hastings' },
    { x: -4.7, y: 3.2, width: 1.90, name: 'Kidderpore / Shalimar' },
    { x: -5.5, y: 5.5, width: 2.10, name: 'Garden Reach / Botanical Garden' },
    { x: -6.4, y: 8.0, width: 2.30, name: 'Metiabruz' },
    { x: -7.2, y: 11.0, width: 2.50, name: 'Batanagar / Pujali' },
  ],

  bridges: [
    {
      id: 'howrah_bridge',
      name: 'Howrah Bridge (Rabindra Setu)',
      start: [-3.8, -3.0],
      end: [-2.4, -3.0],
      type: 'cantilever',
      pylons: [[-3.1, -3.0]],
    },
    {
      id: 'vidyasagar_setu',
      name: 'Vidyasagar Setu (2nd Hooghly Bridge)',
      start: [-4.3, -0.4],
      end: [-2.7, -0.4],
      type: 'cable_stayed',
      pylons: [[-3.8, -0.4], [-3.2, -0.4]],
    },
    {
      id: 'vivekananda_setu',
      name: 'Vivekananda Setu (Bally Bridge)',
      start: [-5.4, -12.5],
      end: [-4.2, -12.5],
      type: 'truss',
      pylons: [[-4.8, -12.5]],
    },
  ],

  ghats: [
    { name: 'Prinsep Ghat', x: -3.3, y: 0.8 },
    { name: 'Babu Ghat', x: -3.0, y: -1.2 },
    { name: 'Fairlie Ghat', x: -2.9, y: -2.2 },
    { name: 'Bagbazar Ghat', x: -3.1, y: -5.0 },
    { name: 'Shibpur Ghat', x: -4.2, y: 1.2 },
  ],
}

// 2. Green Reserves & Open Parkland Polygons
export const GREEN_RESERVES = [
  // The Maidan (Historic central green expanse between Strand Rd and Chowringhee)
  {
    id: 'maidan',
    name: 'The Maidan',
    polygon: [
      [-2.2, -1.8],
      [-0.8, -1.8],
      [-0.6, 2.2],
      [-1.8, 2.2],
      [-2.4, 0.4],
    ],
    features: [
      { name: 'Victoria Memorial', x: -1.0, y: 1.2 },
      { name: 'Eden Gardens Stadium', x: -1.8, y: -0.6 },
      { name: 'Royal Calcutta Turf Club (Racecourse)', x: -1.5, y: 0.8, radiusX: 0.7, radiusY: 0.45 },
      { name: 'Fort William', x: -2.0, y: 0.2 },
    ],
  },
  // East Kolkata Wetlands (Ramsar Ecological Conservation Sink)
  {
    id: 'wetlands',
    name: 'East Kolkata Wetlands',
    polygon: [
      [4.6, 0.2],
      [7.2, -0.2],
      [9.8, 1.2],
      [10.2, 4.5],
      [9.2, 7.5],
      [6.8, 8.0],
      [4.6, 5.8],
      [4.2, 3.0],
    ],
  },
  // Salt Lake Central Park
  {
    id: 'central_park',
    name: 'Salt Lake Central Park',
    polygon: [
      [4.2, -3.8],
      [5.4, -3.8],
      [5.4, -2.8],
      [4.2, -2.8],
    ],
  },
  // New Town Eco Park Grounds
  {
    id: 'eco_park',
    name: 'Eco Park Grounds',
    polygon: [
      [7.5, -6.5],
      [9.8, -6.5],
      [9.8, -4.5],
      [7.5, -4.5],
    ],
  },
  // Rabindra Sarobar Lake Perimeter Green
  {
    id: 'sarobar_green',
    name: 'Rabindra Sarobar Green Belt',
    polygon: [
      [0.2, 4.2],
      [2.6, 4.2],
      [2.6, 5.4],
      [0.2, 5.4],
    ],
  },
  // Shibpur Botanical Gardens (West Bank)
  {
    id: 'botanical_gardens',
    name: 'Acharya Jagadish Chandra Bose Botanical Garden',
    polygon: [
      [-6.5, 2.5],
      [-4.6, 2.5],
      [-4.6, 4.8],
      [-6.5, 4.8],
    ],
  },
]

// 3. Water Bodies & Natural Retention Basins
export const WATER_BODIES = [
  {
    id: 'rabindra_sarobar',
    name: 'Rabindra Sarobar',
    center: [1.4, 4.8],
    radiusX: 1.1,
    radiusY: 0.28,
    rotation: -0.15,
  },
  {
    id: 'subhas_sarobar',
    name: 'Subhas Sarobar',
    center: [3.3, -0.8],
    radiusX: 0.5,
    radiusY: 0.38,
    rotation: 0.15,
  },
  {
    id: 'nalban_bhery',
    name: 'Nalban Bhery',
    center: [5.8, -1.2],
    radiusX: 0.9,
    radiusY: 0.65,
    rotation: 0.3,
  },
  {
    id: 'central_park_lake',
    name: 'Central Park Lake',
    center: [4.8, -3.3],
    radiusX: 0.45,
    radiusY: 0.35,
    rotation: 0.05,
  },
  {
    id: 'eco_park_lake',
    name: 'Eco Park Lake',
    center: [8.6, -5.5],
    radiusX: 1.3,
    radiusY: 0.85,
    rotation: -0.15,
  },
  {
    id: 'lal_dighi',
    name: 'Lal Dighi (Tank Square)',
    center: [-0.6, -2.4],
    radiusX: 0.22,
    radiusY: 0.16,
    rotation: 0,
  },
]

// 4. Municipal Drainage Canals (Khals) with Directed Flow Paths
export const DRAINAGE_CANALS = [
  {
    id: 'circular_canal',
    name: 'Circular Canal',
    flowDirection: 'eastbound',
    points: [
      [-3.0, -5.0], // Bagbazar sluice
      [-1.0, -4.8],
      [1.0, -4.2],
      [2.8, -2.6],
      [3.2, -1.0], // Confluence at Palmer Bridge
    ],
  },
  {
    id: 'bagjola_canal',
    name: 'Bagjola Canal',
    flowDirection: 'eastbound',
    points: [
      [-0.5, -8.5],
      [1.8, -8.2],
      [4.2, -7.8],
      [6.8, -7.0],
      [9.5, -6.4],
      [11.5, -5.8],
    ],
  },
  {
    id: 'adi_ganga',
    name: 'Adi Ganga (Tolly’s Nullah)',
    flowDirection: 'southbound',
    points: [
      [-3.6, 1.6],  // Hastings outfall
      [-2.2, 3.0],  // Kalighat
      [-1.2, 4.5],  // Tollygunge
      [-0.2, 6.4],  // Kudghat
      [0.8, 8.2],   // Garia
    ],
  },
  {
    id: 'eastern_drainage_channel',
    name: 'Eastern Drainage Channel',
    flowDirection: 'eastbound',
    points: [
      [1.8, 0.8],
      [3.0, 0.8],
      [4.8, 1.2],
      [7.0, 2.0],
    ],
  },
  {
    id: 'keorapukur_khal',
    name: 'Keorapukur Khal',
    flowDirection: 'southbound',
    points: [
      [-2.6, 5.5],
      [-2.2, 6.8],
      [-1.4, 8.0],
      [0.0, 9.5],
    ],
  },
]

// 5. Underground Municipal Stormwater Trunk Conduits
export const DRAINAGE_TRUNK_CONDUITS = [
  {
    id: 'trunk_sector_v',
    name: 'Sector V Main Trunk Conduit',
    points: [
      [6.6, -2.4],
      [6.2, -2.0],
      [5.6, -1.6], // PS-07
      [5.2, -3.8],
      [4.8, -6.0],
      [4.2, -7.8], // Bagjola outfall
    ],
  },
  {
    id: 'trunk_park_st',
    name: 'Camac Street / Park Street Box Drain',
    points: [
      [0.2, 1.0],
      [0.8, 1.0],
      [1.4, 1.0],
      [1.8, 0.2], // PS-02 Palmer Bridge
      [3.0, 0.8], // Eastern Drainage Canal
    ],
  },
  {
    id: 'trunk_college_st',
    name: 'College Street Deep Sewer Trunk',
    points: [
      [-0.4, -3.0],
      [0.4, -3.2],
      [1.2, -3.5],
      [2.0, -4.0],
      [2.8, -2.6], // Circular Canal confluence
    ],
  },
  {
    id: 'trunk_behala',
    name: 'Diamond Harbour Rd Stormwater Trunk',
    points: [
      [-2.6, 7.0],
      [-2.6, 6.0],
      [-2.6, 5.5], // PS-09
      [-2.0, 4.2],
      [-1.2, 4.5], // Adi Ganga outfall
    ],
  },
  {
    id: 'trunk_ballygunge',
    name: 'Ballygunge Circular Box Drain',
    points: [
      [0.8, 3.5],
      [1.4, 3.6],
      [1.8, 3.8], // PS-04 Ballygunge
      [3.4, 3.2],
      [4.8, 2.8], // Wetlands outfall
    ],
  },
]

// 6. Hierarchical Road Network
export const ROAD_NETWORK = {
  primary: [
    {
      id: 'em_bypass',
      name: 'Eastern Metropolitan Bypass (EM Bypass)',
      points: [
        [3.0, -6.5],
        [3.2, -4.2],
        [3.4, -2.0],
        [3.5, 0.6],
        [3.6, 3.0],
        [3.7, 5.5],
        [3.8, 8.5],
      ],
    },
    {
      id: 'maa_flyover',
      name: 'Maa Flyover & AJC Bose Road Expressway',
      points: [
        [-1.5, 0.6],
        [-0.2, 0.8],
        [1.4, 1.0],
        [2.6, 0.8],
        [3.5, 0.6],
      ],
    },
    {
      id: 'central_avenue',
      name: 'Central Avenue (CR Avenue) & Chowringhee',
      points: [
        [-0.6, -8.0],
        [-0.6, -5.2],
        [-0.6, -2.4],
        [-0.6, 0.0],
        [-0.6, 1.6],
        [-0.6, 3.2],
        [-0.6, 5.2],
        [-0.6, 7.5],
      ],
    },
    {
      id: 'strand_road',
      name: 'Strand Road',
      points: [
        [-2.8, -4.5],
        [-2.8, -2.4],
        [-3.0, 0.0],
        [-3.2, 1.6],
      ],
    },
    {
      id: 'dh_road',
      name: 'Diamond Harbour Road',
      points: [
        [-2.2, 2.5],
        [-2.4, 4.5],
        [-2.6, 6.5],
        [-2.8, 9.0],
      ],
    },
    {
      id: 'vip_road',
      name: 'VIP Road & Biswa Bangla Sarani',
      points: [
        [3.0, -6.5],
        [5.0, -6.2],
        [7.0, -5.5],
        [8.6, -5.5],
        [10.0, -5.2],
      ],
    },
    {
      id: 'belgharia_expy',
      name: 'Belgharia Expressway',
      points: [
        [-5.4, -12.5],
        [-2.5, -12.2],
        [1.5, -11.8],
        [5.5, -11.5],
      ],
    },
    {
      id: 'sector_v_connector',
      name: 'Sector V Main Link Road',
      points: [
        [3.4, -2.0],
        [5.0, -2.0],
        [6.6, -2.0],
        [7.8, -3.2],
      ],
    },
  ],

  secondary: [
    {
      id: 'park_street',
      name: 'Park Street',
      points: [
        [-0.6, 1.0],
        [0.4, 1.0],
        [1.4, 1.0],
      ],
    },
    {
      id: 'rashbehari_ave',
      name: 'Rashbehari Avenue',
      points: [
        [-1.0, 4.8],
        [0.4, 4.8],
        [1.8, 4.8],
        [3.6, 4.8],
      ],
    },
    {
      id: 'gariahat_road',
      name: 'Gariahat Road',
      points: [
        [1.8, 2.4],
        [1.8, 4.8],
        [1.8, 7.0],
      ],
    },
    {
      id: 'mg_road',
      name: 'Mahatma Gandhi Road',
      points: [
        [-2.8, -3.0],
        [-0.6, -3.0],
        [1.2, -3.0],
      ],
    },
    {
      id: 'salt_lake_1st_ave',
      name: 'Salt Lake 1st Avenue',
      points: [
        [3.6, -4.2],
        [5.4, -4.2],
        [6.4, -3.6],
      ],
    },
    {
      id: 'salt_lake_2nd_ave',
      name: 'Salt Lake 2nd Avenue',
      points: [
        [3.6, -3.0],
        [5.5, -3.0],
        [6.6, -2.8],
      ],
    },
    {
      id: 'taratala_road',
      name: 'Taratala Road',
      points: [
        [-4.5, 3.2],
        [-3.2, 2.8],
        [-2.2, 2.5],
      ],
    },
  ],
}

// 7. Realistic Urban Neighborhood & Varied Parcel Blocks
export const NEIGHBORHOOD_BLOCKS = [
  {
    id: 'cbd_bbd_bagh',
    name: 'B.B.D. BAGH / DALHOUSIE',
    polygon: [
      [-2.6, -3.2],
      [-0.4, -3.2],
      [-0.4, -1.6],
      [-2.6, -1.6],
    ],
    density: 'high',
    subParcels: [
      { x: -2.3, y: -2.8, w: 0.5, h: 0.4 },
      { x: -1.6, y: -2.8, w: 0.6, h: 0.45 },
      { x: -0.9, y: -2.8, w: 0.4, h: 0.4 },
      { x: -2.3, y: -2.2, w: 0.5, h: 0.4 },
      { x: -1.5, y: -2.1, w: 0.5, h: 0.35 },
    ],
  },
  {
    id: 'college_street_ward',
    name: 'COLLEGE STREET & THANTHANIA',
    polygon: [
      [-0.4, -4.2],
      [1.4, -4.2],
      [1.4, -2.2],
      [-0.4, -2.2],
    ],
    density: 'dense_heritage',
    subParcels: [
      { x: -0.2, y: -3.8, w: 0.4, h: 0.4 },
      { x: 0.4, y: -3.8, w: 0.45, h: 0.35 },
      { x: 1.0, y: -3.7, w: 0.3, h: 0.4 },
      { x: 0.0, y: -3.0, w: 0.5, h: 0.45 },
      { x: 0.7, y: -3.0, w: 0.5, h: 0.4 },
    ],
  },
  {
    id: 'park_street_district',
    name: 'PARK STREET & CAMAC STREET',
    polygon: [
      [-0.4, 0.4],
      [1.6, 0.4],
      [1.6, 2.0],
      [-0.4, 2.0],
    ],
    density: 'commercial',
    subParcels: [
      { x: -0.2, y: 0.6, w: 0.45, h: 0.4 },
      { x: 0.4, y: 0.6, w: 0.5, h: 0.4 },
      { x: 1.0, y: 0.6, w: 0.45, h: 0.4 },
      { x: 0.0, y: 1.3, w: 0.55, h: 0.45 },
      { x: 0.8, y: 1.3, w: 0.6, h: 0.45 },
    ],
  },
  {
    id: 'ballygunge_district',
    name: 'BALLYGUNGE & GARIAHAT',
    polygon: [
      [0.6, 2.2],
      [3.0, 2.2],
      [3.0, 4.6],
      [0.6, 4.6],
    ],
    density: 'residential',
    subParcels: [
      { x: 0.9, y: 2.5, w: 0.6, h: 0.5 },
      { x: 1.8, y: 2.5, w: 0.7, h: 0.5 },
      { x: 0.9, y: 3.4, w: 0.6, h: 0.5 },
      { x: 1.8, y: 3.4, w: 0.8, h: 0.6 },
    ],
  },
  {
    id: 'alipore_district',
    name: 'ALIPORE & NEW ALIPORE',
    polygon: [
      [-2.2, 1.8],
      [-0.2, 1.8],
      [-0.2, 4.2],
      [-2.2, 4.2],
    ],
    density: 'residential_green',
    subParcels: [
      { x: -1.9, y: 2.1, w: 0.6, h: 0.6 },
      { x: -1.1, y: 2.2, w: 0.6, h: 0.5 },
      { x: -1.8, y: 3.1, w: 0.7, h: 0.6 },
      { x: -0.9, y: 3.1, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: 'behala_district',
    name: 'BEHALA & SAKHERBAZAR',
    polygon: [
      [-3.4, 4.5],
      [-1.2, 4.5],
      [-1.2, 8.2],
      [-3.4, 8.2],
    ],
    density: 'dense_residential',
    subParcels: [
      { x: -3.0, y: 5.0, w: 0.7, h: 0.6 },
      { x: -2.1, y: 5.0, w: 0.6, h: 0.5 },
      { x: -3.0, y: 6.2, w: 0.8, h: 0.7 },
      { x: -2.0, y: 6.2, w: 0.6, h: 0.6 },
      { x: -2.7, y: 7.2, w: 0.7, h: 0.6 },
    ],
  },
  {
    id: 'salt_lake_residential',
    name: 'SALT LAKE (BIDHANNAGAR)',
    polygon: [
      [3.6, -5.2],
      [6.4, -5.2],
      [6.4, -2.2],
      [3.6, -2.2],
    ],
    density: 'planned_sectors',
    subParcels: [
      { x: 3.9, y: -4.8, w: 0.8, h: 0.6 },
      { x: 5.0, y: -4.8, w: 0.9, h: 0.6 },
      { x: 3.9, y: -3.8, w: 0.8, h: 0.6 },
      { x: 5.0, y: -3.8, w: 0.9, h: 0.6 },
      { x: 3.9, y: -2.8, w: 0.8, h: 0.5 },
      { x: 5.0, y: -2.8, w: 0.9, h: 0.5 },
    ],
  },
  {
    id: 'sector_v_tech',
    name: 'SALT LAKE SECTOR V',
    polygon: [
      [5.6, -3.2],
      [7.6, -3.2],
      [7.6, -0.8],
      [5.6, -0.8],
    ],
    density: 'it_towers',
    subParcels: [
      { x: 5.9, y: -2.8, w: 0.6, h: 0.5 },
      { x: 6.7, y: -2.8, w: 0.65, h: 0.5 },
      { x: 5.9, y: -2.0, w: 0.6, h: 0.6 },
      { x: 6.7, y: -2.0, w: 0.65, h: 0.55 },
      { x: 6.0, y: -1.3, w: 0.8, h: 0.4 },
    ],
  },
  {
    id: 'new_town_township',
    name: 'NEW TOWN RAJARHAT',
    polygon: [
      [7.2, -7.5],
      [10.5, -7.5],
      [10.5, -3.2],
      [7.2, -3.2],
    ],
    density: 'contemporary_planned',
    subParcels: [
      { x: 7.6, y: -7.0, w: 0.9, h: 0.8 },
      { x: 8.8, y: -7.0, w: 1.0, h: 0.8 },
      { x: 7.6, y: -5.8, w: 0.9, h: 0.8 },
      { x: 8.8, y: -5.8, w: 1.0, h: 0.8 },
      { x: 7.6, y: -4.5, w: 0.9, h: 0.8 },
      { x: 8.8, y: -4.5, w: 1.0, h: 0.7 },
    ],
  },
]

// 8. Realistic Geographic Flood Depth Polygons (Depths based on ground elevation & drainage bottlenecks)
export const FLOOD_DEPTH_ZONES = [
  // Sector V Ring Road (Low Gradient Basin near Bagjola siphon)
  {
    id: 'flood_sector_v',
    district: 'SECTOR V',
    depthCategory: 'CRITICAL',
    depthCm: 28,
    fillColor: 'rgba(37, 99, 235, 0.28)',
    borderColor: '#dc2626',
    polygon: [
      [5.5, -2.7],
      [6.9, -2.7],
      [7.1, -1.4],
      [5.7, -1.4],
    ],
  },
  // Thanthania & College Street (Historic Depressed Inundation Sump)
  {
    id: 'flood_college_st',
    district: 'COLLEGE STREET',
    depthCategory: 'CRITICAL',
    depthCm: 28.4,
    fillColor: 'rgba(37, 99, 235, 0.28)',
    borderColor: '#dc2626',
    polygon: [
      [-0.8, -3.8],
      [0.5, -3.8],
      [0.4, -2.6],
      [-0.8, -2.6],
    ],
  },
  // Behala Chowrasta / DH Road
  {
    id: 'flood_behala',
    district: 'BEHALA',
    depthCategory: 'HIGH',
    depthCm: 19.8,
    fillColor: 'rgba(59, 130, 246, 0.22)',
    borderColor: '#d97706',
    polygon: [
      [-3.0, 5.5],
      [-1.8, 5.5],
      [-1.9, 7.5],
      [-3.0, 7.5],
    ],
  },
  // Park Circus 7-Point Sump
  {
    id: 'flood_park_circus',
    district: 'PARK CIRCUS',
    depthCategory: 'MODERATE',
    depthCm: 14.5,
    fillColor: 'rgba(96, 165, 250, 0.18)',
    borderColor: '#3b82f6',
    polygon: [
      [0.8, 0.5],
      [2.0, 0.5],
      [1.9, 1.6],
      [0.8, 1.6],
    ],
  },
]

// 9. Restrained Geographic Risk Catchment Zones (7 Zones)
export const RISK_ZONES = [
  {
    id: 'risk_sector_v',
    name: 'Sector V Catchment',
    districtName: 'SECTOR V / SALT LAKE',
    level: 'HIGH',
    severityColor: '#e07a38',
    center: [6.2, -2.0],
    polygon: [
      [5.4, -3.0],
      [7.4, -3.0],
      [7.4, -1.0],
      [5.4, -1.0],
    ],
    waterDepth: '28 cm',
    rainfall: '74 mm / 3 hr',
    drainageLoad: '94%',
    affectedArea: '12,400 m²',
    riskScore: '82 / 100',
    nearestPump: 'PS-07',
    connectedIncidentId: '#SV-024',
  },
  {
    id: 'risk_college_st',
    name: 'Thanthania & College St Basin',
    districtName: 'THANTHANIA / COLLEGE STREET',
    level: 'CRITICAL',
    severityColor: '#d64545',
    center: [-0.3, -3.2],
    polygon: [
      [-1.0, -4.0],
      [0.6, -4.0],
      [0.6, -2.4],
      [-1.0, -2.4],
    ],
    waterDepth: '28.4 cm',
    rainfall: '81 mm / 3 hr',
    drainageLoad: '98%',
    affectedArea: '9,800 m²',
    riskScore: '89 / 100',
    nearestPump: 'PS-01',
    connectedIncidentId: 'INC-2026-089',
  },
  {
    id: 'risk_behala',
    name: 'Behala Chowrasta Corridor',
    districtName: 'BEHALA CHOWRASTA',
    level: 'HIGH',
    severityColor: '#e07a38',
    center: [-2.5, 6.5],
    polygon: [
      [-3.2, 5.2],
      [-1.6, 5.2],
      [-1.6, 7.8],
      [-3.2, 7.8],
    ],
    waterDepth: '19.8 cm',
    rainfall: '68 mm / 3 hr',
    drainageLoad: '92%',
    affectedArea: '15,200 m²',
    riskScore: '78 / 100',
    nearestPump: 'PS-09',
    connectedIncidentId: '#BH-019',
  },
  {
    id: 'risk_park_circus',
    name: 'Park Circus 7-Point Basin',
    districtName: 'PARK CIRCUS 7-POINT',
    level: 'MODERATE',
    severityColor: '#d99b38',
    center: [1.4, 1.0],
    polygon: [
      [0.6, 0.2],
      [2.2, 0.2],
      [2.2, 1.8],
      [0.6, 1.8],
    ],
    waterDepth: '14.5 cm',
    rainfall: '62 mm / 3 hr',
    drainageLoad: '76%',
    affectedArea: '8,600 m²',
    riskScore: '64 / 100',
    nearestPump: 'PS-02',
    connectedIncidentId: '#PS-032',
  },
  {
    id: 'risk_maidan',
    name: 'The Maidan / Esplanade Runoff',
    districtName: 'THE MAIDAN / ESPLANADE',
    level: 'LOW',
    severityColor: '#4f9160',
    center: [-1.3, 0.8],
    polygon: [
      [-2.0, -0.4],
      [-0.6, -0.4],
      [-0.6, 1.8],
      [-2.0, 1.8],
    ],
    waterDepth: '5 cm',
    rainfall: '35 mm / 3 hr',
    drainageLoad: '42%',
    affectedArea: '4,200 m²',
    riskScore: '28 / 100',
    nearestPump: null,
    connectedIncidentId: null,
  },
  {
    id: 'risk_new_town',
    name: 'New Town Action Area I',
    districtName: 'NEW TOWN ACTION AREA I',
    level: 'MODERATE',
    severityColor: '#d99b38',
    center: [8.2, -5.2],
    polygon: [
      [7.2, -6.2],
      [9.2, -6.2],
      [9.2, -4.2],
      [7.2, -4.2],
    ],
    waterDepth: '8 cm',
    rainfall: '45 mm / 3 hr',
    drainageLoad: '68%',
    affectedArea: '6,100 m²',
    riskScore: '45 / 100',
    nearestPump: null,
    connectedIncidentId: null,
  },
  {
    id: 'risk_ultadanga',
    name: 'Ultadanga Underpass Basin',
    districtName: 'ULTADANGA UNDERPASS',
    level: 'LOW',
    severityColor: '#4f9160',
    center: [3.0, -6.5],
    polygon: [
      [2.2, -7.2],
      [3.8, -7.2],
      [3.8, -5.8],
      [2.2, -5.8],
    ],
    waterDepth: '4 cm',
    rainfall: '30 mm / 3 hr',
    drainageLoad: '48%',
    affectedArea: '3,400 m²',
    riskScore: '32 / 100',
    nearestPump: null,
    connectedIncidentId: null,
  },
]

// 10. Active Incidents (Connected Municipal Data Chain)
export const ACTIVE_INCIDENTS = [
  {
    id: '#SV-024',
    name: 'Sector V Incident #SV-024',
    subdivision: 'SECTOR V // SALT LAKE',
    location: 'College More & Ring Road, Salt Lake Sector V',
    x: 6.2,
    y: -2.0,
    timestamp: '10:42 AM',
    waterDepth: '28 cm',
    rainfall: '74 mm / 3 hr',
    verifiedReports: 18,
    affectedArea: '12,400 m²',
    riskScore: '82 / 100',
    connectedDrainage: 'Sector V Main Trunk',
    nearestPump: 'PS-07',
    probableCause: 'Rainfall exceeding local drainage capacity.',
    severity: 'HIGH',
    severityColor: '#d64545',
    status: 'Needs Intervention',
    workOrderId: 'WO-2026-0323-0041',
    isPrimary: true,
  },
  {
    id: '#BH-019',
    name: 'Behala Incident #BH-019',
    subdivision: 'BEHALA // SOUTH BASIN',
    location: 'Behala Chowrasta / Diamond Harbour Rd',
    x: -2.5,
    y: 6.5,
    timestamp: '10:55 AM',
    waterDepth: '19.8 cm',
    rainfall: '68 mm / 3 hr',
    verifiedReports: 14,
    affectedArea: '15,200 m²',
    riskScore: '78 / 100',
    connectedDrainage: 'Keorapukur Khal Outfall',
    nearestPump: 'PS-09',
    probableCause: 'Culvert blockage near Metro construction pier P-142.',
    severity: 'HIGH',
    severityColor: '#e07a38',
    status: 'Crew En Route',
    workOrderId: 'WO-2026-0323-0039',
    isPrimary: false,
  },
  {
    id: '#PS-032',
    name: 'Park Street Incident #PS-032',
    subdivision: 'PARK STREET // CENTRAL',
    location: 'Park Street & Chowringhee Intersection',
    x: 0.1,
    y: 1.0,
    timestamp: '11:07 AM',
    waterDepth: '14.5 cm',
    rainfall: '55 mm / 3 hr',
    verifiedReports: 9,
    affectedArea: '7,800 m²',
    riskScore: '64 / 100',
    connectedDrainage: 'Camac St Box Drain to Palmer Bridge',
    nearestPump: 'PS-02',
    probableCause: 'Grate clogging from surface stormwater debris.',
    severity: 'MODERATE',
    severityColor: '#d99b38',
    status: 'Monitoring',
    workOrderId: 'WO-2026-0323-0037',
    isPrimary: false,
  },
]

// 11. Municipal Pumping Stations
export const PUMPING_STATIONS = [
  {
    id: 'PS-07',
    name: 'PS-07 Sector V Booster Station',
    x: 5.6,
    y: -1.6,
    status: 'AT CAPACITY',
    capacity: '100%',
    pumpsRunning: '3/3',
    dischargeRate: '85 cusecs',
    connectedCanal: 'Bagjola Canal Outfall',
    ward: 'Sector V IT Corridor',
    isAtCapacity: true,
    isPrimary: true,
  },
  {
    id: 'PS-02',
    name: 'PS-02 Palmer Bridge Drainage Station',
    x: 1.8,
    y: 0.2,
    status: 'ACTIVE',
    capacity: '80%',
    pumpsRunning: '4/5',
    dischargeRate: '140 cusecs',
    connectedCanal: 'Palmer Bridge Outfall',
    ward: 'Borough VII',
    isAtCapacity: false,
    isPrimary: false,
  },
  {
    id: 'PS-04',
    name: 'PS-04 Ballygunge Drainage Station',
    x: 1.8,
    y: 3.8,
    status: 'AT CAPACITY',
    capacity: '100%',
    pumpsRunning: '3/3',
    dischargeRate: '120 cusecs',
    connectedCanal: 'Ballygunge Trunk Outfall',
    ward: 'Borough VIII',
    isAtCapacity: true,
    isPrimary: false,
  },
  {
    id: 'PS-09',
    name: 'PS-09 Mominpore / Behala Booster',
    x: -2.6,
    y: 5.5,
    status: 'ACTIVE',
    capacity: '75%',
    pumpsRunning: '3/4',
    dischargeRate: '95 cusecs',
    connectedCanal: 'Keorapukur Khal',
    ward: 'Borough XIII',
    isAtCapacity: false,
    isPrimary: false,
  },
]

// 12. Spatial Rainfall Precipitation Bands
export const SPATIAL_RAIN_CELLS = [
  {
    center: [3.5, -1.5],
    radiusX: 5.5,
    radiusY: 4.2,
    intensity: '74 mm / 3 hr',
    color: 'rgba(92, 148, 184, 0.18)',
  },
  {
    center: [5.8, -2.0],
    radiusX: 2.8,
    radiusY: 2.2,
    intensity: '85 mm / 3 hr',
    color: 'rgba(82, 138, 178, 0.24)',
  },
  {
    center: [-0.5, 2.0],
    radiusX: 3.8,
    radiusY: 3.2,
    intensity: '58 mm / 3 hr',
    color: 'rgba(92, 148, 184, 0.14)',
  },
]

// 13. Spatial 3-Hour Forecast Isobar Contours
export const FORECAST_ISOBARS = [
  { center: [3.5, -1.5], radius: 6.8, label: '40 mm' },
  { center: [3.5, -1.5], radius: 4.8, label: '60 mm' },
  { center: [5.2, -2.2], radius: 2.6, label: '80 mm' },
]

// 14. Geographic Districts for Smooth Camera Focusing
export const GEOGRAPHIC_DISTRICTS = [
  {
    id: 'central',
    name: 'Central Kolkata',
    tag: 'ESPLANADE / BBD BAGH',
    center: [-0.8, -1.0],
    zoom: 1.3,
  },
  {
    id: 'sector_v',
    name: 'Salt Lake Sector V',
    tag: 'IT HUB / LOW GRADIENT',
    center: [6.2, -2.0],
    zoom: 1.5,
  },
  {
    id: 'hooghly',
    name: 'Hooghly River',
    tag: 'WESTERN WATER ARTERY',
    center: [-3.4, -0.5],
    zoom: 1.2,
  },
  {
    id: 'behala',
    name: 'Behala',
    tag: 'SOUTH BASIN',
    center: [-2.5, 6.5],
    zoom: 1.3,
  },
  {
    id: 'new_town',
    name: 'New Town',
    tag: 'EASTERN EXPANSION',
    center: [8.5, -5.5],
    zoom: 1.2,
  },
]
