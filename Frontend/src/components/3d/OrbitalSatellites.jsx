import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EARTH_RADIUS } from '../geoCoordinates'

export function OrbitalSatellites() {
  const constellationRef = useRef()
  const polarOrbitRef = useRef()
  const beaconsRef = useRef([])

  // Generate satellite positions along orbital rings
  const satellites = useMemo(() => {
    const orbitRadius = EARTH_RADIUS + 0.42
    const count = 9
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2
      const x = Math.cos(angle) * orbitRadius
      const z = Math.sin(angle) * orbitRadius
      return {
        id: i,
        pos: [x, 0, z],
        angle,
      }
    })
  }, [])

  // Generate 4 polar satellites
  const polarSatellites = useMemo(() => {
    const orbitRadius = EARTH_RADIUS + 0.52
    const count = 4
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2
      const x = Math.cos(angle) * orbitRadius
      const y = Math.sin(angle) * orbitRadius
      return {
        id: i + 100,
        pos: [x, y, 0],
      }
    })
  }, [])

  // Generate orbital ring path geometries
  const { equatorialRingGeometry, polarRingGeometry } = useMemo(() => {
    const ringRadius1 = EARTH_RADIUS + 0.42
    const ringRadius2 = EARTH_RADIUS + 0.52
    const segments = 64

    const pts1 = []
    const pts2 = []
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      pts1.push(new THREE.Vector3(Math.cos(theta) * ringRadius1, 0, Math.sin(theta) * ringRadius1))
      pts2.push(new THREE.Vector3(Math.cos(theta) * ringRadius2, Math.sin(theta) * ringRadius2, 0))
    }

    return {
      equatorialRingGeometry: new THREE.BufferGeometry().setFromPoints(pts1),
      polarRingGeometry: new THREE.BufferGeometry().setFromPoints(pts2),
    }
  }, [])

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    // Smooth orbital revolutions
    if (constellationRef.current) {
      constellationRef.current.rotation.y = time * 0.12
    }
    if (polarOrbitRef.current) {
      polarOrbitRef.current.rotation.z = time * 0.09
      polarOrbitRef.current.rotation.x = 0.35
    }

    // Blinking beacons
    beaconsRef.current.forEach((beacon, i) => {
      if (beacon && beacon.material) {
        const blink = Math.sin(time * 5 + i) > 0.4 ? 1.0 : 0.25
        beacon.material.opacity = blink
      }
    })
  })

  return (
    <group>
      {/* 1. Inclined Main Constellation Ring */}
      <group ref={constellationRef} rotation={[0.42, 0, 0.25]}>
        {/* Faint holographic orbital path line */}
        <line geometry={equatorialRingGeometry}>
          <lineBasicMaterial
            color="#00f0ff"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </line>

        {/* Satellites */}
        {satellites.map((sat, idx) => (
          <group key={sat.id} position={sat.pos} rotation={[0, -sat.angle, 0]}>
            {/* Satellite Body */}
            <mesh>
              <boxGeometry args={[0.024, 0.016, 0.024]} />
              <meshStandardMaterial
                color="#cbd5e1"
                metalness={0.9}
                roughness={0.2}
                emissive="#00f0ff"
                emissiveIntensity={0.2}
              />
            </mesh>

            {/* Left Solar Panel */}
            <mesh position={[-0.038, 0, 0]}>
              <boxGeometry args={[0.045, 0.002, 0.02]} />
              <meshStandardMaterial
                color="#0284c7"
                roughness={0.1}
                metalness={0.8}
                emissive="#0369a1"
                emissiveIntensity={0.3}
              />
            </mesh>

            {/* Right Solar Panel */}
            <mesh position={[0.038, 0, 0]}>
              <boxGeometry args={[0.045, 0.002, 0.02]} />
              <meshStandardMaterial
                color="#0284c7"
                roughness={0.1}
                metalness={0.8}
                emissive="#0369a1"
                emissiveIntensity={0.3}
              />
            </mesh>

            {/* Blinking Sensor Beacon */}
            <mesh
              ref={(el) => (beaconsRef.current[idx] = el)}
              position={[0, -0.012, 0]}
            >
              <sphereGeometry args={[0.007, 8, 8]} />
              <meshBasicMaterial
                color="#00f0ff"
                transparent
                opacity={0.8}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 2. Polar Orbit Constellation */}
      <group ref={polarOrbitRef}>
        <line geometry={polarRingGeometry}>
          <lineBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.14}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </line>

        {polarSatellites.map((sat, idx) => (
          <group key={sat.id} position={sat.pos}>
            <mesh>
              <boxGeometry args={[0.02, 0.02, 0.02]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh
              ref={(el) => (beaconsRef.current[idx + satellites.length] = el)}
              position={[0, 0, 0.012]}
            >
              <sphereGeometry args={[0.006, 8, 8]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.9} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
