import { useMemo } from 'react'
import * as THREE from 'three'
import { EARTH_RADIUS, latitudeLongitudeToVector3 } from './geoCoordinates'

const debugCities = [
  { name: 'Delhi', color: '#ffb703', location: { latitude: 28.6139, longitude: 77.209 } },
  { name: 'Mumbai', color: '#fb8500', location: { latitude: 19.076, longitude: 72.8777 } },
  { name: 'Kolkata', color: '#ff006e', location: { latitude: 22.5726, longitude: 88.3639 } },
  { name: 'Chennai', color: '#8338ec', location: { latitude: 13.0827, longitude: 80.2707 } },
  { name: 'Sri Lanka', color: '#06d6a0', location: { latitude: 7.8731, longitude: 80.7718 } },
  { name: 'Bangladesh', color: '#219ebc', location: { latitude: 23.685, longitude: 90.3563 } },
  { name: 'Pakistan', color: '#8ecae6', location: { latitude: 30.3753, longitude: 69.3451 } },
]

export function GeographicValidationMarkers({ visible = false }) {
  const markers = useMemo(
    () =>
      debugCities.map(({ location, color }) => ({
        position: latitudeLongitudeToVector3(location, EARTH_RADIUS + 0.02),
        color,
      })),
    [],
  )

  if (!visible) return null

  return (
    <group>
      {markers.map(({ position, color }, index) => (
        <mesh key={index} position={position.toArray()}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      <mesh position={latitudeLongitudeToVector3({ latitude: 22.5, longitude: 79.0 }, EARTH_RADIUS + 0.04).toArray()}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}
