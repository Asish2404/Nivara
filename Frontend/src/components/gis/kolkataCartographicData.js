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
    id: '#SA-754',
    connectedIncidentId: 'SA-754',
    name: 'Salt Lake, Sector V Incident #SA-754',
    subdivision: 'SALT LAKE // BIDHANNAGAR',
    location: 'Salt Lake, Sector V, Kolkata',
    latitude: 22.5735,
    longitude: 88.4331,
    x: 7.1,
    y: -0.1,
    timestamp: 'Logged via Citizen Mobile',
    waterDepth: '30 cm water depth',
    waterLevel: '30 cm',
    waterLevelCm: 30.0,
    rainfall: '75 mm / 3 hr',
    verifiedReports: 5,
    affectedArea: '9,700 m²',
    riskScore: '85 / 100',
    connectedDrainage: 'Sector V Main Trunk',
    nearestPump: 'PS-07',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'CRITICAL',
    severityColor: '#d64545',
    status: 'Needs Intervention',
    workOrderId: 'WO-2026-SA-754',
    isPrimary: true,
  },
  {
    id: '#CO-493',
    connectedIncidentId: 'CO-493',
    name: 'College More Incident #CO-493',
    subdivision: 'COLLEGE MORE // WARD 32',
    location: 'College More, Sector V, Ward 32 (Bidhannagar)',
    latitude: 22.5726,
    longitude: 88.4320,
    x: 6.99,
    y: 0.0,
    timestamp: 'Logged via Citizen Mobile',
    waterDepth: '30 cm water depth',
    waterLevel: '30 cm',
    waterLevelCm: 30.0,
    rainfall: '57 mm / 3 hr',
    verifiedReports: 2,
    affectedArea: '6,400 m²',
    riskScore: '61 / 100',
    connectedDrainage: 'Sector V Ring Road Drain',
    nearestPump: 'PS-07',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'MODERATE',
    severityColor: '#d99b38',
    status: 'Needs Intervention',
    workOrderId: 'WO-2026-CO-493',
    isPrimary: false,
  },
  {
    id: '#BA-543',
    connectedIncidentId: 'BA-543',
    name: 'Bagmari Manicktala Incident #BA-543',
    subdivision: 'BAGMARI // LOCAL DRAINAGE',
    location: 'Bagmari Manicktala Higher Secondary School,  Bagmari Lane, BRS-10',
    latitude: 22.5814,
    longitude: 88.3928,
    x: 2.96,
    y: -0.98,
    timestamp: 'Logged via Citizen Mobile',
    waterDepth: '30 cm water depth',
    waterLevel: '30 cm',
    waterLevelCm: 30.0,
    rainfall: '51 mm / 3 hr',
    verifiedReports: 1,
    affectedArea: '5,300 m²',
    riskScore: '53 / 100',
    connectedDrainage: 'Circular Canal Outfall',
    nearestPump: 'PS-02',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'MODERATE',
    severityColor: '#d99b38',
    status: 'Needs Intervention',
    workOrderId: 'WO-2026-BA-543',
    isPrimary: false,
  },
  {
    id: '#PA-451',
    connectedIncidentId: 'PA-451',
    name: 'Park Street Crossing Incident #PA-451',
    subdivision: 'PARK STREET // CENTRAL',
    location: 'Park Street Crossing',
    latitude: 22.5448,
    longitude: 88.3426,
    x: -2.19,
    y: 3.09,
    timestamp: 'Logged via Citizen Mobile',
    waterDepth: '20 cm water depth',
    waterLevel: '20 cm',
    waterLevelCm: 20.0,
    rainfall: '51 mm / 3 hr',
    verifiedReports: 1,
    affectedArea: '5,300 m²',
    riskScore: '53 / 100',
    connectedDrainage: 'Camac St Box Drain to Palmer Bridge',
    nearestPump: 'PS-02',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'MODERATE',
    severityColor: '#d99b38',
    status: 'Monitoring',
    workOrderId: 'WO-2026-PA-451',
    isPrimary: false,
  },
  {
    id: '#MA-979',
    connectedIncidentId: 'MA-979',
    name: 'Maniktala Incident #MA-979',
    subdivision: 'MANIKTALA // NORTH CENTRAL',
    location: 'Maniktala, Kolkata',
    latitude: 22.5884,
    longitude: 88.3836,
    x: 2.02,
    y: -1.76,
    timestamp: 'Logged via Citizen Mobile',
    waterDepth: '15 cm water depth',
    waterLevel: '15 cm',
    waterLevelCm: 15.0,
    rainfall: '57 mm / 3 hr',
    verifiedReports: 2,
    affectedArea: '6,400 m²',
    riskScore: '61 / 100',
    connectedDrainage: 'Circular Canal Outfall',
    nearestPump: 'PS-02',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'MODERATE',
    severityColor: '#d99b38',
    status: 'Monitoring',
    workOrderId: 'WO-2026-MA-979',
    isPrimary: false,
  },
  {
    id: '#TE-891',
    connectedIncidentId: 'TE-891',
    name: 'Techno India University Incident #TE-891',
    subdivision: 'TECHNO INDIA // SALT LAKE',
    location: 'Techno India University, Kolkata',
    latitude: 22.5760,
    longitude: 88.4284,
    x: 6.62,
    y: -0.38,
    timestamp: 'Logged via Citizen Mobile',
    waterDepth: 'Telemetry Pending',
    waterLevel: '15 cm',
    waterLevelCm: 15.0,
    rainfall: '57 mm / 3 hr',
    verifiedReports: 2,
    affectedArea: '6,400 m²',
    riskScore: '61 / 100',
    connectedDrainage: 'Sector V Main Trunk',
    nearestPump: 'PS-07',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'MODERATE',
    severityColor: '#d99b38',
    status: 'Monitoring',
    workOrderId: 'WO-2026-TE-891',
    isPrimary: false,
  },
  {
    id: '#HO-541',
    connectedIncidentId: 'HO-541',
    name: 'Howrah Station Incident #HO-541',
    subdivision: 'HOWRAH // RIVERFRONT',
    location: 'Howrah Station / Bridge, Howrah Municipal Area',
    latitude: 22.5851,
    longitude: 88.3426,
    x: -2.19,
    y: -1.39,
    timestamp: 'Logged via Citizen Mobile',
    waterDepth: '15 cm water depth',
    waterLevel: '15 cm',
    waterLevelCm: 15.0,
    rainfall: '51 mm / 3 hr',
    verifiedReports: 1,
    affectedArea: '5,300 m²',
    riskScore: '53 / 100',
    connectedDrainage: 'Riverfront Culvert Network',
    nearestPump: 'PS-02',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'LOW',
    severityColor: '#10b981',
    status: 'Monitoring',
    workOrderId: 'WO-2026-HO-541',
    isPrimary: false,
  },
  {
    id: '#BA-798',
    connectedIncidentId: 'BA-798',
    name: 'Barasat Incident #BA-798',
    subdivision: 'BARASAT // NORTH METRO',
    location: 'Barasat,  Kolkata Metropolitan Area, Barasat - I',
    latitude: 22.7191,
    longitude: 88.4826,
    x: 12.18,
    y: -16.29,
    timestamp: 'Logged via Citizen Mobile',
    waterDepth: '15 cm water depth',
    waterLevel: '15 cm',
    waterLevelCm: 15.0,
    rainfall: '51 mm / 3 hr',
    verifiedReports: 1,
    affectedArea: '5,300 m²',
    riskScore: '53 / 100',
    connectedDrainage: 'Barasat Municipal Trunk',
    nearestPump: 'PS-07',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'LOW',
    severityColor: '#10b981',
    status: 'Monitoring',
    workOrderId: 'WO-2026-BA-798',
    isPrimary: false,
  },
  {
    id: '#GA-697',
    connectedIncidentId: 'GA-697',
    name: 'Gariahat Crossing Incident #GA-697',
    subdivision: 'GARIAHAT // BOROUGH VIII',
    location: 'Gariahat Crossing, Ward 85, Borough VIII',
    latitude: 22.5195,
    longitude: 88.3653,
    x: 0.14,
    y: 5.9,
    timestamp: 'Logged via Citizen Mobile',
    waterDepth: '15 cm water depth',
    waterLevel: '15 cm',
    waterLevelCm: 15.0,
    rainfall: '51 mm / 3 hr',
    verifiedReports: 1,
    affectedArea: '5,300 m²',
    riskScore: '53 / 100',
    connectedDrainage: 'Ballygunge Trunk Outfall',
    nearestPump: 'PS-04',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'LOW',
    severityColor: '#10b981',
    status: 'Monitoring',
    workOrderId: 'WO-2026-GA-697',
    isPrimary: false,
  },
  {
    id: '#SA-630',
    connectedIncidentId: 'SA-630',
    name: 'Salt Lake Sector III Incident #SA-630',
    subdivision: 'SALT LAKE // SECTOR III',
    location: 'Salt Lake Sector III',
    latitude: 22.5848,
    longitude: 88.4066,
    x: 4.38,
    y: -1.36,
    timestamp: 'Logged via Citizen Mobile',
    waterDepth: '15 cm water depth',
    waterLevel: '15 cm',
    waterLevelCm: 15.0,
    rainfall: '51 mm / 3 hr',
    verifiedReports: 1,
    affectedArea: '5,300 m²',
    riskScore: '53 / 100',
    connectedDrainage: 'Sector III Stormwater Channel',
    nearestPump: 'PS-07',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'LOW',
    severityColor: '#10b981',
    status: 'Monitoring',
    workOrderId: 'WO-2026-SA-630',
    isPrimary: false,
  },
  {
    id: '#BE-819',
    connectedIncidentId: 'BE-819',
    name: 'Behala Chowrasta Incident #BE-819',
    subdivision: 'BEHALA // BOROUGH XIV',
    location: 'Behala Chowrasta, Ward 128, Borough XIV',
    latitude: 22.4988,
    longitude: 88.3182,
    x: -4.69,
    y: 8.2,
    timestamp: 'Logged via Citizen Mobile',
    waterDepth: 'Telemetry Pending',
    waterLevel: '15 cm',
    waterLevelCm: 15.0,
    rainfall: '51 mm / 3 hr',
    verifiedReports: 1,
    affectedArea: '5,300 m²',
    riskScore: '53 / 100',
    connectedDrainage: 'Keorapukur Khal Outfall',
    nearestPump: 'PS-09',
    probableCause: 'Verified citizen ground reports indicating active surface inundation.',
    severity: 'LOW',
    severityColor: '#10b981',
    status: 'Monitoring',
    workOrderId: 'WO-2026-BE-819',
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

// ==========================================
// WGS84 GeoJSON Spatial Converters (RFC 7946)
// ==========================================
export const KOLKATA_CENTER_GEO = [88.3639, 22.5726] // [lng, lat]

export function kmToGeoCoord(kmX, kmY) {
  if (kmX === undefined || kmX === null || isNaN(Number(kmX)) || kmY === undefined || kmY === null || isNaN(Number(kmY))) {
    return [KOLKATA_CENTER_GEO[0], KOLKATA_CENTER_GEO[1]];
  }
  // 1 deg lat = 111.13 km
  // 1 deg lng at 22.57° N = 102.6 km
  const lat = KOLKATA_CENTER_GEO[1] - Number(kmY) / 111.13;
  const lng = KOLKATA_CENTER_GEO[0] + Number(kmX) / 102.6;
  return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
}

// Authenticated Kolkata Geographic Anchors for Navigation & Reference Labels
export const REAL_KOLKATA_LANDMARKS = [
  { id: 'esplanade', name: 'Esplanade / B.B.D. Bagh', coordinates: [88.3512, 22.5697], type: 'core' },
  { id: 'howrah', name: 'Howrah', coordinates: [88.3300, 22.5850], type: 'west_bank' },
  { id: 'salt_lake', name: 'Salt Lake / Bidhannagar', coordinates: [88.4180, 22.5830], type: 'east_suburb' },
  { id: 'sector_v', name: 'Sector V (IT Hub)', coordinates: [88.4320, 22.5730], type: 'commercial' },
  { id: 'new_town', name: 'New Town', coordinates: [88.4680, 22.5830], type: 'east_expansion' },
  { id: 'park_street', name: 'Park Street', coordinates: [88.3520, 22.5530], type: 'central' },
  { id: 'ballygunge', name: 'Ballygunge', coordinates: [88.3650, 22.5280], type: 'south' },
  { id: 'gariahat', name: 'Gariahat', coordinates: [88.3680, 22.5180], type: 'south' },
  { id: 'tollygunge', name: 'Tollygunge', coordinates: [88.3470, 22.4980], type: 'south' },
  { id: 'jadavpur', name: 'Jadavpur', coordinates: [88.3710, 22.4990], type: 'south' },
  { id: 'behala', name: 'Behala', coordinates: [88.3150, 22.4850], type: 'south_west' },
  { id: 'dum_dum', name: 'Dum Dum', coordinates: [88.4200, 22.6200], type: 'north' },
  { id: 'victoria_memorial', name: 'Victoria Memorial', coordinates: [88.3426, 22.5448], type: 'heritage' },
  { id: 'howrah_bridge', name: 'Howrah Bridge', coordinates: [88.3468, 22.5851], type: 'bridge' },
  { id: 'vidyasagar_setu', name: 'Vidyasagar Setu', coordinates: [88.3287, 22.5562], type: 'bridge' },
]

export function getCanalsGeoJson() {
  return {
    type: 'FeatureCollection',
    features: DRAINAGE_CANALS.map((canal) => ({
      type: 'Feature',
      id: canal.id,
      properties: {
        id: canal.id,
        name: canal.name,
        flowDirection: canal.flowDirection,
        type: 'canal',
      },
      geometry: {
        type: 'LineString',
        coordinates: canal.points.map(([x, y]) => kmToGeoCoord(x, y)),
      },
    })),
  }
}

export function getTrunkConduitsGeoJson() {
  return {
    type: 'FeatureCollection',
    features: DRAINAGE_TRUNK_CONDUITS.map((trunk) => ({
      type: 'Feature',
      id: trunk.id,
      properties: {
        id: trunk.id,
        name: trunk.name,
        type: 'trunk',
      },
      geometry: {
        type: 'LineString',
        coordinates: trunk.points.map(([x, y]) => kmToGeoCoord(x, y)),
      },
    })),
  }
}

export function getRiskZonesGeoJson() {
  return {
    type: 'FeatureCollection',
    features: RISK_ZONES.map((zone) => {
      const polygonCoords = zone.polygon.map(([x, y]) => kmToGeoCoord(x, y))
      // Close the polygon if not already closed
      if (polygonCoords.length > 0) {
        const first = polygonCoords[0]
        const last = polygonCoords[polygonCoords.length - 1]
        if (first[0] !== last[0] || first[1] !== last[1]) {
          polygonCoords.push([first[0], first[1]])
        }
      }
      return {
        type: 'Feature',
        id: zone.id,
        properties: {
          id: zone.id,
          name: zone.name,
          districtName: zone.districtName,
          level: zone.level,
          color: zone.severityColor || (zone.level === 'CRITICAL' ? '#ef4444' : zone.level === 'HIGH' ? '#f97316' : '#eab308'),
          waterDepth: zone.waterDepth,
          rainfall: zone.rainfall,
          riskScore: zone.riskScore,
          drainageLoad: zone.drainageLoad,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords],
        },
      }
    }),
  }
}

