import { useKWIStore } from '../../store/useKWIStore'
import { Droplets, Navigation, Layers, Compass, AlertTriangle, ShieldCheck, Waves } from 'lucide-react'

const KEY_LOCATIONS = [
  { name: 'Palmer Bridge Drainage Station', type: 'PUMP', x: '58%', y: '48%', status: 'PUMPING 140 cusecs', level: '22.1 cm', critical: true },
  { name: 'Thanthania Kali Bari & College St', type: 'FLOOD', x: '52%', y: '36%', status: 'WATERLOGGED', level: '28.4 cm', critical: true },
  { name: 'Behala Chowrasta / DH Road', type: 'FLOOD', x: '42%', y: '72%', status: 'BLOCKED CULVERT', level: '19.8 cm', critical: true },
  { name: 'Ballygunge Pumping Station', type: 'PUMP', x: '54%', y: '60%', status: 'OPTIMAL (3/3 running)', level: '11.2 cm', critical: false },
  { name: 'Princep Ghat Tidal Sluice', type: 'SLUICE', x: '38%', y: '46%', status: 'THROTTLED (3.42m tide)', level: '3.42 m', critical: false },
  { name: 'Circular Canal Outfall', type: 'CANAL', x: '62%', y: '28%', status: 'HIGH VELOCITY', level: '16.5 cm', critical: false },
  { name: 'Ultadanga Heavy Pump Unit', type: 'PUMP', x: '66%', y: '32%', status: 'STANDBY', level: '4.5 cm', critical: false },
]

export function CityMapView() {
  const { hooghlyTideLevel, cityAvgRainfall, activePumps, totalPumps, setActiveSection } = useKWIStore()

  return (
    <div className="relative w-full h-screen bg-[#f4f3ef] overflow-hidden select-none font-sans">
      {/* GIS Basemap Grid & Stylized Urban Vector Topography */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />

      {/* Stylized Hooghly River Channel Curve */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M 360,0 C 370,180 340,320 380,480 C 410,600 370,780 390,1080"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="32"
          strokeLinecap="round"
          className="opacity-40"
        />
        <path
          d="M 360,0 C 370,180 340,320 380,480 C 410,600 370,780 390,1080"
          fill="none"
          stroke="#0284c7"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Major Canals: Bagjola & Circular Canal */}
        <path
          d="M 380,260 C 520,290 680,240 900,280"
          fill="none"
          stroke="#0d9488"
          strokeWidth="6"
          strokeDasharray="4 4"
        />
        <path
          d="M 390,520 C 540,550 720,620 960,690"
          fill="none"
          stroke="#0d9488"
          strokeWidth="6"
          strokeDasharray="4 4"
        />
      </svg>

      {/* GIS Markers & Telemetry Points */}
      {KEY_LOCATIONS.map((loc, idx) => (
        <div
          key={idx}
          style={{ left: loc.x, top: loc.y }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
          onClick={() => setActiveSection('INCIDENTS')}
        >
          <div className="relative flex items-center justify-center">
            {loc.critical && (
              <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-rose-400 opacity-60"></span>
            )}
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-md transition-transform group-hover:scale-125 ${
                loc.critical
                  ? 'bg-rose-600 border-white text-white'
                  : 'bg-white border-sky-600 text-sky-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            </div>
          </div>

          {/* Precision GIS Tooltip Badge */}
          <div className="mt-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-xs border border-slate-300 rounded-md shadow-lg text-[10px] font-mono tracking-tight text-slate-900 opacity-90 group-hover:opacity-100 whitespace-nowrap">
            <span className="font-bold">{loc.name}</span>
            <span className="text-slate-400 mx-1">|</span>
            <span className={loc.critical ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
              {loc.level}
            </span>
          </div>
        </div>
      ))}

      {/* Bottom Floating GIS Information Ribbon */}
      <div className="absolute bottom-6 left-6 right-6 max-w-5xl mx-auto z-30 pointer-events-none">
        <div className="pointer-events-auto bg-[#fcfbf9]/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Hooghly River Level
              </span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {hooghlyTideLevel} m{' '}
                <span className="text-amber-700 font-semibold text-xs">(HIGH TIDE RISING)</span>
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                City Mean Rainfall
              </span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {cityAvgRainfall} mm/hr{' '}
                <span className="text-slate-500 font-normal text-xs">(Alipore Radar)</span>
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Pump Station Grid
              </span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {activePumps}/{totalPumps} Active{' '}
                <span className="text-emerald-700 font-semibold text-xs">(93% Capacity)</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CityMapView
