import { useMemo } from 'react'
import { INDIA_TARGET, latitudeLongitudeToVector3 } from './geoCoordinates'

export function IndiaTargetMarker() {
  const position = useMemo(() => latitudeLongitudeToVector3(INDIA_TARGET, 2.09).toArray(), [])

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.035, 16, 12]} />
      <meshBasicMaterial color="#ff5b45" toneMapped={false} />
    </mesh>
  )
}