export function getFloodDepthGeoJson(timeStep = 0) {
  // Scaling factors for 0-60m timeline
  // timeStep: 0 (NOW), 15 (+15m), 30 (+30m), 45 (+45m), 60 (+60m)
  const factor = 1 + (timeStep / 60) * 0.45
  return {
    type: 'FeatureCollection',
    features: FLOOD_DEPTH_ZONES.map((zone) => {
      const coords = zone.polygon.map(([x, y]) => {
        // Subtle expansion around zone centroid based on timeline
        const cx = zone.polygon.reduce((acc, p) => acc + p[0], 0) / zone.polygon.length
        const cy = zone.polygon.reduce((acc, p) => acc + p[1], 0) / zone.polygon.length
        const expX = cx + (x - cx) * factor
        const expY = cy + (y - cy) * factor
        return kmToGeoCoord(expX, expY)
      })
      if (coords.length > 0) {
        coords.push([coords[0][0], coords[0][1]])
      }
      return {
        type: 'Feature',
        id: zone.id,
        properties: {
          id: zone.id,
          district: zone.district,
          depthCategory: zone.depthCategory,
          depthCm: Math.round(zone.depthCm * factor),
          borderColor: zone.borderColor || '#dc2626',
          fillColor: zone.fillColor || 'rgba(239, 68, 68, 0.25)',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      }
    }),
  }
}

// "Before" vs "After" Simulation Spread Footprints for Incident Intervention
export function getSimulationSpreadGeoJson(isMitigated = false) {
  // Sector V (#SV-024) intervention footprint
  const beforePolygon = [
    [5.4, -2.9],
    [7.3, -2.9],
    [7.4, -1.1],
    [5.5, -1.1],
  ].map(([x, y]) => kmToGeoCoord(x, y))
  beforePolygon.push([beforePolygon[0][0], beforePolygon[0][1]])

  const afterPolygon = [
    [5.9, -2.3],
    [6.6, -2.3],
    [6.6, -1.7],
    [5.9, -1.7],
  ].map(([x, y]) => kmToGeoCoord(x, y))
  afterPolygon.push([afterPolygon[0][0], afterPolygon[0][1]])

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'sim_sector_v',
        properties: {
          name: isMitigated ? 'Mitigated Footprint (Post-Intervention)' : 'Critical Spread Footprint (Pre-Intervention)',
          isMitigated,
          color: isMitigated ? '#10b981' : '#f43f5e',
          fillColor: isMitigated ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.35)',
          depthCm: isMitigated ? 6 : 28,
          area: isMitigated ? '3,200 m²' : '12,400 m²',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [isMitigated ? afterPolygon : beforePolygon],
        },
      },
    ],
  }
}

