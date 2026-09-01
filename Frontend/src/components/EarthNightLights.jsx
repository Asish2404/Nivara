import { useTexture } from '@react-three/drei'

export function EarthNightLights() {
  const lights = useTexture('/textures/earth_lights.png')
  lights.colorSpace = 'srgb'
  lights.anisotropy = 8

  return (
    <mesh scale={1.006} renderOrder={1}>
      <sphereGeometry args={[2.05, 72, 48]} />
      <meshBasicMaterial
        map={lights}
        transparent
        opacity={0.48}
        blending={2}
        depthWrite={false}
        color="#f6b86c"
      />
    </mesh>
  )
}
