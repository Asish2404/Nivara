import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { EARTH_RADIUS, latitudeLongitudeToVector3 } from '../geoCoordinates'
import { audioEngine } from '../../utils/audioEngine'


const KOLKATA_COORDS = { latitude: 22.5726, longitude: 88.3639 }

const DATA_NODES = [
  {
    name: 'Tokyo Node',
    coords: { latitude: 35.6762, longitude: 139.6503 },
    color: '#00f0ff',
    throughput: '4.8 Gbps',
    latency: '19ms',
    radar: 'JMA Himawari-9 Dual-Pol',
    status: 'ACTIVE UPLINK',
  },
  {
    name: 'London Station',
    coords: { latitude: 51.5074, longitude: -0.1278 },
    color: '#38bdf8',
    throughput: '3.2 Gbps',
    latency: '48ms',
    radar: 'ECMWF Global Hydrology',
    status: 'STREAMING',
  },
  {
    name: 'Singapore Hub',
    coords: { latitude: 1.3521, longitude: 103.8198 },
    color: '#22d3ee',
    throughput: '5.4 Gbps',
    latency: '12ms',
    radar: 'Equatorial Doppler Array',
    status: 'OPTIMAL',
  },
  {
    name: 'Dubai Uplink',
    coords: { latitude: 25.2048, longitude: 55.2708 },
    color: '#67e8f9',
    throughput: '2.9 Gbps',
    latency: '31ms',
    radar: 'Gulf Coastal Satellite Link',
    status: 'SYNCHRONIZED',
  },
  {
    name: 'Frankfurt Radar',
    coords: { latitude: 50.1109, longitude: 8.6821 },
    color: '#38bdf8',
    throughput: '3.8 Gbps',
    latency: '44ms',
    radar: 'DWD Precipitation Grid',
    status: 'ONLINE',
  },
  {
    name: 'Sydney Weather',
    coords: { latitude: -33.8688, longitude: 151.2093 },
    color: '#00f0ff',
    throughput: '2.4 Gbps',
    latency: '62ms',
    radar: 'BOM Monsoon Telemetry',
    status: 'LINKED',
  },
  {
    name: 'San Francisco Array',
    coords: { latitude: 37.7749, longitude: -122.4194 },
    color: '#06b6d4',
    throughput: '6.1 Gbps',
    latency: '85ms',
    radar: 'NOAA GOES-West Atmospheric',
    status: 'TRANSMITTING',
  },
]

export function GlobalDataStreams() {
  const packetsRef = useRef([])
  const [activeNodeId, setActiveNodeId] = useState(null)

  // Pre-calculate curves and geometry
  const streams = useMemo(() => {
    const kolkataPos = latitudeLongitudeToVector3(KOLKATA_COORDS, EARTH_RADIUS + 0.015)

    return DATA_NODES.map((node, index) => {
      const sourcePos = latitudeLongitudeToVector3(node.coords, EARTH_RADIUS + 0.015)

      // Calculate mid-point and elevate it outward to form an orbital arc
      const midPoint = new THREE.Vector3().addVectors(sourcePos, kolkataPos).multiplyScalar(0.5)
      const distance = sourcePos.distanceTo(kolkataPos)
      const midElevation = EARTH_RADIUS + Math.min(distance * 0.42, 1.1)
      midPoint.normalize().multiplyScalar(midElevation)

      // Cubic curve for ultra-smooth aesthetic
      const control1 = new THREE.Vector3().lerpVectors(sourcePos, midPoint, 0.6)
      const control2 = new THREE.Vector3().lerpVectors(midPoint, kolkataPos, 0.4)
      control1.normalize().multiplyScalar(EARTH_RADIUS + distance * 0.28)
      control2.normalize().multiplyScalar(EARTH_RADIUS + distance * 0.28)

      const curve = new THREE.CubicBezierCurve3(sourcePos, control1, control2, kolkataPos)
      const points = curve.getPoints(84)
      const geometry = new THREE.BufferGeometry().setFromPoints(points)

      return {
        id: index,
        node,
        sourcePos: sourcePos.toArray(),
        curve,
        geometry,
        speed: 0.22 + (index % 3) * 0.06,
        phaseOffset: index * 0.15,
      }
    })
  }, [])

  // Animate moving glowing data packets along the arcs
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    streams.forEach((stream, idx) => {
      const packet = packetsRef.current[idx]
      if (!packet) return

      // Loop progress from 0 (source) to 1 (Kolkata)
      const progress = (time * stream.speed + stream.phaseOffset) % 1.0
      const pos = stream.curve.getPointAt(progress)
      packet.position.copy(pos)

      // Pulse brightness as it nears destination
      const scale = 0.018 + Math.sin(progress * Math.PI) * 0.014
      packet.scale.set(scale, scale, scale)
    })
  })

  return (
    <group>
      {streams.map((stream, idx) => {
        const isHovered = activeNodeId === stream.id

        return (
          <group key={stream.id}>
            {/* Baseline data spline */}
            <line geometry={stream.geometry}>
              <lineBasicMaterial
                color={isHovered ? '#ffffff' : '#00f0ff'}
                transparent
                opacity={isHovered ? 0.8 : 0.28}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </line>

            {/* Source node ground marker */}
            <mesh position={stream.sourcePos}>
              <sphereGeometry args={[isHovered ? 0.024 : 0.016, 16, 16]} />
              <meshBasicMaterial
                color={isHovered ? '#00f0ff' : '#38bdf8'}
                toneMapped={false}
              />
            </mesh>

            {/* Invisible larger hit target for smooth hovering/clicking */}
            <mesh
              position={stream.sourcePos}
              onPointerOver={(e) => {
                e.stopPropagation()
                setActiveNodeId(stream.id)
                document.body.style.cursor = 'pointer'
                audioEngine.playStationLock()
              }}
              onPointerOut={() => {
                setActiveNodeId(null)
                document.body.style.cursor = 'auto'
              }}
            >
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshBasicMaterial visible={false} />

              {/* Holographic 3D Floating Telemetry Card */}
              {isHovered && (
                <Html
                  position={[0, 0.1, 0]}
                  center
                  distanceFactor={10}
                  className="pointer-events-none select-none z-50"
                >
                  <div className="w-56 p-3 rounded-xl bg-black/85 backdrop-blur-md border border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.35)] text-left font-mono">
                    <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-2">
                      <span className="text-xs font-bold text-white tracking-wider">
                        {stream.node.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-semibold">
                        {stream.node.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px] text-cyan-200">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Throughput:</span>
                        <span className="text-cyan-300 font-bold">{stream.node.throughput}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Latency:</span>
                        <span className="text-emerald-400 font-bold">{stream.node.latency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sensor Type:</span>
                        <span className="text-white text-[10px] truncate max-w-[110px]">{stream.node.radar}</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-1 border-t border-cyan-500/20 text-[9px] text-cyan-400/70 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      STREAMING TELEMETRY ➔ KOLKATA
                    </div>
                  </div>
                </Html>
              )}
            </mesh>

            {/* Moving luminous data packet */}
            <mesh ref={(el) => (packetsRef.current[idx] = el)}>
              <sphereGeometry args={[1, 14, 14]} />
              <meshBasicMaterial
                color="#ffffff"
                toneMapped={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
