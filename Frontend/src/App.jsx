import { Canvas } from '@react-three/fiber'
import { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { Earth } from './components/Earth'
import { EarthCamera } from './components/EarthCamera'
import { GeographicTransition } from './components/GeographicTransition'
import { RealisticStarfield } from './components/RealisticStarfield'
import { LandingPage } from './components/landing/LandingPage'
import './App.css'

function EarthScene({ zoomStarted, earthRef, controlsRef, onZoomComplete }) {
  return (
    <Canvas
      camera={{ position: [0, 0.05, 6.6], fov: 35 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.AgXToneMapping
        gl.toneMappingExposure = 1.38
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.16} color="#668ca4" />
      <directionalLight position={[-4, 1.5, 3]} intensity={4.0} color="#fff3df" />
      <directionalLight position={[4, -1, -2]} intensity={0.5} color="#00f0ff" />

      <Suspense fallback={null}>
        <Earth earthRef={earthRef} />
        <RealisticStarfield />
      </Suspense>

      <GeographicTransition
        active={zoomStarted}
        controls={controlsRef}
        earth={earthRef}
        onComplete={onZoomComplete}
      />
      <EarthCamera controlsRef={controlsRef} explored={zoomStarted} />
    </Canvas>
  )
}

function App() {
  // Stages: 'orbit' (0-5s) -> 'zooming' (point & zoom to India) -> 'black_screen' -> 'landing_page'
  const [stage, setStage] = useState('orbit')
  const [blackOverlay, setBlackOverlay] = useState(false)

  const earthRef = useRef()
  const controlsRef = useRef()

  // 1. 0s to 5s of clean Earth rotation, then zoom to India
  useEffect(() => {
    if (stage !== 'orbit') return

    const timer = setTimeout(() => {
      setStage('zooming')
    }, 5000)

    return () => clearTimeout(timer)
  }, [stage])

  // 2. When zoom into India completes, trigger -> kolkata
  const handleZoomComplete = useCallback(() => {
    setStage('black_screen')
    setBlackOverlay(true)

    // 3. After 1.2s of black screen, reveal the landing page with 3D animation + floating navbar
    setTimeout(() => {
      setStage('landing_page')
      setTimeout(() => {
        setBlackOverlay(false)
      }, 50)
    }, 300)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white relative w-full overflow-x-hidden font-sans">
      {/* Black Screen Overlay for cinematic transitions */}
      <div
        className={`cinematic-black-screen ${blackOverlay ? 'active' : ''}`}
        aria-hidden="true"
      />

      {/* Intro Phase (0-10s): 3D Earth in Space with zero text */}
      {stage !== 'landing_page' && (
        <main className="earth-experiment" aria-label="3D Earth Intro">
          <EarthScene
            zoomStarted={stage === 'zooming' || stage === 'black_screen'}
            earthRef={earthRef}
            controlsRef={controlsRef}
            onZoomComplete={handleZoomComplete}
          />
        </main>
      )}

      {/* Landing Page Phase: Fullscreen 3D Colorful Tubes Animation + Floating KWI Command Navbar + Footer */}
      {stage === 'landing_page' && <LandingPage />}
    </div>
  )
}

export default App

