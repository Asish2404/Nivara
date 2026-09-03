import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  HOOGHLY_RIVER_POINTS,
  WATER_BODIES,
  WETLANDS_POLYGON,
  DRAINAGE_CANALS,
  DRAINAGE_TRUNK_CONDUITS,
  DRAINAGE_JUNCTIONS,
  PRIMARY_ROADS,
  SECONDARY_ROADS,
  GREEN_RESERVES,
  RISK_OVERLAY_ZONES,
  ACTIVE_INCIDENTS_GEO,
  PUMPING_STATIONS_GEO,
  FORECAST_RADAR_CELLS,
  DISTRICT_TARGETS,
  generateKolkataUrbanFabric,
} from './kolkataGeoData'
import { useKWIStore } from '../../store/useKWIStore'

/**
 * 1. Procedural Daylight Cartographic Basemap Texture (Light GIS Palette)
 */
function createKolkataBasemapTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  const toCanvas = (x, z) => {
    const cx = ((x + 18) / 36) * 1024
    const cy = ((z + 16) / 32) * 1024
    return [cx, cy]
  }

  // 1. Crisp Pearl & Warm Alabaster Terrain Base
  ctx.fillStyle = '#eef2f6'
  ctx.fillRect(0, 0, 1024, 1024)

  // 2. Subtle Cartographic Coordinate Grid
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.12)'
  ctx.lineWidth = 1
  for (let x = -16; x <= 16; x += 4) {
    const [cx1, cy1] = toCanvas(x, -16)
    const [cx2, cy2] = toCanvas(x, 16)
    ctx.beginPath()
    ctx.moveTo(cx1, cy1)
    ctx.lineTo(cx2, cy2)
    ctx.stroke()
  }
  for (let z = -14; z <= 14; z += 4) {
    const [cx1, cy1] = toCanvas(-18, z)
    const [cx2, cy2] = toCanvas(18, z)
    ctx.beginPath()
    ctx.moveTo(cx1, cy1)
    ctx.lineTo(cx2, cy2)
    ctx.stroke()
  }

  // 3. Green Reserves (The Maidan, Eco Park, Central Park)
  ctx.fillStyle = '#d1fae5'
  GREEN_RESERVES.forEach((res) => {
    const [cx, cy] = toCanvas(res.center[0], res.center[1])
    const w = (res.size[0] / 36) * 1024
    const h = (res.size[1] / 32) * 1024
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h)
  })

  // Racecourse Oval in The Maidan
  const [rcX, rcY] = toCanvas(-1.2, 1.9)
  ctx.beginPath()
  ctx.ellipse(rcX, rcY, 26, 16, 0.2, 0, Math.PI * 2)
  ctx.fillStyle = '#a7f3d0'
  ctx.fill()
  ctx.strokeStyle = '#6ee7b7'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Botanical Gardens Shibpur
  const [bgX, bgY] = toCanvas(-5.2, 3.8)
  ctx.beginPath()
  ctx.ellipse(bgX, bgY, 32, 22, -0.2, 0, Math.PI * 2)
  ctx.fillStyle = '#bbf7d0'
  ctx.fill()

  // 4. East Kolkata Wetlands
  ctx.fillStyle = 'rgba(186, 230, 253, 0.55)'
  ctx.beginPath()
  WETLANDS_POLYGON.forEach((pt, i) => {
    const [px, py] = toCanvas(pt.x, pt.z)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.closePath()
  ctx.fill()

  // 5. Water Bodies (Lal Dighi, Rabindra Sarobar, Subhas Sarobar, Nalban, Eco Park)
  ctx.fillStyle = '#38bdf8'
  ctx.strokeStyle = '#0284c7'
  ctx.lineWidth = 1.5

  const [ldX, ldY] = toCanvas(-0.5, -1.8)
  ctx.fillRect(ldX - 6, ldY - 6, 12, 12)
  ctx.strokeRect(ldX - 6, ldY - 6, 12, 12)

  WATER_BODIES.forEach((lake) => {
    const [cx, cy] = toCanvas(lake.center[0], lake.center[1])
    const rx = (lake.radiusX / 36) * 1024
    const rz = (lake.radiusZ / 32) * 1024
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, rz, lake.rotation, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })

  // 6. Secondary City Streets Grid (Clean Slate Lines)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1.5
  SECONDARY_ROADS.forEach((road) => {
    ctx.beginPath()
    road.forEach(([x, z], i) => {
      const [cx, cy] = toCanvas(x, z)
      if (i === 0) ctx.moveTo(cx, cy)
      else ctx.lineTo(cx, cy)
    })
    ctx.stroke()
  })

  // 7. Primary Arterial Expressways (Vibrant High-Contrast Light Tones)
  PRIMARY_ROADS.forEach((road, idx) => {
    const roadColors = [
      '#d97706', // EM Bypass (Warm Amber)
      '#0284c7', // Maa Flyover (Azure Blue)
      '#059669', // Central Ave (Emerald)
      '#2563eb', // Strand Rd (Royal Blue)
      '#e11d48', // DH Rd (Coral Rose)
      '#7c3aed', // VIP Rd (Violet)
    ]
    ctx.strokeStyle = roadColors[idx % roadColors.length]
    ctx.lineWidth = 3
    ctx.beginPath()
    road.forEach(([x, z], i) => {
      const [cx, cy] = toCanvas(x, z)
      if (i === 0) ctx.moveTo(cx, cy)
      else ctx.lineTo(cx, cy)
    })
    ctx.stroke()
  })

  // 8. Hooghly River S-Curve Channel
  ctx.fillStyle = '#0284c7'
  ctx.beginPath()
  HOOGHLY_RIVER_POINTS.forEach((pt, i) => {
    const halfW = pt.width / 2
    const [cx, cy] = toCanvas(pt.x - halfW, pt.z)
    if (i === 0) ctx.moveTo(cx, cy)
    else ctx.lineTo(cx, cy)
  })
  for (let i = HOOGHLY_RIVER_POINTS.length - 1; i >= 0; i--) {
    const pt = HOOGHLY_RIVER_POINTS[i]
    const halfW = pt.width / 2
    const [cx, cy] = toCanvas(pt.x + halfW, pt.z)
    ctx.lineTo(cx, cy)
  }
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#0369a1'
  ctx.lineWidth = 2
  ctx.stroke()

  // 9. District Cartographic Label Ticks (Crisp Dark Slate)
  ctx.fillStyle = '#475569'
  ctx.font = 'bold 10px monospace'
  const labels = [
    { text: 'HOWRAH JN', x: -3.3, z: -2.7 },
    { text: 'B.B.D. BAGH', x: -0.8, z: -1.7 },
    { text: 'THE MAIDAN', x: -1.3, z: 0.9 },
    { text: 'PARK STREET', x: 0.1, z: 0.8 },
    { text: 'SALT LAKE V', x: 7.0, z: -0.9 },
    { text: 'NEW TOWN', x: 9.2, z: -2.6 },
    { text: 'E.M. BYPASS', x: 3.7, z: 1.5 },
    { text: 'BEHALA', x: -2.5, z: 4.8 },
  ]
  labels.forEach((lbl) => {
    const [cx, cy] = toCanvas(lbl.x, lbl.z)
    ctx.fillText(lbl.text, cx, cy)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

/**
 * 2. Skyscraper Window Atlas Texture (Daylight White & Soft Azure Glass)
 */
function createSkyscraperWindowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(0, 0, 512, 512)

  const floorH = 16
  const winW = 8
  const winGap = 6

  for (let y = 6; y < 512; y += floorH) {
    ctx.fillStyle = '#e2e8f0'
    ctx.fillRect(0, y - 2, 512, 2)

    for (let x = 6; x < 512; x += winW + winGap) {
      const rand = Math.random()
      if (rand > 0.35) {
        const type = Math.random()
        if (type > 0.5) {
          ctx.fillStyle = '#0284c7' // Reflective azure glass
        } else if (type > 0.25) {
          ctx.fillStyle = '#38bdf8' // Sky reflection
        } else {
          ctx.fillStyle = '#ffffff' // Pure sunlight glint
        }
        ctx.globalAlpha = 0.5 + Math.random() * 0.4
        ctx.fillRect(x, y + 2, winW, floorH - 6)
      } else {
        ctx.fillStyle = '#cbd5e1'
        ctx.globalAlpha = 0.35
        ctx.fillRect(x, y + 2, winW, floorH - 6)
      }
    }
  }

  ctx.globalAlpha = 1.0
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1.5, 3)
  return texture
}

/**
 * 3. Water Ripple Normal Map
 */
function createWaterRippleTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  const imgData = ctx.createImageData(256, 256)
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const nx = Math.sin(x * 0.12) * Math.cos(y * 0.1)
      const ny = Math.cos(x * 0.1) * Math.sin(y * 0.12)
      const idx = (y * 256 + x) * 4

      imgData.data[idx] = Math.floor(128 + nx * 50)
      imgData.data[idx + 1] = Math.floor(128 + ny * 50)
      imgData.data[idx + 2] = 245
      imgData.data[idx + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(6, 6)
  return texture
}

/**
 * 4. Ground Plane with Clean Light Basemap
 */
function AuthenticKolkataTerrain({ basemapTexture }) {
  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(36, 32, 64, 56)
    geom.rotateX(-Math.PI / 2)

    const pos = geom.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)

      let elevation = THREE.MathUtils.lerp(0.1, 0.02, (x + 10) / 22)
      if (x > -3.5 && x < -2.0) elevation += 0.035
      if (x > 5.0 && z > 0.0 && z < 6.5) elevation -= 0.025

      pos.setY(i, Math.max(elevation, 0))
    }
    geom.computeVertexNormals()
    return geom
  }, [])

  return (
    <mesh geometry={geometry} receiveShadow position={[0, -0.015, 0]}>
      <meshStandardMaterial
        map={basemapTexture}
        roughness={0.7}
        metalness={0.05}
      />
    </mesh>
  )
}

