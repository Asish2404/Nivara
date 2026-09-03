import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useRef } from 'react'

export function EarthClouds() {
  const clouds = useRef()
  const cloudMap = useTexture('/textures/earth_clouds.png')
  cloudMap.colorSpace = 'srgb'
  cloudMap.anisotropy = 16

  useFrame((_, delta) => {
    clouds.current.rotation.y += delta * 0.0035
  })

  return (
    <mesh ref={clouds} scale={1.012} renderOrder={2}>
      <sphereGeometry args={[2.05, 128, 96]} />
      <meshPhongMaterial
        map={cloudMap}
        transparent
        opacity={0.42}
        depthWrite={false}
        alphaTest={0.02}
        color="#edf3ef"
      />
    </mesh>
  )
}
