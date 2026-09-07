import { Canvas } from '@react-three/fiber'
import { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { Sparkles } from '@react-three/drei'
import { Earth } from './components/Earth'
import { EarthCamera } from './components/EarthCamera'
import { GeographicTransition } from './components/GeographicTransition'
import { RealisticStarfield } from './components/RealisticStarfield'
import { TacticalHudOverlay } from './components/ui/TacticalHudOverlay'
import { KWISignatureCursor } from './components/ui/KWISignatureCursor'
import { SmoothScrollProvider } from './components/ui/SmoothScrollProvider'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { LandingPage } from './components/landing/LandingPage'


import { LiveCityPage } from './components/views/LiveCityPage'
import { SubpageLayout } from './components/views/SubpageLayout'
import { IncidentsView } from './components/views/IncidentsView'
import { ForecastView } from './components/views/ForecastView'
import { SimulateView } from './components/views/SimulateView'
import { ReportsView } from './components/views/ReportsView'
import { ActionsView } from './components/views/ActionsView'
import { ProfileView } from './components/views/ProfileView'
import AIUnleashedAuth from './components/auth/AIUnleashedAuth'
import { useKWIStore } from './store/useKWIStore'
import './App.css'

function EarthScene({ zoomStarted, earthRef, controlsRef, onZoomComplete }) {
  return (
    <Canvas
      camera={{ position: [0, 0.05, 6.6], fov: 35 }}
      dpr={[1, 2]}
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
        <Sparkles count={55} scale={10} size={2.5} speed={0.4} opacity={0.35} color="#00f0ff" />
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
  const { currentRoute, navigate, theme, initUser } = useKWIStore()

  // On mount, refresh the logged-in user from the backend using the stored token.
  useEffect(() => {
    initUser()
  }, [initUser])

  // Central theme application: resolve 'system' via prefers-color-scheme,
  // apply .dark class + color-scheme on <html>, and follow OS changes live.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = (dark) => {
      const root = document.documentElement
      root.classList.toggle('dark', dark)
      root.style.colorScheme = dark ? 'dark' : 'light'
    }
    const resolveAndApply = () => {
      if (theme === 'system') applyTheme(mq.matches)
      else applyTheme(theme === 'dark')
    }
    resolveAndApply()
    if (theme === 'system') mq.addEventListener('change', resolveAndApply)
    return () => mq.removeEventListener('change', resolveAndApply)
  }, [theme])

  // Stages for Landing ('/'): 'orbit' (0-5s) -> 'zooming' -> 'black_screen' -> 'landing_page'
  const isDirectLanding = currentRoute === '/'
  const [stage, setStage] = useState(isDirectLanding ? 'orbit' : 'landing_page')
  const [blackOverlay, setBlackOverlay] = useState(false)

  const earthRef = useRef()
  const controlsRef = useRef()

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/'
      navigate(path)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

  // Handle route changes: scroll to top and ensure landing stage
  useEffect(() => {
    window.scrollTo(0, 0)
    if (currentRoute !== '/') {
      setStage('landing_page')
    }
  }, [currentRoute])

  // 1. 0s to 5s of clean Earth rotation, then zoom to India (only on initial landing route '/')
  useEffect(() => {
    if (currentRoute !== '/' || stage !== 'orbit') return

    const timer = setTimeout(() => {
      setStage('zooming')
    }, 5000)

    return () => clearTimeout(timer)
  }, [stage, currentRoute])

  // 2. When zoom into India completes, trigger -> Kolkata
  const handleZoomComplete = useCallback(() => {
    setStage('landing_page')
    setBlackOverlay(false)
  }, [])

  const renderContent = () => {
    if (currentRoute === '/live-city') {
      return <LiveCityPage />
    }

    if (currentRoute === '/incidents') {
      return (
        <SubpageLayout>
          <IncidentsView />
        </SubpageLayout>
      )
    }

    if (currentRoute === '/forecast') {
      return (
        <SubpageLayout>
          <ForecastView />
        </SubpageLayout>
      )
    }

    if (currentRoute === '/simulate') {
      return (
        <SubpageLayout>
          <SimulateView />
        </SubpageLayout>
      )
    }

    if (currentRoute === '/reports' || currentRoute === '/report' || currentRoute === '/my-reports') {
      return (
        <SubpageLayout>
          <ReportsView />
        </SubpageLayout>
      )
    }

    if (currentRoute === '/profile' || currentRoute === '/my-profile') {
      return (
        <SubpageLayout>
          <ProfileView />
        </SubpageLayout>
      )
    }

    if (currentRoute === '/action-center' || currentRoute === '/respond') {
      return (
        <SubpageLayout>
          <ActionsView />
        </SubpageLayout>
      )
    }

    if (currentRoute === '/login' || currentRoute === '/auth' || currentRoute === '/signup') {
      return <AIUnleashedAuth />
    }

    // Root Landing Route ('/')
    return (
      <div className="min-h-screen bg-black text-white relative w-full overflow-x-hidden font-sans">
        {/* Black Screen Overlay for cinematic transitions */}
        <div
          className={`cinematic-black-screen ${blackOverlay ? 'active' : ''}`}
          aria-hidden="true"
        />

        {/* Intro Phase (0-10s): 3D Earth in Space with Edolus-style HUD */}
        {stage !== 'landing_page' && (
          <>
            <main className="earth-experiment" aria-label="3D Earth Intro">
              <EarthScene
                zoomStarted={stage === 'zooming' || stage === 'black_screen'}
                earthRef={earthRef}
                controlsRef={controlsRef}
                onZoomComplete={handleZoomComplete}
              />
            </main>
            <TacticalHudOverlay
              stage={stage}
              onSkip={handleZoomComplete}
            />
          </>
        )}

        {/* Landing Page Phase */}
        {stage === 'landing_page' && <LandingPage />}
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <SmoothScrollProvider>
        {/* Global KWI Signature "Live Water Signal" Cursor */}
        <KWISignatureCursor />
        {renderContent()}
      </SmoothScrollProvider>
    </ErrorBoundary>
  )
}

export default App
