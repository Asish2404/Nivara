import { useTexture } from '@react-three/drei'

export function EarthSurface() {
  const { day, normal, specular } = useTexture({
    day: '/textures/earth_day.jpg',
    normal: '/textures/earth_normal.jpg',
    specular: '/textures/earth_specular.jpg',
  })
  day.colorSpace = 'srgb'
  day.anisotropy = 16
  normal.anisotropy = 16
  specular.anisotropy = 16
  const gradeSurface = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
        float surfaceLuminance = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
        diffuseColor.rgb = mix(vec3(surfaceLuminance), diffuseColor.rgb, 1.26);
        diffuseColor.rgb *= vec3(1.01, 1.025, 1.045);`,
    )
  }

  return (
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[2.05, 128, 96]} />
      <meshPhongMaterial
        map={day}
        normalMap={normal}
        normalScale={[0.56, 0.56]}
        specularMap={specular}
        specular="#648896"
        shininess={14}
        color="#f5f5ed"
        onBeforeCompile={gradeSurface}
      />
    </mesh>
  )
}