/**
 * 5. Liquid Hooghly River with Vibrant Azure Glistening Water
 */
function AuthenticHooghlyRiver({ waterTexture }) {
  const riverGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    const leftBank = []
    const rightBank = []

    for (let i = 0; i < HOOGHLY_RIVER_POINTS.length; i++) {
      const pt = HOOGHLY_RIVER_POINTS[i]
      const halfW = pt.width / 2

      let dx = 0
      let dz = 1
      if (i < HOOGHLY_RIVER_POINTS.length - 1) {
        dx = HOOGHLY_RIVER_POINTS[i + 1].x - pt.x
        dz = HOOGHLY_RIVER_POINTS[i + 1].z - pt.z
      } else {
        dx = pt.x - HOOGHLY_RIVER_POINTS[i - 1].x
        dz = pt.z - HOOGHLY_RIVER_POINTS[i - 1].z
      }
      const len = Math.hypot(dx, dz) || 1
      const nx = -dz / len
      const nz = dx / len

      leftBank.push(new THREE.Vector2(pt.x - nx * halfW, pt.z - nz * halfW))
      rightBank.push(new THREE.Vector2(pt.x + nx * halfW, pt.z + nz * halfW))
    }

    shape.moveTo(leftBank[0].x, leftBank[0].y)
    for (let i = 1; i < leftBank.length; i++) {
      shape.lineTo(leftBank[i].x, leftBank[i].y)
    }
    for (let i = rightBank.length - 1; i >= 0; i--) {
      shape.lineTo(rightBank[i].x, rightBank[i].y)
    }
    shape.closePath()

    const geom = new THREE.ShapeGeometry(shape, 32)
    geom.rotateX(-Math.PI / 2)
    return geom
  }, [])

  useFrame(({ clock }) => {
    if (waterTexture) {
      const t = clock.getElapsedTime()
      waterTexture.offset.y = -(t * 0.025) % 1.0
      waterTexture.offset.x = (t * 0.008) % 1.0
    }
  })

  return (
    <mesh
      geometry={riverGeometry}
      position={[0, 0.038, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        color="#0284c7"
        emissive="#0369a1"
        emissiveIntensity={0.25}
        normalMap={waterTexture}
        normalScale={new THREE.Vector2(0.3, 0.3)}
        roughness={0.15}
        metalness={0.4}
        transparent
        opacity={0.96}
      />
    </mesh>
  )
}

/**
 * 6. Sculpted 3D Landmarks of Kolkata (Daylight Aesthetics)
 */
function AuthenticKolkataLandmarks() {
  const beaconRef = useRef()

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      const t = clock.getElapsedTime()
      beaconRef.current.material.opacity = Math.sin(t * 3.5) > 0 ? 1 : 0.2
    }
  })

  return (
    <group>
      {/* 1. HOWRAH BRIDGE */}
      <group position={[-3.1, 0.16, -2.2]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 0.06, 0.24]} />
          <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
        </mesh>
        {[-0.55, 0.55].map((tx, i) => (
          <group key={i} position={[tx, 0, 0]}>
            <mesh position={[0, 0.38, -0.1]}>
              <boxGeometry args={[0.07, 0.74, 0.05]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.38, 0.1]}>
              <boxGeometry args={[0.07, 0.74, 0.05]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.75, 0]}>
              <boxGeometry args={[0.09, 0.05, 0.25]} />
              <meshStandardMaterial color="#cbd5e1" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.68, 0]}>
          <boxGeometry args={[1.05, 0.045, 0.22]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      </group>

      {/* 2. HOWRAH RAILWAY STATION */}
      <group position={[-4.2, 0, -2.2]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.95, 0.45, 0.5]} />
          <meshStandardMaterial color="#991b1b" roughness={0.6} />
        </mesh>
        {[-0.35, 0.35].map((tx, i) => (
          <mesh key={i} position={[tx, 0.55, 0.15]}>
            <boxGeometry args={[0.15, 0.25, 0.15]} />
            <meshStandardMaterial color="#b91c1c" />
          </mesh>
        ))}
        <mesh position={[-0.45, 0.14, 0]}>
          <boxGeometry args={[0.5, 0.18, 0.45]} />
          <meshStandardMaterial color="#64748b" metalness={0.4} />
        </mesh>
      </group>

      {/* 3. VIDYASAGAR SETU */}
      <group position={[-3.35, 0.22, -0.5]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.7, 0.06, 0.26]} />
          <meshStandardMaterial color="#475569" metalness={0.6} />
        </mesh>
        {[-0.6, 0.6].map((px, i) => (
          <group key={i} position={[px, 0, 0]}>
            <mesh position={[0, 0.6, -0.12]}>
              <boxGeometry args={[0.08, 1.2, 0.06]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
            </mesh>
            <mesh position={[0, 0.6, 0.12]}>
              <boxGeometry args={[0.08, 1.2, 0.06]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
            </mesh>
            <mesh position={[0, 1.18, 0]}>
              <boxGeometry args={[0.1, 0.07, 0.3]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. THE 42 */}
      <group position={[-0.62, 0, 0.65]}>
        <mesh position={[0, 2.9, 0]} castShadow>
          <boxGeometry args={[0.38, 5.8, 0.38]} />
          <meshStandardMaterial
            color="#e2e8f0"
            roughness={0.15}
            metalness={0.7}
          />
        </mesh>
        <mesh position={[0, 2.9, 0]}>
          <boxGeometry args={[0.4, 5.75, 0.2]} />
          <meshStandardMaterial
            color="#0284c7"
            wireframe
          />
        </mesh>
        <mesh position={[0, 5.95, 0]}>
          <coneGeometry args={[0.11, 0.55, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
        <mesh ref={beaconRef} position={[0, 6.26, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={1} />
        </mesh>
      </group>

      {/* 5. VICTORIA MEMORIAL (Pristine White Makrana Marble) */}
      <group position={[-1.0, 0, 1.0]}>
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 1.0]} />
          <meshStandardMaterial color="#0284c7" roughness={0.15} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.74, 0.18, 0.62]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.44, 0.24, 0.38]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.54, 0]}>
          <sphereGeometry args={[0.18, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.15} />
        </mesh>
      </group>

      {/* 6. BISWA BANGLA GATE */}
      <group position={[8.4, 0, -4.2]}>
        <mesh position={[-0.38, 0.48, 0]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.035, 0.045, 1.05, 12]} />
          <meshStandardMaterial color="#ffffff" metalness={0.3} />
        </mesh>
        <mesh position={[0.38, 0.48, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.035, 0.045, 1.05, 12]} />
          <meshStandardMaterial color="#ffffff" metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.94, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.38, 0.08, 16, 32]} />
          <meshStandardMaterial
            color="#0284c7"
            metalness={0.6}
            roughness={0.2}
          />
        </mesh>
      </group>
    </group>
  )
}

