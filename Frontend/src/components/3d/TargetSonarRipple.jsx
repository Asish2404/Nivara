import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EARTH_RADIUS, latitudeLongitudeToVector3 } from '../geoCoordinates'

const KOLKATA_COORDS = { latitude: 22.5726, longitude: 88.3639 }

export function TargetSonarRipple() {
  const ringsRef = useRef([])
  const beaconRef = useRef()

  // Compute position and surface normal tangent orientation
  const { position, orientation } = useMemo(() => {
    const pos = latitudeLongitudeToVector3(KOLKATA_COORDS, EARTH_RADIUS + 0.012)
    const normal = pos.clone().normalize()
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
    return { position: pos.toArray(), orientation: quat }
  }, [])

  const ringCount = 3

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * 1.4

    // Animate concentric rings
    ringsRef.current.forEach((ring, i) => {
      if (!ring) return
      const progress = (time + i / ringCount) % 1.0
      // Scale expanding outwards
      const scale = 0.04 + progress * 0.28
      ring.scale.set(scale, scale, 1)

      // Opacity fades out smoothly toward the edge
      if (ring.material) {
        ring.material.opacity = Math.pow(1.0 - progress, 1.5) * 0.85
      }
    })

    // Pulsing central beacon
    if (beaconRef.current) {
      const pulse = 0.8 + Math.sin(time * 6) * 0.2
      beaconRef.current.scale.set(pulse, pulse, pulse)
    }
  })

  return (
    <group position={position} quaternion={orientation}>
      {/* Central bright beacon */}
      <mesh ref={beaconRef} position={[0, 0, 0.01]}>
        <circleGeometry args={[0.022, 24]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Inner high-visibility target core */}
      <mesh position={[0, 0, 0.012]}>
        <circleGeometry args={[0.01, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {/* 3 Concentric Sonar Pulse Rings */}
      {Array.from({ length: ringCount }).map((_, idx) => (
        <mesh
          key={idx}
          ref={(el) => (ringsRef.current[idx] = el)}
          position={[0, 0, 0.005 + idx * 0.002]}
        >
          <ringGeometry args={[0.85, 1.0, 32]} />
          <meshBasicMaterial
            color="#00f0ff"
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Holographic targeting beam pin pointing away from Earth */}
      <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.002, 0.005, 0.24, 8]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
