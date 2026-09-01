import { OrbitControls } from '@react-three/drei'

export function EarthCamera({ controlsRef, explored }) {
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.035}
      autoRotate={!explored}
      autoRotateSpeed={0.21}
      rotateSpeed={0.32}
      zoomSpeed={0.55}
      minDistance={3.25}
      maxDistance={10}
    />
  )
}