/**
 * 7. Traffic Flow (Daylight Slate & Amber Lights)
 */
function AuthenticTrafficFlow() {
  const headlightsRef = useRef()
  const taillightsRef = useRef()

  const trafficCurves = useMemo(() => {
    return [
      new THREE.CatmullRomCurve3(PRIMARY_ROADS[0].map(([x, z]) => new THREE.Vector3(x, 0.065, z))),
      new THREE.CatmullRomCurve3(PRIMARY_ROADS[1].map(([x, z]) => new THREE.Vector3(x, 0.065, z))),
      new THREE.CatmullRomCurve3(PRIMARY_ROADS[2].map(([x, z]) => new THREE.Vector3(x, 0.065, z))),
      new THREE.CatmullRomCurve3(PRIMARY_ROADS[5].map(([x, z]) => new THREE.Vector3(x, 0.065, z))),
    ]
  }, [])

  const numVehicles = 85
  const vehicleData = useMemo(() => {
    const arr = []
    for (let i = 0; i < numVehicles; i++) {
      arr.push({
        curveIdx: i % trafficCurves.length,
        offset: Math.random(),
        speed: 0.025 + Math.random() * 0.035,
      })
    }
    return arr
  }, [trafficCurves.length])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, delta) => {
    if (!headlightsRef.current || !taillightsRef.current) return

    vehicleData.forEach((v, i) => {
      v.offset = (v.offset + delta * v.speed) % 1.0

      const curve = trafficCurves[v.curveIdx]
      const pos = curve.getPointAt(v.offset)
      const tangent = curve.getTangentAt(v.offset)

      dummy.position.copy(pos)
      dummy.lookAt(pos.clone().add(tangent))
      dummy.updateMatrix()
      headlightsRef.current.setMatrixAt(i, dummy.matrix)

      const revOffset = (1.0 - v.offset + 0.5) % 1.0
      const revPos = curve.getPointAt(revOffset)
      const revTangent = curve.getTangentAt(revOffset).negate()

      dummy.position.copy(revPos)
      dummy.lookAt(revPos.clone().add(revTangent))
      dummy.updateMatrix()
      taillightsRef.current.setMatrixAt(i, dummy.matrix)
    })

    headlightsRef.current.instanceMatrix.needsUpdate = true
    taillightsRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={headlightsRef} args={[null, null, numVehicles]}>
        <boxGeometry args={[0.04, 0.025, 0.08]} />
        <meshBasicMaterial color="#0284c7" />
      </instancedMesh>
      <instancedMesh ref={taillightsRef} args={[null, null, numVehicles]}>
        <boxGeometry args={[0.04, 0.025, 0.08]} />
        <meshBasicMaterial color="#e11d48" />
      </instancedMesh>
    </group>
  )
}

