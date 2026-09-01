import { useTexture } from '@react-three/drei'

export function EarthSurface() {
  const { day, normal, specular } = useTexture({
    day: '/textures/earth_day.jpg',
    normal: '/textures/earth_normal.jpg',
    specular: '/textures/earth_specular.jpg',
  })
  day.colorSpace = 'srgb'
  day.anisotropy = 8
  normal.anisotropy = 8
  specular.anisotropy = 8
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
      <sphereGeometry args={[2.05, 96, 64]} />
      <meshPhongMaterial
        map={day}
        normalMap={normal}
        normalScale={[0.42, 0.42]}
        specularMap={specular}
        specular="#648896"
        shininess={11}
        color="#f5f5ed"
        onBeforeCompile={gradeSurface}
      />
    </mesh>
  )
}