// 6. Authentic Hooghly River GeoJSON Channel
export function getHooghlyRiverGeoJson() {
  const points = HOOGHLY_RIVER.centerline.map((pt) => kmToGeoCoord(pt.x, pt.y))
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'hooghly_river_main',
        properties: {
          name: 'Hooghly River (Bhagirathi-Hooghly Artery)',
          type: 'river',
          flow: 'Tidal Sluice Outfall',
        },
        geometry: {
          type: 'LineString',
          coordinates: points,
        },
      },
    ],
  }
}

// 7. Authentic Kolkata Waterbodies, Ponds & Wetlands (EKW, Sarobar, Jheel)
export const KOLKATA_WATERBODIES = [
  {
    id: 'rabindra_sarobar',
    name: 'Rabindra Sarobar (Dhakuria Lake)',
    type: 'lake',
    polygon: [
      [-0.6, 5.2],
      [0.6, 5.2],
      [0.8, 5.8],
      [-0.4, 5.8],
    ],
  },
  {
    id: 'subhas_sarobar',
    name: 'Subhas Sarobar (Beliaghata Lake)',
    type: 'lake',
    polygon: [
      [3.2, 0.2],
      [4.2, 0.2],
      [4.2, 0.8],
      [3.2, 0.8],
    ],
  },
  {
    id: 'ekw_wetlands',
    name: 'East Kolkata Wetlands (Ramsar Site 1208)',
    type: 'wetland',
    polygon: [
      [5.5, 0.5],
      [9.5, 1.2],
      [9.2, 6.5],
      [5.2, 5.2],
    ],
  },
  {
    id: 'santragachi_jheel',
    name: 'Santragachi Jheel',
    type: 'lake',
    polygon: [
      [-7.5, 2.0],
      [-6.5, 2.0],
      [-6.5, 2.8],
      [-7.5, 2.8],
    ],
  },
]