/**
 * 8. High-Rise Skyscraper City Fabric (White Limestone, Sandstone, Carrara & Smoked Glass)
 */
function AuthenticSkyscraperCity({ windowTexture }) {
  const meshRef = useRef()
  const buildings = useMemo(() => generateKolkataUrbanFabric(), [])

  const colorPalette = useMemo(
    () => [
      new THREE.Color('#ffffff'), // Pure White Carrara Marble
      new THREE.Color('#e2e8f0'), // Pale Platinum Slate
      new THREE.Color('#cbd5e1'), // Sandstone Architectural Limestone
      new THREE.Color('#94a3b8'), // Metallic Silver Architectural Glass
      new THREE.Color('#f8fafc'), // Pearl White Tower
    ],
    []
  )

  useEffect(() => {
    if (!meshRef.current) return

    const dummy = new THREE.Object3D()
    const color = new THREE.Color()

    buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.y + 0.03, b.z)
      dummy.scale.set(b.sx, b.h, b.sz)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      color.copy(colorPalette[b.colorType])
      meshRef.current.setColorAt(i, color)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [buildings, colorPalette])

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, buildings.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        map={windowTexture}
        roughness={0.25}
        metalness={0.4}
      />
    </instancedMesh>
  )
}

/**
 * 9. Spatial Rainfall Layer
 */
