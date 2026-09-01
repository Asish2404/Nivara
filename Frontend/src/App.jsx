import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { Earth } from './components/Earth'
import { EarthCamera } from './components/EarthCamera'
import { GeographicTransition } from './components/GeographicTransition'
import { RealisticStarfield } from './components/RealisticStarfield'
import './App.css'

function EarthScene({ transitionStarted, earthRef, controlsRef, onComplete }) {
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
      <color attach="background" args={['#02050a']} />
      <ambientLight intensity={0.135} color="#668ca4" />
      <directionalLight position={[-4, 1.5, 3]} intensity={3.9} color="#fff3df" />
      <Suspense fallback={null}>
        <Earth earthRef={earthRef} />
        <RealisticStarfield />
      </Suspense>
      <GeographicTransition
        active={transitionStarted}
        controls={controlsRef}
        earth={earthRef}
        onComplete={onComplete}
      />
      <EarthCamera controlsRef={controlsRef} explored={transitionStarted} />
    </Canvas>
  )
}

function App() {
  const [transitionStarted, setTransitionStarted] = useState(false)
  const [transitionComplete, setTransitionComplete] = useState(false)
  const earthRef = useRef()
  const controlsRef = useRef()

  return (
    <main className="earth-experiment" aria-label="Interactive Earth">
      <EarthScene
        transitionStarted={transitionStarted}
        earthRef={earthRef}
        controlsRef={controlsRef}
        onComplete={() => setTransitionComplete(true)}
      />
      <div className="scene-mark" aria-hidden="true">EARTH / 01</div>
      {!transitionStarted && (
        <button className="explore-india" type="button" onClick={() => setTransitionStarted(true)}>
          EXPLORE INDIA
        </button>
      )}
      {transitionComplete && <div className="india-mark">INDIA</div>}
    </main>
  )
}

export default App
