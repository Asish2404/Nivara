import * as THREE from 'three'

const vertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  varying vec3 vNormal;
  void main() {
    float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.6);
    gl_FragColor = vec4(0.10, 0.29, 0.46, rim * 0.27);
  }
`

export function EarthAtmosphere() {
  return (
    <mesh scale={1.035} renderOrder={3}>
      <sphereGeometry args={[2.05, 64, 48]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