function SpatialRainfallLayer({ visible }) {
  const count = 750
  const pointsRef = useRef()

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.3) * 16
      pos[i * 3 + 1] = Math.random() * 8 + 0.5
      pos[i * 3 + 2] = (Math.random() - 0.4) * 14
      spd[i] = 7.0 + Math.random() * 6.0
    }
    return [pos, spd]
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current || !visible) return
    const posAttr = pointsRef.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      let y = posAttr.getY(i) - speeds[i] * delta
      if (y < 0.1) {
        y = 8.0 + Math.random() * 2.0
      }
      posAttr.setY(i, y)
    }
    posAttr.needsUpdate = true
  })

  if (!visible) return null

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          color="#0284c7"
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>

      {/* Cloud coverage disc */}
      <mesh position={[3.5, 5.5, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7.5, 32]} />
        <meshBasicMaterial
          color="#bae6fd"
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/**
 * 10. Drainage Network Layer
 */
function DrainageNetworkLayer({ visible }) {
  const primaryRoadGeometries = useMemo(() => {
    return PRIMARY_ROADS.map((road) => {
      const points = road.map(([x, z]) => new THREE.Vector3(x, 0.05, z))
      const curve = new THREE.CatmullRomCurve3(points)
      return new THREE.TubeGeometry(curve, 56, 0.075, 4, false)
    })
  }, [])

  const canalLines = useMemo(() => {
    return DRAINAGE_CANALS.map((canal) => {
      const points = canal.map(([x, z]) => new THREE.Vector3(x, 0.04, z))
      const curve = new THREE.CatmullRomCurve3(points)
      return new THREE.TubeGeometry(curve, 32, 0.065, 6, false)
    })
  }, [])

  const conduitLines = useMemo(() => {
    return DRAINAGE_TRUNK_CONDUITS.map((trunk) => {
      const points = trunk.map(([x, z]) => new THREE.Vector3(x, 0.035, z))
      const curve = new THREE.CatmullRomCurve3(points)
      return new THREE.TubeGeometry(curve, 32, 0.035, 6, false)
    })
  }, [])

  return (
    <group>
      {/* Primary Road Tubes */}
      {primaryRoadGeometries.map((geom, idx) => {
        const colors = [
          '#d97706', // EM Bypass
          '#0284c7', // Maa Flyover
          '#059669', // Central Ave
          '#64748b', // Strand Rd
          '#e11d48', // DH Rd
          '#7c3aed', // VIP Rd
        ]
        const c = colors[idx % colors.length]

        return (
          <mesh key={`p-${idx}`} geometry={geom}>
            <meshStandardMaterial
              color={c}
              roughness={0.4}
              metalness={0.2}
            />
          </mesh>
        )
      })}

      {/* Municipal Drainage Canals & Trunks */}
      {visible && (
        <group>
          {canalLines.map((geom, idx) => (
            <mesh key={`canal-${idx}`} geometry={geom}>
              <meshStandardMaterial
                color="#0891b2"
                roughness={0.2}
                metalness={0.5}
              />
            </mesh>
          ))}

          {conduitLines.map((geom, idx) => (
            <mesh key={`conduit-${idx}`} geometry={geom}>
              <meshStandardMaterial
                color="#0284c7"
                roughness={0.3}
                metalness={0.4}
                transparent
                opacity={0.9}
              />
            </mesh>
          ))}

          {DRAINAGE_JUNCTIONS.map((junc) => (
            <group key={junc.id} position={junc.pos}>
              <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[0.14, 0.09, 0.14]} />
                <meshStandardMaterial color="#0284c7" />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  )
}

/**
 * 11. Geographic Risk Zones Layer (7 Semantic Zones)
 */
function RiskZonesLayer({ visible, selectedRiskZone, onSelectRiskZone }) {
  const pulseRef = useRef()

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = clock.getElapsedTime()
      pulseRef.current.material.opacity = 0.45 + Math.sin(t * 3) * 0.2
    }
  })

  if (!visible) return null

  return (
    <group>
      {RISK_OVERLAY_ZONES.map((zone) => {
        const isSelected = selectedRiskZone?.id === zone.id
        return (
          <group
            key={zone.id}
            position={[zone.center[0], 0.055, zone.center[1]]}
            onClick={(e) => {
              e.stopPropagation()
              onSelectRiskZone(zone)
            }}
          >
            {/* Primary Restrained Risk Zone Disc */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[zone.radiusX, 32]} />
              <meshBasicMaterial
                color={zone.color}
                transparent
                opacity={isSelected ? 0.4 : 0.22}
                depthWrite={false}
              />
            </mesh>

            {/* Solid Boundary Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
              <ringGeometry args={[zone.radiusX - 0.04, zone.radiusX, 32]} />
              <meshBasicMaterial
                color={zone.color}
                transparent
                opacity={isSelected ? 0.95 : 0.75}
              />
            </mesh>

            {/* Pulsing Highlight if Selected */}
            {isSelected && (
              <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[zone.radiusX + 0.05, zone.radiusX + 0.15, 32]} />
                <meshBasicMaterial color={zone.color} transparent opacity={0.5} />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

/**
 * 12. Active Incidents Layer (Crisp Light Badges)
 */
function IncidentsLayer({ visible, selectedIncident, onSelectIncident }) {
  const pulseRef = useRef()

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = clock.getElapsedTime()
      const s = 1 + Math.sin(t * 3.5) * 0.15
      pulseRef.current.scale.set(s, s, s)
    }
  })

  if (!visible) return null

  return (
    <group>
      {ACTIVE_INCIDENTS_GEO.map((inc) => {
        const isSelected = selectedIncident?.id === inc.id
        const isCritical = inc.severity === 'CRITICAL'
        const color = isCritical ? '#e11d48' : '#d97706'

        return (
          <group key={inc.id} position={inc.position}>
            {/* Vertical Marker Beam */}
            <mesh position={[0, 1.2, 0]}>
              <cylinderGeometry args={[0.02, 0.035, 2.4, 12]} />
              <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.8 : 0.45} />
            </mesh>

            {/* Ground Ring */}
            <mesh
              ref={inc.isPrimary ? pulseRef : null}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.08, 0]}
            >
              <ringGeometry args={[0.26, 0.42, 32]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={isSelected ? 0.95 : 0.7}
              />
            </mesh>

            <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.14, 32]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Spatial GIS Label Pin (Crisp White Card with Soft Shadow) */}
            <Html position={[0, 0.75, 0]} center distanceFactor={18} zIndexRange={[100, 0]}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectIncident(inc)
                }}
                className={`cursor-pointer transition-all duration-200 select-none flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md border shadow-[0_4px_16px_rgba(15,23,42,0.14)] ${
                  isSelected
                    ? 'border-rose-500 ring-2 ring-rose-500/30 scale-110 text-slate-900'
                    : isCritical
                    ? 'border-rose-200 hover:border-rose-400 text-rose-700'
                    : 'border-amber-200 hover:border-amber-400 text-amber-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`} />
                <span className="text-[11px] font-mono font-bold tracking-wider">{inc.id}</span>
                <span className="text-[10px] font-mono font-semibold pl-1 border-l border-slate-200 text-slate-700">
                  {inc.waterDepth}
                </span>
              </button>
            </Html>

            <mesh
              visible={false}
              position={[0, 0.6, 0]}
              onClick={(e) => {
                e.stopPropagation()
                onSelectIncident(inc)
              }}
            >
              <cylinderGeometry args={[0.6, 0.6, 1.6, 16]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/**
 * 13. Pumping Stations Layer
 */
function PumpingStationsLayer({ visible, selectedPumpStation, onSelectPumpStation }) {
  if (!visible) return null

  return (
    <group>
      {PUMPING_STATIONS_GEO.map((ps) => {
        const isSelected = selectedPumpStation?.id === ps.id
        const isAtCapacity = ps.status === 'AT CAPACITY'
        const color = isAtCapacity ? '#e11d48' : '#059669'

        return (
          <group key={ps.id} position={ps.position}>
            {/* 3D Pump Structure Model */}
            <mesh position={[0, 0.14, 0]}>
              <boxGeometry args={[0.3, 0.28, 0.3]} />
              <meshStandardMaterial
                color="#ffffff"
                roughness={0.3}
                metalness={0.4}
              />
            </mesh>
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.12, 12]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} />
            </mesh>

            {/* Station Status Ground Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
              <ringGeometry args={[0.22, 0.34, 24]} />
              <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.95 : 0.75} />
            </mesh>

            {/* GIS Label Pin */}
            <Html position={[0, 0.6, 0]} center distanceFactor={18} zIndexRange={[90, 0]}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectPumpStation(ps)
                }}
                className={`cursor-pointer transition-all duration-200 select-none flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-md border shadow-[0_4px_16px_rgba(15,23,42,0.12)] ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-110 text-slate-900'
                    : isAtCapacity
                    ? 'border-rose-200 text-rose-700'
                    : 'border-emerald-200 text-emerald-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isAtCapacity ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-mono font-bold">{ps.id}</span>
                <span className="text-[9px] font-mono text-slate-600 font-semibold">{ps.capacity}</span>
              </button>
            </Html>

            <mesh
              visible={false}
              position={[0, 0.4, 0]}
              onClick={(e) => {
                e.stopPropagation()
                onSelectPumpStation(ps)
              }}
            >
              <cylinderGeometry args={[0.5, 0.5, 1.2, 12]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/**
 * 14. Forecast Radar Visualization Layer
 */
function ForecastVisualizationLayer({ visible }) {
  if (!visible) return null

  return (
    <group>
      {FORECAST_RADAR_CELLS.map((cell, idx) => (
        <mesh
          key={idx}
          position={[cell.center[0], 0.09, cell.center[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[cell.radius - 0.25, cell.radius, 48]} />
          <meshBasicMaterial
            color="#0284c7"
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * 15. Intelligent Smooth Camera Controller
 */
function OperationalCameraController({ activeTarget, mapMode }) {
  const { camera } = useThree()
  const controlsRef = useRef()

  const { zoomTrigger, resetCameraTrigger } = useKWIStore()
  const lastZoomRef = useRef(zoomTrigger)
  const lastResetRef = useRef(resetCameraTrigger)

  const default3DPos = useMemo(() => new THREE.Vector3(-2.8, 5.2, 8.4), [])
  const default3DLookAt = useMemo(() => new THREE.Vector3(0.8, 0.4, -0.4), [])
  const default2DPos = useMemo(() => new THREE.Vector3(1.0, 16.0, 0.0), [])
  const default2DLookAt = useMemo(() => new THREE.Vector3(1.0, 0.0, 0.0), [])

  const targetCamPos = useRef(default3DPos.clone())
  const targetLookAt = useRef(default3DLookAt.clone())

  useEffect(() => {
    if (activeTarget?.cameraPos && activeTarget?.lookAt) {
      if (mapMode === '2D') {
        targetCamPos.current.set(activeTarget.lookAt[0], 14.0, activeTarget.lookAt[2])
        targetLookAt.current.set(activeTarget.lookAt[0], 0, activeTarget.lookAt[2])
      } else {
        targetCamPos.current.set(...activeTarget.cameraPos)
        targetLookAt.current.set(...activeTarget.lookAt)
      }
    } else {
      if (mapMode === '2D') {
        targetCamPos.current.copy(default2DPos)
        targetLookAt.current.copy(default2DLookAt)
      } else {
        targetCamPos.current.copy(default3DPos)
        targetLookAt.current.copy(default3DLookAt)
      }
    }
  }, [activeTarget, mapMode, default2DPos, default2DLookAt, default3DPos, default3DLookAt])

  useEffect(() => {
    if (zoomTrigger !== lastZoomRef.current) {
      const dir = zoomTrigger > lastZoomRef.current ? 1 : -1
      lastZoomRef.current = zoomTrigger

      const forward = new THREE.Vector3()
      camera.getWorldDirection(forward)
      targetCamPos.current.addScaledVector(forward, dir * 2.2)
    }
  }, [zoomTrigger, camera])

  useEffect(() => {
    if (resetCameraTrigger !== lastResetRef.current) {
      lastResetRef.current = resetCameraTrigger
      if (mapMode === '2D') {
        targetCamPos.current.copy(default2DPos)
        targetLookAt.current.copy(default2DLookAt)
      } else {
        targetCamPos.current.copy(default3DPos)
        targetLookAt.current.copy(default3DLookAt)
      }
    }
  }, [resetCameraTrigger, mapMode, default2DPos, default2DLookAt, default3DPos, default3DLookAt])

  useFrame((_, delta) => {
    const lerpSpeed = 3.2 * delta
    camera.position.lerp(targetCamPos.current, lerpSpeed)

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 3.6 * delta)
      controlsRef.current.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      minDistance={2.0}
      maxDistance={25.0}
      maxPolarAngle={mapMode === '2D' ? Math.PI / 32 : Math.PI / 2.25}
      minPolarAngle={mapMode === '2D' ? 0 : Math.PI / 12}
    />
  )
}

/**
 * Main Kolkata Digital Twin GIS Map Component (Daylight Light Mode)
 */
export function KolkataRealisticMap({
  selectedDistrict,
  onSelectDistrict,
  overrideLayers,
}) {
  const store = useKWIStore()
  const activeLayers = overrideLayers || store.activeLayers
  const mapMode = store.mapMode

  const selectedIncident = store.selectedIncident
  const selectedRiskZone = store.selectedRiskZone
  const selectedPumpStation = store.selectedPumpStation

  const basemapTexture = useMemo(() => createKolkataBasemapTexture(), [])
  const windowTexture = useMemo(() => createSkyscraperWindowTexture(), [])
  const waterTexture = useMemo(() => createWaterRippleTexture(), [])

  const activeTarget = useMemo(() => {
    if (selectedIncident) {
      const pos = selectedIncident.position || [selectedIncident.x || 6.2, 0.25, selectedIncident.y || -1.6]
      return {
        name: selectedIncident.name || selectedIncident.id,
        cameraPos: selectedIncident.cameraPos || [pos[0] - 1.6, 2.4, pos[2] + 2.2],
        lookAt: selectedIncident.lookAt || [pos[0], 0.2, pos[2]],
      }
    }
    if (selectedRiskZone) {
      const center = selectedRiskZone.center || [0, 0]
      return {
        name: selectedRiskZone.name,
        cameraPos: selectedRiskZone.cameraPos || [center[0] - 1.2, 2.8, center[1] + 1.8],
        lookAt: selectedRiskZone.lookAt || [center[0], 0.1, center[1]],
      }
    }
    if (selectedPumpStation) {
      const pos = selectedPumpStation.position || [selectedPumpStation.x || 5.6, 0.15, selectedPumpStation.y || -1.2]
      return {
        name: selectedPumpStation.name,
        cameraPos: selectedPumpStation.cameraPos || [pos[0] - 1.2, 2.2, pos[2] + 1.6],
        lookAt: selectedPumpStation.lookAt || [pos[0], 0.15, pos[2]],
      }
    }
    if (selectedDistrict) {
      const target = DISTRICT_TARGETS.find((d) => d.id === selectedDistrict)
      if (target) {
        return {
          ...target,
          cameraPos: [target.cameraPos[0] * 0.8, target.cameraPos[1] * 0.9, target.cameraPos[2] * 0.8],
          lookAt: [target.lookAt[0], 0.8, target.lookAt[2]],
        }
      }
    }
    return null
  }, [selectedIncident, selectedRiskZone, selectedPumpStation, selectedDistrict])

  return (
    <div className="absolute inset-0 z-0 bg-[#e0f2fe] w-full h-full overflow-hidden">
      <Canvas
        camera={{ position: [-2.8, 5.2, 8.4], fov: 40 }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
      >
        {/* Daylight Pearl Sky Background */}
        <color attach="background" args={['#e0f2fe']} />

        {/* Ambient Sky Light Radiance */}
        <ambientLight intensity={0.9} color="#bae6fd" />

        {/* Crisp Solar Sunlight (Daylight Key Light) */}
        <directionalLight
          position={[-12, 20, 10]}
          intensity={2.4}
          color="#fffdf5"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0003}
        />

        {/* Soft Blue Atmospheric Secondary Light */}
        <directionalLight position={[12, 14, -10]} intensity={1.2} color="#7dd3fc" />

        {/* Warm Ground Fill */}
        <pointLight position={[0, 4.0, 0]} intensity={1.2} distance={26} color="#fef08a" />
        <pointLight position={[6.2, 3.0, -1.6]} intensity={1.2} distance={14} color="#38bdf8" />
        <pointLight position={[-0.6, 3.0, 0.2]} intensity={1.2} distance={14} color="#bae6fd" />

        <fog attach="fog" args={['#e0f2fe', 16, 42]} />

        {/* 3D City & Geographic Subsystems */}
        <AuthenticKolkataTerrain basemapTexture={basemapTexture} />
        <AuthenticHooghlyRiver waterTexture={waterTexture} />
        <AuthenticKolkataLandmarks />
        <AuthenticSkyscraperCity windowTexture={windowTexture} />
        <AuthenticTrafficFlow />

        {/* Dynamic GIS Layers */}
        <DrainageNetworkLayer visible={activeLayers.drainage} />
        <RiskZonesLayer
          visible={activeLayers.risk}
          selectedRiskZone={selectedRiskZone}
          onSelectRiskZone={store.setSelectedRiskZone}
        />
        <PumpingStationsLayer
          visible={activeLayers.pumps}
          selectedPumpStation={selectedPumpStation}
          onSelectPumpStation={store.setSelectedPumpStation}
        />
        <IncidentsLayer
          visible={activeLayers.incidents}
          selectedIncident={selectedIncident}
          onSelectIncident={store.setSelectedIncident}
        />
        <SpatialRainfallLayer visible={activeLayers.rain} />
        <ForecastVisualizationLayer visible={activeLayers.forecast} />

        {/* Smooth Camera Controller */}
        <OperationalCameraController activeTarget={activeTarget} mapMode={mapMode} />
      </Canvas>
    </div>
  )
}

export default KolkataRealisticMap
