import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  HOOGHLY_RIVER_POINTS,
  WATER_BODIES,
  WETLANDS_POLYGON,
  DRAINAGE_CANALS,
  PRIMARY_ROADS,
  SECONDARY_ROADS,
  GREEN_RESERVES,
  RISK_OVERLAY_ZONES,
  ACTIVE_INCIDENTS_GEO,
  PUMPING_STATIONS_GEO,
} from './kolkataGeoData'

/**
 * High-Caliber Vector GIS Map of Kolkata
 * Clean, architectural, SVG-based rendering with accurate geography,
 * Hooghly River, East Kolkata Wetlands, Maidan, Arterial Roads, and Incident layers.
 */
export function KolkataVectorMap({
  activeLayers = { rain: true, risk: true, incidents: true, drainage: true, pumps: true, forecast: true },
  selectedIncident = null,
  selectedRiskZone = null,
  selectedPumpStation = null,
  selectedDistrict = null,
  onSelectIncident = () => {},
  onSelectRiskZone = () => {},
  onSelectPumpStation = () => {},
  interactive = true,
  className = '',
}) {
  // Coordinate transform from geo units to SVG viewBox (-10 to 12 in X, -9 to 10 in Z)
  // ViewBox: 0 0 1000 850
  const transform = (x, z) => {
    const svgX = ((x + 8.5) / 20.0) * 1000
    const svgY = ((z + 9.0) / 18.5) * 850
    return [svgX, svgY]
  }

  // River SVG Path Construction
  const riverPath = useMemo(() => {
    const leftPoints = []
    const rightPoints = []

    for (let i = 0; i < HOOGHLY_RIVER_POINTS.length; i++) {
      const pt = HOOGHLY_RIVER_POINTS[i]
      const halfW = pt.width / 2

      let dx = 0
      let dz = 1
      if (i < HOOGHLY_RIVER_POINTS.length - 1) {
        dx = HOOGHLY_RIVER_POINTS[i + 1].x - pt.x
        dz = HOOGHLY_RIVER_POINTS[i + 1].z - pt.z
      } else {
        dx = pt.x - HOOGHLY_RIVER_POINTS[i - 1].x
        dz = pt.z - HOOGHLY_RIVER_POINTS[i - 1].z
      }
      const len = Math.hypot(dx, dz) || 1
      const nx = -dz / len
      const nz = dx / len

      const [lx, ly] = transform(pt.x - nx * halfW, pt.z - nz * halfW)
      const [rx, ry] = transform(pt.x + nx * halfW, pt.z + nz * halfW)

      leftPoints.push(`${lx},${ly}`)
      rightPoints.unshift(`${rx},${ry}`)
    }

    return `M ${leftPoints.join(' L ')} L ${rightPoints.join(' L ')} Z`
  }, [])

  // Wetlands SVG Path
  const wetlandsPath = useMemo(() => {
    const pts = WETLANDS_POLYGON.map((p) => {
      const [sx, sy] = transform(p.x, p.z)
      return `${sx},${sy}`
    })
    return `M ${pts.join(' L ')} Z`
  }, [])

  return (
    <div className={`relative w-full h-full bg-[#f8fafc] overflow-hidden select-none ${className}`}>
      <svg
        viewBox="0 0 1000 850"
        className="w-full h-full object-cover"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(15,23,42,0.03))' }}
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="carto-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
          </pattern>
          {/* Water Gradient */}
          <linearGradient id="river-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>
          {/* Wetland pattern */}
          <linearGradient id="wetland-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* 1. Base Terrain Fill & Grid */}
        <rect width="1000" height="850" fill="#ffffff" />
        <rect width="1000" height="850" fill="url(#carto-grid)" />

        {/* 2. East Kolkata Wetlands */}
        <path
          d={wetlandsPath}
          fill="url(#wetland-grad)"
          stroke="#93c5fd"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text
          x={transform(6.8, 3.2)[0]}
          y={transform(6.8, 3.2)[1]}
          fill="#64748b"
          fontSize="11"
          fontWeight="600"
          letterSpacing="1"
          className="uppercase pointer-events-none"
        >
          East Kolkata Wetlands (Ramsar Basin)
        </text>

        {/* 3. Green Reserves & Parks */}
        {GREEN_RESERVES.map((res, i) => {
          const [cx, cy] = transform(res.center[0], res.center[1])
          const w = (res.size[0] / 20.0) * 1000
          const h = (res.size[1] / 18.5) * 850
          return (
            <g key={i}>
              <rect
                x={cx - w / 2}
                y={cy - h / 2}
                width={w}
                height={h}
                rx="6"
                fill="#dcfce7"
                stroke="#86efac"
                strokeWidth="1"
              />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                fill="#15803d"
                fontSize="10"
                fontWeight="600"
                className="pointer-events-none uppercase"
              >
                {res.name}
              </text>
            </g>
          )
        })}

        {/* 4. Lakes & Water Bodies */}
        {WATER_BODIES.map((wb, i) => {
          const [cx, cy] = transform(wb.center[0], wb.center[1])
          const rx = (wb.radiusX / 20.0) * 1000
          const ry = (wb.radiusZ / 18.5) * 850
          return (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill="#93c5fd"
              stroke="#60a5fa"
              strokeWidth="1.2"
            />
          )
        })}

        {/* 5. Hooghly River Channel */}
        <path
          d={riverPath}
          fill="url(#river-grad)"
          stroke="#60a5fa"
          strokeWidth="1.5"
          className="transition-all"
        />

        {/* River Label */}
        <text
          x={transform(-4.2, 0.2)[0]}
          y={transform(-4.2, 0.2)[1]}
          transform={`rotate(-70, ${transform(-4.2, 0.2)[0]}, ${transform(-4.2, 0.2)[1]})`}
          fill="#1d4ed8"
          fontSize="12"
          fontWeight="700"
          letterSpacing="2.5"
          className="uppercase pointer-events-none"
        >
          Hooghly River
        </text>

        {/* 6. Secondary City Streets */}
        {SECONDARY_ROADS.map((road, i) => {
          const pts = road.map(([rx, rz]) => {
            const [sx, sy] = transform(rx, rz)
            return `${sx},${sy}`
          })
          return (
            <polyline
              key={`sec-${i}`}
              points={pts.join(' ')}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        })}

        {/* 7. Primary Arterial Expressways */}
        {PRIMARY_ROADS.map((road, i) => {
          const pts = road.map(([rx, rz]) => {
            const [sx, sy] = transform(rx, rz)
            return `${sx},${sy}`
          })
          return (
            <polyline
              key={`prim-${i}`}
              points={pts.join(' ')}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        })}

        {/* 8. Drainage Canals (Municipal Khals) */}
        {activeLayers.drainage &&
          DRAINAGE_CANALS.map((canal, i) => {
            const pts = canal.map(([cx, cz]) => {
              const [sx, sy] = transform(cx, cz)
              return `${sx},${sy}`
            })
            return (
              <polyline
                key={`canal-${i}`}
                points={pts.join(' ')}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
            )
          })}

        {/* 9. Bridges */}
        {/* Howrah Bridge */}
        <line
          x1={transform(-3.8, -2.2)[0]}
          y1={transform(-3.8, -2.2)[1]}
          x2={transform(-2.4, -2.2)[0]}
          y2={transform(-2.4, -2.2)[1]}
          stroke="#475569"
          strokeWidth="4"
          strokeLinecap="square"
        />
        <text
          x={transform(-3.1, -2.5)[0]}
          y={transform(-3.1, -2.5)[1]}
          textAnchor="middle"
          fill="#334155"
          fontSize="9"
          fontWeight="600"
          className="pointer-events-none"
        >
          Howrah Bridge
        </text>

        {/* Vidyasagar Setu */}
        <line
          x1={transform(-4.2, -0.5)[0]}
          y1={transform(-4.2, -0.5)[1]}
          x2={transform(-2.5, -0.5)[0]}
          y2={transform(-2.5, -0.5)[1]}
          stroke="#475569"
          strokeWidth="4"
          strokeLinecap="square"
        />
        <text
          x={transform(-3.35, -0.8)[0]}
          y={transform(-3.35, -0.8)[1]}
          textAnchor="middle"
          fill="#334155"
          fontSize="9"
          fontWeight="600"
          className="pointer-events-none"
        >
          Vidyasagar Setu
        </text>

        {/* 10. District Labels */}
        <g className="font-sans text-[11px] font-bold text-slate-700 pointer-events-none">
          <text x={transform(-0.4, -1.2)[0]} y={transform(-0.4, -1.2)[1]} fill="#0f172a" fontSize="12" fontWeight="700">
            Central Kolkata (BBD Bagh)
          </text>
          <text x={transform(5.6, -2.6)[0]} y={transform(5.6, -2.6)[1]} fill="#0f172a" fontSize="11" fontWeight="600">
            Salt Lake City
          </text>
          <text x={transform(6.4, -1.2)[0]} y={transform(6.4, -1.2)[1]} fill="#2563eb" fontSize="11" fontWeight="700">
            Sector V (IT Hub)
          </text>
          <text x={transform(7.8, -4.6)[0]} y={transform(7.8, -4.6)[1]} fill="#0f172a" fontSize="11" fontWeight="600">
            New Town Rajarhat
          </text>
          <text x={transform(-2.8, 5.2)[0]} y={transform(-2.8, 5.2)[1]} fill="#0f172a" fontSize="11" fontWeight="600">
            Behala & Tollygunge
          </text>
          <text x={transform(-5.2, -2.6)[0]} y={transform(-5.2, -2.6)[1]} fill="#475569" fontSize="11" fontWeight="600">
            Howrah Side
          </text>
        </g>

        {/* 11. Geographic Risk Surfaces */}
        {activeLayers.risk &&
          RISK_OVERLAY_ZONES.map((zone) => {
            const [cx, cy] = transform(zone.center[0], zone.center[1])
            const rx = (zone.radiusX / 20.0) * 1000
            const ry = (zone.radiusZ / 18.5) * 850
            const isSelected = selectedRiskZone?.id === zone.id
            const isCritical = zone.level === 'CRITICAL'
            const isHigh = zone.level === 'HIGH'

            const fillColor = isCritical ? 'rgba(220, 38, 38, 0.16)' : isHigh ? 'rgba(217, 119, 6, 0.16)' : 'rgba(22, 163, 74, 0.12)'
            const strokeColor = isCritical ? '#dc2626' : isHigh ? '#d97706' : '#16a34a'

            return (
              <g
                key={zone.id}
                className={interactive ? 'cursor-pointer' : ''}
                onClick={() => interactive && onSelectRiskZone(zone)}
              >
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx={rx}
                  ry={ry}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 2.5 : 1.2}
                  strokeDasharray={isSelected ? 'none' : '4 3'}
                  className="transition-all"
                />
              </g>
            )
          })}

        {/* 12. Pumping Stations Markers */}
        {activeLayers.pumps &&
          PUMPING_STATIONS_GEO.map((ps) => {
            const [cx, cy] = transform(ps.position[0], ps.position[2])
            const isSelected = selectedPumpStation?.id === ps.id
            const isAtCapacity = ps.status === 'AT CAPACITY'
            const color = isAtCapacity ? '#dc2626' : '#16a34a'

            return (
              <g
                key={ps.id}
                className={interactive ? 'cursor-pointer' : ''}
                onClick={() => interactive && onSelectPumpStation(ps)}
              >
                <circle cx={cx} cy={cy} r={isSelected ? 9 : 7} fill="#ffffff" stroke={color} strokeWidth="2.5" />
                <circle cx={cx} cy={cy} r={3} fill={color} />
                <text
                  x={cx + 10}
                  y={cy + 4}
                  fill="#0f172a"
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none font-mono"
                >
                  {ps.id}
                </text>
              </g>
            )
          })}

        {/* 13. Active Incident Pins */}
        {activeLayers.incidents &&
          ACTIVE_INCIDENTS_GEO.map((inc) => {
            const [cx, cy] = transform(inc.position[0], inc.position[2])
            const isSelected = selectedIncident?.id === inc.id
            const isCritical = inc.severity === 'CRITICAL'
            const pinColor = isCritical ? '#dc2626' : '#d97706'

            return (
              <g
                key={inc.id}
                className={interactive ? 'cursor-pointer' : ''}
                onClick={() => interactive && onSelectIncident(inc)}
              >
                {/* Subtle Pulse Ring if selected or critical */}
                {(isSelected || isCritical) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 18 : 13}
                    fill={isCritical ? 'rgba(220, 38, 38, 0.15)' : 'rgba(217, 119, 6, 0.15)'}
                    className="animate-subtle-pulse"
                  />
                )}
                {/* Pin Head */}
                <circle cx={cx} cy={cy} r={isSelected ? 8 : 6} fill={pinColor} stroke="#ffffff" strokeWidth="2" />
                {/* Badge Label */}
                <rect
                  x={cx - 26}
                  y={cy - 24}
                  width="52"
                  height="16"
                  rx="4"
                  fill="#ffffff"
                  stroke={isSelected ? pinColor : '#e2e8f0'}
                  strokeWidth={isSelected ? 1.5 : 1}
                  filter="drop-shadow(0 2px 4px rgba(15,23,42,0.08))"
                />
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize="9"
                  fontWeight="700"
                  className="font-mono pointer-events-none"
                >
                  {inc.id}
                </text>
              </g>
            )
          })}
      </svg>
    </div>
  )
}

export default KolkataVectorMap
