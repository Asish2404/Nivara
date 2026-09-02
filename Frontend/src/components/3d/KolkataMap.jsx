import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

// A simple deterministic grid of buildings that somewhat resembles city density
function CityGeometry() {
  const meshRef = useRef()
  
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  // Generate a realistic layout of buildings
  // We'll create a grid, but leave the western side empty for the river
  const numBuildings = 3000
  const buildings = useMemo(() => {
    const b = []
    for (let i = 0; i < numBuildings; i++) {
      // Kolkata layout roughly:
      // X: -10 to 10 (West to East)
      // Z: -10 to 10 (North to South)
      // River is around X = -4 to -2
      let x = (Math.random() - 0.5) * 20
      let z = (Math.random() - 0.5) * 20
      
      // Avoid river area (x between -4 and -2, with some meandering)
      const riverCurve = Math.sin(z * 0.5) * 1.5 - 3
      if (Math.abs(x - riverCurve) < 1.5) {
        continue // Skip river
      }
      
      // Central density (around x=0, z=0)
      const distToCenter = Math.sqrt(x*x + z*z)
      const isCentral = distToCenter < 4
      const isSectorV = x > 3 && x < 6 && z > -2 && z < 2 // Sector V to the east
      
      let height = Math.random() * 0.3 + 0.1
      if (isCentral) height += Math.random() * 0.8
      if (isSectorV) height += Math.random() * 0.5 + 0.2
      
      // Scale variations
      const sx = Math.random() * 0.2 + 0.1
      const sz = Math.random() * 0.2 + 0.1
      
      b.push({ x, y: height / 2, z, h: height, sx, sz })
    }
    return b
  }, [])
  
  useFrame(() => {
    if (meshRef.current) {
      buildings.forEach((b, i) => {
        dummy.position.set(b.x, b.y, b.z)
        dummy.scale.set(b.sx, b.h, b.sz)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
      })
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  })
  
  return (
    <instancedMesh ref={meshRef} args={[null, null, buildings.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#88929e" roughness={0.8} metalness={0.2} />
    </instancedMesh>
  )
}

function River() {
  const points = useMemo(() => {
    const pts = []
    for (let z = -12; z <= 12; z += 0.5) {
      const x = Math.sin(z * 0.5) * 1.5 - 3
      pts.push(new THREE.Vector2(x - 0.8, z))
      pts.push(new THREE.Vector2(x + 0.8, z))
    }
    return pts
  }, [])
  
  return (
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[24, 24, 64, 64]} />
      <meshStandardMaterial color="#1a3b5c" roughness={0.1} metalness={0.8} transparent opacity={0.9} />
    </mesh>
  )
}

function Terrain() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#2d3b2d" roughness={1} metalness={0} />
    </mesh>
  )
}

function IncidentMarker({ position, id, onClick }) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <group position={position}>
      {/* Subtle pulsing ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.2, 0.3, 32]} />
        <meshBasicMaterial color="#ff5a5f" transparent opacity={hovered ? 0.8 : 0.4} />
      </mesh>
      
      {/* Center dot */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 32]} />
        <meshBasicMaterial color="#ff5a5f" />
      </mesh>
      
      {/* Label */}
      <Html position={[0, 0.5, 0]} center style={{ pointerEvents: 'none' }}>
        <div className={`px-2 py-1 text-xs font-mono font-bold rounded transition-opacity duration-300 ${hovered ? 'bg-red-500/90 text-white opacity-100' : 'bg-black/50 text-red-200 border border-red-500/30 opacity-70 backdrop-blur-sm'}`}>
          {id}
        </div>
      </Html>
      
      {/* Hitbox */}
      <mesh visible={false} position={[0, 0.5, 0]} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)} onClick={onClick}>
        <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
      </mesh>
    </group>
  )
}

function CameraController({ focusPos }) {
  const { camera } = useThree()
  
  useFrame((state, delta) => {
    if (focusPos) {
      // Interpolate towards focus position
      const targetPos = new THREE.Vector3(focusPos.x + 2, focusPos.y + 3, focusPos.z + 4)
      camera.position.lerp(targetPos, 2 * delta)
      
      const targetLookAt = new THREE.Vector3(focusPos.x, focusPos.y, focusPos.z)
      camera.lookAt(targetLookAt) // simple lookAt
    } else {
      // Slow cinematic orbit
      const time = state.clock.elapsedTime
      camera.position.x = Math.sin(time * 0.05) * 8
      camera.position.z = Math.cos(time * 0.05) * 8 + 2
      camera.position.y = 5
      camera.lookAt(0, 0, 0)
    }
  })
  
  return null
}

export function KolkataMap() {
  const [focusPos, setFocusPos] = useState(null)
  
  const handleIncidentClick = () => {
    // Sector V approximate location
    setFocusPos(new THREE.Vector3(4.5, 0, 0))
  }
  
  return (
    <div className="absolute inset-0 z-0 bg-[#050914]">
      <Canvas
        camera={{ position: [0, 5, 10], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.4} color="#b0c4de" />
        <directionalLight 
          position={[10, 10, -5]} 
          intensity={1.5} 
          color="#ffeedd" 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
        />
        <directionalLight 
          position={[-10, 5, 5]} 
          intensity={0.5} 
          color="#7aa8d6" 
        />
        
        <Suspense fallback={null}>
          <Terrain />
          <River />
          <CityGeometry />
          
          <IncidentMarker 
            position={[4.5, 0, 0]} 
            id="#SV-024" 
            onClick={handleIncidentClick} 
          />
          
          <CameraController focusPos={focusPos} />
        </Suspense>
        
        {/* Cinematic fog */}
        <fog attach="fog" args={['#050914', 5, 25]} />
      </Canvas>
    </div>
  )
}

export default KolkataMap
