import { useRef, useMemo } from 'react'
import * as THREE from 'three'

/**
 * Seeded pseudo-random number generator for deterministic, natural-looking distribution
 */
class SeededRandom {
  constructor(seed) {
    this.seed = seed
  }

  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  nextInRange(min, max) {
    return min + this.next() * (max - min)
  }
}

/**
 * Generate stars with natural variation across multiple depth layers
 */
function generateStarField(layerConfig, seed) {
  const rng = new SeededRandom(seed)
  const positions = []
  const colors = []
  const sizes = []

  for (let i = 0; i < layerConfig.count; i++) {
    const theta = rng.nextInRange(0, Math.PI * 2)
    const phi = Math.acos(rng.nextInRange(-1, 1))
    const radius = rng.nextInRange(layerConfig.minRadius, layerConfig.maxRadius)

    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.sin(phi) * Math.sin(theta)
    const z = radius * Math.cos(phi)

    positions.push(x, y, z)

    // Brightness with exponential distribution for natural hierarchy
    const brightnessRandom = rng.next()
    const brightness = Math.pow(brightnessRandom, 1.5) // Adjusted for better visibility
    const finalBrightness = Math.min(brightness * layerConfig.brightnessMultiplier * 1.3, 1.0)

    // Star sizes: most tiny, some small, very few slightly larger
    const sizeRandom = rng.next()
    let size
    if (sizeRandom < 0.82) {
      // 82% extremely tiny distant stars
      size = rng.nextInRange(0.18, 0.4)
    } else if (sizeRandom < 0.97) {
      // 15% small medium-distance stars
      size = rng.nextInRange(0.4, 0.75)
    } else {
      // 3% slightly brighter/larger stars
      size = rng.nextInRange(0.75, 1.2)
    }

    // Apply brightness to size for natural look
    sizes.push(size * Math.max(0.7, finalBrightness))

    // Star colors: mostly white with natural warm/cool tints
    const colorRandom = rng.next()
    let r, g, b

    if (colorRandom < 0.72) {
      // 72% near-white or pure white
      const whiteVariation = rng.nextInRange(0.88, 1.0)
      r = whiteVariation
      g = whiteVariation
      b = whiteVariation
    } else if (colorRandom < 0.87) {
      // 15% slightly warm white (yellowish)
      r = 1.0
      g = rng.nextInRange(0.92, 0.99)
      b = rng.nextInRange(0.80, 0.90)
    } else {
      // 13% slightly cool white (bluish)
      r = rng.nextInRange(0.92, 0.99)
      g = rng.nextInRange(0.94, 1.0)
      b = 1.0
    }

    // Apply final brightness
    colors.push(r * finalBrightness, g * finalBrightness, b * finalBrightness)
  }

  return { positions, colors, sizes }
}

/**
 * RealisticStarfield Component
 * Multi-layered premium starfield with depth and natural distribution
 */
export function RealisticStarfield() {
  const groupRef = useRef()

  const layerConfigs = useMemo(
    () => [
      {
        name: 'distantStars',
        count: 1400,
        minRadius: 95,
        maxRadius: 120,
        brightnessMultiplier: 0.3,
        seed: 42,
      },
      {
        name: 'mediumStars',
        count: 320,
        minRadius: 55,
        maxRadius: 85,
        brightnessMultiplier: 0.65,
        seed: 123,
      },
      {
        name: 'nearStars',
        count: 80,
        minRadius: 25,
        maxRadius: 50,
        brightnessMultiplier: 0.9,
        seed: 456,
      },
    ],
    []
  )

  const starLayers = useMemo(() => {
    return layerConfigs.map((config) => {
      const starData = generateStarField(config, config.seed)

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starData.positions), 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(starData.colors), 3))

      // Use simple PointsMaterial
      const material = new THREE.PointsMaterial({
        size: 0.5,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
      })

      return { config, geometry, material }
    })
  }, [layerConfigs])

  return (
    <group ref={groupRef}>
      {starLayers.map((layer) => (
        <points key={layer.config.name} geometry={layer.geometry} material={layer.material} />
      ))}
    </group>
  )
}
