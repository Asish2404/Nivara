import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  HOOGHLY_RIVER_POINTS,
  WATER_BODIES,
  WETLANDS_POLYGON,
  DRAINAGE_CANALS,
  PRIMARY_ROADS,
  SECONDARY_ROADS,
  GREEN_RESERVES,
  RISK_OVERLAY_ZONES,
  HERO_INCIDENT,
  DISTRICT_TARGETS,
  generateKolkataUrbanFabric,
} from './kolkataGeoData'

/**
 * 1. Procedural High-Resolution Geospatial Basemap Canvas Texture
 * Renders an authentic cartographic basemap of Kolkata directly onto the terrain:
 * - Real Hooghly River S-curve, shoreline, and mudflats
 * - The Maidan, Race Course oval, Victoria gardens, Central Park, Eco Park, Botanical Gardens
 * - Real lakes: Lal Dighi (BBD Bagh), Rabindra Sarobar, Subhas Sarobar, Nalban, Eco Park lake
 * - Authentic road alignments: EM Bypass, Maa Flyover, Central Ave, Strand Rd, DH Rd, VIP Rd
 * - Precision geospatial grid lines & latitude/longitude markings
 */
function createKolkataBasemapTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')

  // World bounds in 3D scene coordinates: X [-18 to 18], Z [-16 to 16]
  const toCanvas = (x, z) => {
    const cx = ((x + 18) / 36) * 1024
    const cy = ((z + 16) / 32) * 1024
    return [cx, cy]
  }

  // 1. Deep midnight architectural landmass
  ctx.fillStyle = '#080d16'
  ctx.fillRect(0, 0, 1024, 1024)

  // 2. Subtle cartographic coordinate grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)'
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

  // 3. Green Reserves (The Maidan, Botanical Gardens, Central Park, Eco Park)
  ctx.fillStyle = '#0b2419'
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
  ctx.fillStyle = '#0e2b1e'
  ctx.fill()
  ctx.strokeStyle = '#1a4732'
  ctx.lineWidth = 2
  ctx.stroke()

  // Botanical Gardens Shibpur (West Bank)
  const [bgX, bgY] = toCanvas(-5.2, 3.8)
  ctx.beginPath()
  ctx.ellipse(bgX, bgY, 32, 22, -0.2, 0, Math.PI * 2)
  ctx.fillStyle = '#0a2318'
  ctx.fill()

  // 4. East Kolkata Wetlands
  ctx.fillStyle = 'rgba(10, 38, 28, 0.7)'
  ctx.beginPath()
  WETLANDS_POLYGON.forEach((pt, i) => {
    const [px, py] = toCanvas(pt.x, pt.z)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.closePath()
  ctx.fill()

  // 5. Water Bodies (Lal Dighi, Rabindra Sarobar, Subhas Sarobar, Nalban, Eco Park)
  ctx.fillStyle = '#0c2236'
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'
  ctx.lineWidth = 1.5

  // Lal Dighi (Historic BBD Bagh Tank)
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

  // 6. Secondary City Streets Grid
  ctx.strokeStyle = '#141d2c'
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

  // 7. Primary Arterial Expressways (EM Bypass, Maa Flyover, Central Ave, Strand Rd, VIP Rd)
  PRIMARY_ROADS.forEach((road, idx) => {
    const roadColors = [
      '#f59e0b', // EM Bypass: Warm Amber Gold
      '#0ea5e9', // Maa Flyover: Turquoise Sky
      '#10b981', // Central Ave: Emerald
      '#38bdf8', // Strand Rd: Sapphire
      '#f43f5e', // Diamond Harbour Rd: Coral
      '#a855f7', // VIP / Biswa Bangla: Violet
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
  ctx.fillStyle = '#061726'
  ctx.beginPath()
  // Draw western bank
  HOOGHLY_RIVER_POINTS.forEach((pt, i) => {
    const halfW = pt.width / 2
    const [cx, cy] = toCanvas(pt.x - halfW, pt.z)
    if (i === 0) ctx.moveTo(cx, cy)
    else ctx.lineTo(cx, cy)
  })
  // Draw eastern bank in reverse
  for (let i = HOOGHLY_RIVER_POINTS.length - 1; i >= 0; i--) {
    const pt = HOOGHLY_RIVER_POINTS[i]
    const halfW = pt.width / 2
    const [cx, cy] = toCanvas(pt.x + halfW, pt.z)
    ctx.lineTo(cx, cy)
  }
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#10304a'
  ctx.lineWidth = 2
  ctx.stroke()

  // 9. District Cartographic Label Ticks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.font = 'bold 9px monospace'
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
 * 2. Skyscraper Window Atlas Texture (Soft Champagne & Ivory Lighting)
 */
function createSkyscraperWindowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#0c121b'
  ctx.fillRect(0, 0, 512, 512)

  const floorH = 16
  const winW = 8
  const winGap = 6

  for (let y = 6; y < 512; y += floorH) {
    ctx.fillStyle = '#172232'
    ctx.fillRect(0, y - 2, 512, 2)

    for (let x = 6; x < 512; x += winW + winGap) {
      const rand = Math.random()
      if (rand > 0.44) {
        const type = Math.random()
        if (type > 0.55) {
          ctx.fillStyle = '#fef3c7' // Champagne
        } else if (type > 0.25) {
          ctx.fillStyle = '#f1f5f9' // Ivory
        } else {
          ctx.fillStyle = '#bae6fd' // Soft cyan
        }
        ctx.globalAlpha = 0.45 + Math.random() * 0.45
        ctx.fillRect(x, y + 2, winW, floorH - 6)
      } else if (rand > 0.2) {
        ctx.fillStyle = '#1e2d42'
        ctx.globalAlpha = 0.2
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
 * 3. Water Ripple Normal Map for Liquid Hooghly River Surface
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
 * 4. Ground Plane with Kolkata Basemap
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
        roughness={0.9}
        metalness={0.12}
      />
    </mesh>
  )
}

/**
 * 5. Liquid Hooghly River & Riverbank Quaysides
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
    <group>
      <mesh
        geometry={riverGeometry}
        position={[0, 0.038, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#0a1f33"
          emissive="#05101a"
          emissiveIntensity={0.35}
          normalMap={waterTexture}
          normalScale={new THREE.Vector2(0.25, 0.25)}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Riverbank Ghat Beacons */}
      {HOOGHLY_RIVER_POINTS.map((pt, idx) => (
        <group key={idx}>
          <mesh position={[pt.x + pt.width / 2 + 0.05, 0.07, pt.z]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color="#bae6fd" />
          </mesh>
          <mesh position={[pt.x - pt.width / 2 - 0.05, 0.07, pt.z]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color="#fef3c7" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * 6. Authentic Sculpted 3D Landmarks of Kolkata
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
      {/* 1. HOWRAH BRIDGE (Rabindra Setu) - Cantilever Steel Truss */}
      <group position={[-3.1, 0.16, -2.2]}>
        {/* Roadway Deck */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 0.06, 0.24]} />
          <meshStandardMaterial color="#475569" emissive="#78350f" emissiveIntensity={0.4} metalness={0.6} />
        </mesh>
        {/* Cantilever Towers (Howrah & Kolkata piers) */}
        {[-0.55, 0.55].map((tx, i) => (
          <group key={i} position={[tx, 0, 0]}>
            <mesh position={[0, 0.38, -0.1]}>
              <boxGeometry args={[0.07, 0.74, 0.05]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.38, 0.1]}>
              <boxGeometry args={[0.07, 0.74, 0.05]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.75, 0]}>
              <boxGeometry args={[0.09, 0.05, 0.25]} />
              <meshStandardMaterial color="#94a3b8" emissive="#f59e0b" emissiveIntensity={0.35} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.68, 0]}>
          <boxGeometry args={[1.05, 0.045, 0.22]} />
          <meshStandardMaterial color="#94a3b8" emissive="#d97706" emissiveIntensity={0.35} />
        </mesh>
      </group>

      {/* 2. HOWRAH RAILWAY STATION - Iconic Red Brick Grand Terminal */}
      <group position={[-4.2, 0, -2.2]}>
        {/* Main Red Brick Terminal */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.95, 0.45, 0.5]} />
          <meshStandardMaterial color="#881337" roughness={0.7} />
        </mesh>
        {/* Arched Clock Tower Towers */}
        {[-0.35, 0.35].map((tx, i) => (
          <mesh key={i} position={[tx, 0.55, 0.15]}>
            <boxGeometry args={[0.15, 0.25, 0.15]} />
            <meshStandardMaterial color="#9f1239" />
          </mesh>
        ))}
        {/* Platform Sheds */}
        <mesh position={[-0.45, 0.14, 0]}>
          <boxGeometry args={[0.5, 0.18, 0.45]} />
          <meshStandardMaterial color="#334155" metalness={0.5} />
        </mesh>
      </group>

      {/* 3. VIDYASAGAR SETU (Second Hooghly Bridge) - Cable-Stayed Pylons */}
      <group position={[-3.35, 0.22, -0.5]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.7, 0.06, 0.26]} />
          <meshStandardMaterial color="#334155" emissive="#0369a1" emissiveIntensity={0.35} metalness={0.6} />
        </mesh>
        {[-0.6, 0.6].map((px, i) => (
          <group key={i} position={[px, 0, 0]}>
            <mesh position={[0, 0.6, -0.12]}>
              <boxGeometry args={[0.08, 1.2, 0.06]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.6, 0.12]}>
              <boxGeometry args={[0.08, 1.2, 0.06]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.7} />
            </mesh>
            <mesh position={[0, 1.18, 0]}>
              <boxGeometry args={[0.1, 0.07, 0.3]} />
              <meshStandardMaterial color="#cbd5e1" emissive="#38bdf8" emissiveIntensity={0.45} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. THE 42 on Chowringhee (Kolkata's Supertall Skyscraper) */}
      <group position={[-0.62, 0, 0.65]}>
        <mesh position={[0, 2.9, 0]} castShadow>
          <boxGeometry args={[0.38, 5.8, 0.38]} />
          <meshStandardMaterial
            color="#1e293b"
            emissive="#0f172a"
            emissiveIntensity={0.4}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>
        <mesh position={[0, 2.9, 0]}>
          <boxGeometry args={[0.4, 5.75, 0.2]} />
          <meshStandardMaterial
            color="#94a3b8"
            emissive="#38bdf8"
            emissiveIntensity={0.35}
            wireframe
          />
        </mesh>
        <mesh position={[0, 5.95, 0]}>
          <coneGeometry args={[0.11, 0.55, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh ref={beaconRef} position={[0, 6.26, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={1} />
        </mesh>
      </group>

      {/* 5. VICTORIA MEMORIAL in The Maidan */}
      <group position={[-1.0, 0, 1.0]}>
        {/* Reflecting Pool */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 1.0]} />
          <meshStandardMaterial color="#0c2d4a" roughness={0.15} metalness={0.8} />
        </mesh>
        {/* White Marble Base Plinth */}
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.74, 0.18, 0.62]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.15} />
        </mesh>
        {/* Classical Pavilion Hall */}
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[0.44, 0.24, 0.38]} />
          <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.1} />
        </mesh>
        {/* Central Dome */}
        <mesh position={[0, 0.54, 0]}>
          <sphereGeometry args={[0.18, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#f8fafc" emissive="#f1f5f9" emissiveIntensity={0.35} />
        </mesh>
        {/* Angel of Victory */}
        <mesh position={[0, 0.74, 0]}>
          <coneGeometry args={[0.025, 0.12, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        {/* Corner Chattris */}
        {[[-0.24, -0.2], [0.24, -0.2], [-0.24, 0.2], [0.24, 0.2]].map(([cx, cz], i) => (
          <mesh key={i} position={[cx, 0.46, cz]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        ))}
      </group>

      {/* 6. EDEN GARDENS CRICKET STADIUM */}
      <group position={[-1.8, 0, -0.2]}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.44, 0.5, 0.35, 32]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.38, 32]} />
          <meshStandardMaterial color="#064e3b" roughness={0.8} />
        </mesh>
        {[[-0.46, -0.46], [0.46, -0.46], [-0.46, 0.46], [0.46, 0.46]].map(([fx, fz], i) => (
          <group key={i} position={[fx, 0.42, fz]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.02, 0.55, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <boxGeometry args={[0.12, 0.05, 0.07]} />
              <meshBasicMaterial color="#fef3c7" />
            </mesh>
          </group>
        ))}
      </group>

      {/* 7. SHAHID MINAR (Ochterlony Monument at Esplanade) */}
      <group position={[-0.55, 0, -0.7]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.025, 0.045, 0.9, 12]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.92, 0]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color="#fef3c7" />
        </mesh>
      </group>

      {/* 8. SCIENCE CITY SPIRAL DOME */}
      <group position={[3.5, 0, 1.8]}>
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.32, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* 9. BISWA BANGLA GATE (New Town) */}
      <group position={[8.4, 0, -4.2]}>
        <mesh position={[-0.38, 0.48, 0]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.035, 0.045, 1.05, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.4} />
        </mesh>
        <mesh position={[0.38, 0.48, 0]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.035, 0.045, 1.05, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.94, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.38, 0.08, 16, 32]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0369a1"
            emissiveIntensity={0.5}
            metalness={0.6}
          />
        </mesh>
      </group>

      {/* 10. SALT LAKE STADIUM (Yuva Bharati Krirangan) */}
      <group position={[4.05, 0, -1.6]}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.44, 0.48, 0.35, 32]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.48, 32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * 7. Flowing Highway Traffic Lights (Champagne Headlights & Muted Coral Taillights)
 */
function AuthenticTrafficFlow() {
  const headlightsRef = useRef()
  const taillightsRef = useRef()

  const trafficCurves = useMemo(() => {
    return [
      new THREE.CatmullRomCurve3(PRIMARY_ROADS[0].map(([x, z]) => new THREE.Vector3(x, 0.065, z))), // EM Bypass
      new THREE.CatmullRomCurve3(PRIMARY_ROADS[1].map(([x, z]) => new THREE.Vector3(x, 0.065, z))), // Maa Flyover
      new THREE.CatmullRomCurve3(PRIMARY_ROADS[2].map(([x, z]) => new THREE.Vector3(x, 0.065, z))), // Central Ave
      new THREE.CatmullRomCurve3(PRIMARY_ROADS[5].map(([x, z]) => new THREE.Vector3(x, 0.065, z))), // VIP Rd
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

      // Forward lanes: Soft warm champagne
      dummy.position.copy(pos)
      dummy.lookAt(pos.clone().add(tangent))
      dummy.updateMatrix()
      headlightsRef.current.setMatrixAt(i, dummy.matrix)

      // Reverse lanes: Soft muted coral
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
        <boxGeometry args={[0.035, 0.02, 0.07]} />
        <meshBasicMaterial color="#fef3c7" transparent opacity={0.85} />
      </instancedMesh>

      <instancedMesh ref={taillightsRef} args={[null, null, numVehicles]}>
        <boxGeometry args={[0.035, 0.02, 0.07]} />
        <meshBasicMaterial color="#f87171" transparent opacity={0.75} />
      </instancedMesh>
    </group>
  )
}

/**
 * 8. High-Rise Instanced Skyscraper City Fabric (Kolkata Density Distribution)
 */
function AuthenticSkyscraperCity({ windowTexture }) {
  const meshRef = useRef()
  const buildings = useMemo(() => generateKolkataUrbanFabric(), [])

  const colorPalette = useMemo(
    () => [
      new THREE.Color('#d4cbbe'), // Warm champagne limestone (Central Kolkata civic)
      new THREE.Color('#334155'), // Cool titanium slate (Commercial towers)
      new THREE.Color('#64748b'), // Neutral architectural steel (High-rises)
      new THREE.Color('#1e293b'), // Smoked obsidian glass (Contemporary tech)
      new THREE.Color('#cbd5e1'), // Pure architectural platinum
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
        emissiveMap={windowTexture}
        emissive="#ffffff"
        emissiveIntensity={0.45}
        roughness={0.3}
        metalness={0.7}
      />
    </instancedMesh>
  )
}

/**
 * 9. Road Tubes, Canals & Risk Inundation Zones
 */
function AuthenticCityInfrastructure() {
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
      return new THREE.TubeGeometry(curve, 32, 0.055, 6, false)
    })
  }, [])

  return (
    <group>
      {/* Primary Road Tubes with Sober Glow */}
      {primaryRoadGeometries.map((geom, idx) => {
        const colors = [
          { color: '#b45309', emissive: '#78350f' }, // EM Bypass
          { color: '#0369a1', emissive: '#075985' }, // Maa Flyover
          { color: '#047857', emissive: '#065f46' }, // Central Ave
          { color: '#334155', emissive: '#1e293b' }, // Strand Rd
          { color: '#be123c', emissive: '#9f1239' }, // DH Rd
          { color: '#4338ca', emissive: '#3730a3' }, // VIP Rd
        ]
        const c = colors[idx % colors.length]

        return (
          <mesh key={`p-${idx}`} geometry={geom}>
            <meshStandardMaterial
              color={c.color}
              emissive={c.emissive}
              emissiveIntensity={0.65}
              roughness={0.5}
              metalness={0.5}
            />
          </mesh>
        )
      })}

      {/* Municipal Drainage Canals */}
      {canalLines.map((geom, idx) => (
        <mesh key={idx} geometry={geom}>
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0369a1"
            emissiveIntensity={0.5}
            roughness={0.3}
            metalness={0.6}
          />
        </mesh>
      ))}

      {/* Inundation Risk Surfaces */}
      {RISK_OVERLAY_ZONES.map((zone) => (
        <mesh
          key={zone.id}
          position={[zone.center[0], 0.055, zone.center[1]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[zone.radiusX, 32]} />
          <meshBasicMaterial
            color={zone.color}
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * 10. Sector V Incident Marker (#SV-024)
 */
function AuthenticIncidentMarker({ onSelectIncident, isSelected }) {
  const [hovered, setHovered] = useState(false)
  const ringRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ringRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.18
      ringRef.current.scale.set(s, s, s)
    }
  })

  return (
    <group position={HERO_INCIDENT.position}>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.02, 0.04, 2.8, 12]} />
        <meshBasicMaterial color="#f43f5e" transparent opacity={0.4} />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[0.3, 0.46, 32]} />
        <meshBasicMaterial
          color="#f43f5e"
          transparent
          opacity={hovered || isSelected ? 0.9 : 0.55}
        />
      </mesh>

      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      <Html position={[0, 0.8, 0]} center distanceFactor={18} zIndexRange={[100, 0]}>
        <div
          onClick={onSelectIncident}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`cursor-pointer transition-all duration-300 select-none ${
            isSelected || hovered ? 'scale-105' : 'scale-95 opacity-90'
          }`}
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0f1a]/95 backdrop-blur-md border border-rose-500/60 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              {HERO_INCIDENT.id}
            </span>
            <span className="text-[11px] font-mono text-rose-300 font-semibold pl-1.5 border-l border-white/20">
              {HERO_INCIDENT.waterLevel}
            </span>
          </div>

          {(isSelected || hovered) && (
            <div className="mt-2 p-3.5 rounded-xl bg-[#080d16]/95 backdrop-blur-2xl border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.8)] w-72 text-left pointer-events-auto">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold mb-1">
                <span>{HERO_INCIDENT.alertLevel}</span>
                <span className="text-neutral-400">TELEMETRY</span>
              </div>
              <p className="text-sm font-bold text-white leading-snug">
                {HERO_INCIDENT.name}
              </p>
              <p className="text-xs text-neutral-300 mt-1 font-mono">
                {HERO_INCIDENT.location}
              </p>
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                <span className="text-neutral-400">DRAINAGE PUMPS:</span>
                <span className="text-emerald-400 font-semibold">{HERO_INCIDENT.pumpsStatus}</span>
              </div>
            </div>
          )}
        </div>
      </Html>

      <mesh
        visible={false}
        position={[0, 0.6, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onSelectIncident}
      >
        <cylinderGeometry args={[0.7, 0.7, 1.5, 16]} />
      </mesh>
    </group>
  )
}

/**
 * 11. Cinematic 3D Camera Controller
 */
function AuthenticCameraController({ activeTarget }) {
  const { camera } = useThree()
  const controlsRef = useRef()

  const arrivalState = useRef({
    progress: 0,
    arrived: false,
    startPos: new THREE.Vector3(0, 14, 14),
    defaultPos: new THREE.Vector3(-3.4, 4.2, 7.6),
    defaultLookAt: new THREE.Vector3(0.6, 1.0, -0.6),
  })

  const currentTargetPos = useRef(new THREE.Vector3(-3.4, 4.2, 7.6))
  const currentLookAt = useRef(new THREE.Vector3(0.6, 1.0, -0.6))

  useEffect(() => {
    if (activeTarget) {
      currentTargetPos.current.set(...activeTarget.cameraPos)
      currentLookAt.current.set(...activeTarget.lookAt)
    } else {
      currentTargetPos.current.copy(arrivalState.current.defaultPos)
      currentLookAt.current.copy(arrivalState.current.defaultLookAt)
    }
  }, [activeTarget])

  useFrame((state, delta) => {
    const s = arrivalState.current

    if (!s.arrived) {
      s.progress += delta * 0.45
      const t = Math.min(s.progress, 1)
      const ease = t * t * (3 - 2 * t)

      camera.position.lerpVectors(s.startPos, s.defaultPos, ease)
      const targetLook = new THREE.Vector3().lerpVectors(
        new THREE.Vector3(0, 0, 0),
        s.defaultLookAt,
        ease
      )

      camera.lookAt(targetLook)
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLook)
        controlsRef.current.update()
      }

      if (t >= 1) s.arrived = true
      return
    }

    if (activeTarget) {
      camera.position.lerp(currentTargetPos.current, 2.4 * delta)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(currentLookAt.current, 2.8 * delta)
        controlsRef.current.update()
      }
    } else {
      const elapsed = state.clock.getElapsedTime()
      const driftX = Math.sin(elapsed * 0.04) * 0.35
      const driftZ = Math.cos(elapsed * 0.04) * 0.25

      const targetCam = new THREE.Vector3(
        s.defaultPos.x + driftX,
        s.defaultPos.y,
        s.defaultPos.z + driftZ
      )
      camera.position.lerp(targetCam, 1.0 * delta)
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.55}
      zoomSpeed={0.8}
      minDistance={2.5}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2.3}
      minPolarAngle={Math.PI / 8}
    />
  )
}

/**
 * Main Authentic 3D Digital Twin Map of Kolkata
 */
export function KolkataRealisticMap({ selectedDistrict, onSelectDistrict }) {
  const [selectedIncident, setSelectedIncident] = useState(false)

  // Procedural Cartographic & Architectural Textures
  const basemapTexture = useMemo(() => createKolkataBasemapTexture(), [])
  const windowTexture = useMemo(() => createSkyscraperWindowTexture(), [])
  const waterTexture = useMemo(() => createWaterRippleTexture(), [])

  const activeTarget = useMemo(() => {
    if (selectedIncident) {
      return {
        name: HERO_INCIDENT.name,
        cameraPos: [4.6, 2.4, 0.8],
        lookAt: [6.2, 0.4, -1.6],
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
  }, [selectedIncident, selectedDistrict])

  const handleIncidentSelect = () => {
    setSelectedIncident((prev) => !prev)
  }

  return (
    <div className="absolute inset-0 z-0 bg-[#060910] w-full h-full overflow-hidden">
      <Canvas
        camera={{ position: [0, 14, 14], fov: 40 }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <color attach="background" args={['#060910']} />

        {/* ======================================================== */}
        {/* ARCHITECTURAL & SOBER CINEMATIC LIGHTING                 */}
        {/* ======================================================== */}

        {/* Deep atmospheric midnight fill */}
        <ambientLight intensity={0.5} color="#1e293b" />

        {/* Soft silver-blue moonlight key light (West) */}
        <directionalLight
          position={[-12, 18, 10]}
          intensity={1.9}
          color="#cbd5e1"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0003}
        />

        {/* Atmospheric rim light (North-East) */}
        <directionalLight
          position={[12, 12, -10]}
          intensity={1.1}
          color="#64748b"
        />

        {/* Warm champagne urban ground ambiance */}
        <pointLight
          position={[0, 3.5, 0]}
          intensity={1.5}
          distance={24}
          color="#fde68a"
        />

        {/* Sector V subtle fill */}
        <pointLight
          position={[6.2, 2.5, -1.6]}
          intensity={1.4}
          distance={12}
          color="#38bdf8"
        />

        {/* Central Kolkata warm fill */}
        <pointLight
          position={[-0.6, 2.5, 0.2]}
          intensity={1.4}
          distance={12}
          color="#fed7aa"
        />

        {/* Deep horizon fog */}
        <fog attach="fog" args={['#060910', 12, 34]} />

        {/* Authentic Kolkata 3D Layers */}
        <AuthenticKolkataTerrain basemapTexture={basemapTexture} />
        <AuthenticHooghlyRiver waterTexture={waterTexture} />
        <AuthenticCityInfrastructure />
        <AuthenticKolkataLandmarks />
        <AuthenticSkyscraperCity windowTexture={windowTexture} />
        <AuthenticTrafficFlow />

        {/* Sector V Incident Marker */}
        <AuthenticIncidentMarker
          onSelectIncident={handleIncidentSelect}
          isSelected={selectedIncident}
        />

        {/* 3D Oblique Camera Controller */}
        <AuthenticCameraController activeTarget={activeTarget} />
      </Canvas>
    </div>
  )
}

export default KolkataRealisticMap
