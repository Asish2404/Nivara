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
    float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
    vec3 innerCyan = vec3(0.0, 0.94, 1.0); // Vibrant Cyan
    vec3 outerBlue = vec3(0.08, 0.42, 0.92); // Deep Orbital Blue
    vec3 atmosphereColor = mix(innerCyan, outerBlue, rim * 0.6);
    gl_FragColor = vec4(atmosphereColor, rim * 0.62);
  }
`

export function EarthAtmosphere() {
  return (
    <mesh scale={1.035} renderOrder={3}>
      <sphereGeometry args={[2.05, 128, 96]} />
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