export function getWaterbodiesGeoJson() {
  return {
    type: 'FeatureCollection',
    features: KOLKATA_WATERBODIES.map((wb) => {
      const coords = wb.polygon.map(([x, y]) => kmToGeoCoord(x, y))
      if (coords.length > 0) {
        coords.push([coords[0][0], coords[0][1]])
      }
      return {
        type: 'Feature',
        id: wb.id,
        properties: {
          id: wb.id,
          name: wb.name,
          type: 'waterbody',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      }
    }),
  }
}

// -------------------------------------------------------------
// Authoritative Ward 63 / Victoria Memorial Drainage Overlay Config
// Georeferenced via 12-control-point Thin Plate Spline (TPS) Orthorectification
// -------------------------------------------------------------
export const WARD63_OVERLAY_CONFIG = {
  id: "ward63-drainage",
  sourceId: "ward63-drainage-source",
  layerId: "ward63-drainage-layer",
  url: "/images/ward63_drainage_calibrated.png",
  coordinates: [
    [88.3220, 22.5540], // Top-Left (NW)
    [88.3540, 22.5540], // Top-Right (NE)
    [88.3540, 22.5380], // Bottom-Right (SE)
    [88.3220, 22.5380], // Bottom-Left (SW)
  ],
};

// 12 Verified Ground-Truth Calibration Control Points Across Ward 63
export const WARD63_CALIBRATION_POINTS = [
  {
    id: "CP1",
    name: "Queen's Way North Roundabout (Victoria Memorial)",
    coords: [88.342550, 22.547960],
    category: "Victoria Memorial"
  },
  {
    id: "CP2",
    name: "Queen's Way & Cathedral Road Junction",
    coords: [88.346976, 22.546025],
    category: "Cathedral Road"
  },
  {
    id: "CP3",
    name: "Cathedral Rd & AJC Bose Rd (Rabindra Sadan)",
    coords: [88.344133, 22.541646],
    category: "Cathedral Road"
  },
  {
    id: "CP4",
    name: "Exide Crossing (Chowringhee & AJC Bose)",
    coords: [88.347222, 22.541742],
    category: "Chowringhee / AJC Bose"
  },
  {
    id: "CP5",
    name: "AJC Bose Rd & Camac Street Junction",
    coords: [88.351563, 22.541322],
    category: "AJC Bose Road"
  },
  {
    id: "CP6",
    name: "Chowringhee Rd & Shakespeare Sarani Crossing",
    coords: [88.347867, 22.545897],
    category: "Chowringhee Road"
  },
  {
    id: "CP7",
    name: "Chowringhee Rd & Outram Rd Roundabout",
    coords: [88.351600, 22.553200],
    category: "Chowringhee / Outram"
  },
  {
    id: "CP8",
    name: "Kidderpore Rd & Casuarina Roundabout",
    coords: [88.343347, 22.552378],
    category: "Kidderpore Road"
  },
  {
    id: "CP9",
    name: "Kolkata Race Course Track North Apex",
    coords: [88.338361, 22.548342],
    category: "Race Course"
  },
  {
    id: "CP10",
    name: "Kolkata Race Course Track South Apex",
    coords: [88.336869, 22.540306],
    category: "Race Course"
  },
  {
    id: "CP11",
    name: "Fort William / Clyde Row (Hastings)",
    coords: [88.329240, 22.548539],
    category: "Fort William"
  },
  {
    id: "CP12",
    name: "Kidderpore Rd & AJC Bose (Zeerut Approach)",
    coords: [88.324500, 22.543500],
    category: "Kidderpore / AJC Bose"
  }
];

