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
import { SimulateView } from './components/views/SimulateView'
import { ReportsView } from './components/views/ReportsView'
import { ActionsView } from './components/views/ActionsView'
import { ProfileView } from './components/views/ProfileView'
import AIUnleashedAuth from './components/auth/AIUnleashedAuth'
import { useKWIStore } from './store/useKWIStore'
import './App.css'

function EarthScene({ zoomStarted, earthRef, controlsRef, onCloudEntry, onVideoReveal, onZoomComplete }) {
  return (
    <Canvas
      camera={{ position: [0, 0.05, 7.8], fov: 35 }}
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
        onCloudEntry={onCloudEntry}
        onVideoReveal={onVideoReveal}
        onComplete={onZoomComplete}
      />
      <EarthCamera controlsRef={controlsRef} explored={zoomStarted} />
    </Canvas>
  )
}

function App() {
  const { currentRoute, navigate, theme, initUser, currentUser } = useKWIStore()

  // On mount, refresh the logged-in user from the backend using the stored token.
  useEffect(() => {
    initUser()
  }, [initUser])

  // Route guard: When not signed in, user can only see the Home page ('/')
  // or auth pages ('/signup', '/login', '/signin', '/auth'). Any other page redirects to '/login'.
  useEffect(() => {
    const isPublic =
      currentRoute === '/' ||
      currentRoute === '/signup' ||
      currentRoute === '/login' ||
      currentRoute === '/signin' ||
      currentRoute === '/auth'

    if (!currentUser && !isPublic) {
      navigate('/login')
    }
  }, [currentUser, currentRoute, navigate])

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

  // Stages for Landing ('/'): 'orbit' -> 'zooming' -> 'video_active' -> 'landing_page'
  const isDirectLanding = currentRoute === '/'
  const [stage, setStage] = useState(isDirectLanding ? 'orbit' : 'landing_page')
  const [cloudsClass, setCloudsClass] = useState('')
  const [videoClass, setVideoClass] = useState('')
  const [blackOverlay, setBlackOverlay] = useState(false)

  const earthRef = useRef()
  const controlsRef = useRef()
  const videoRef = useRef(null)

  // Guarantee video element starts playing immediately and silently
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = true
      video.defaultMuted = true
      video.playsInline = true
      const startPlayback = () => {
        video.play().catch(() => { })
      }
      startPlayback()
      video.addEventListener('loadeddata', startPlayback)
      video.addEventListener('canplay', startPlayback)

      const handleUserTouch = () => {
        video.play().catch(() => { })
        window.removeEventListener('click', handleUserTouch)
        window.removeEventListener('touchstart', handleUserTouch)
      }
      window.addEventListener('click', handleUserTouch)
      window.addEventListener('touchstart', handleUserTouch)

      return () => {
        video.removeEventListener('loadeddata', startPlayback)
        video.removeEventListener('canplay', startPlayback)
        window.removeEventListener('click', handleUserTouch)
        window.removeEventListener('touchstart', handleUserTouch)
      }
    }
  }, [])

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

  // 1. Initial Earth rotation phase (0-4.5s), then initiate continuous forward zoom
  useEffect(() => {
    if (currentRoute !== '/' || stage !== 'orbit') return

    const timer = setTimeout(() => {
      setStage('zooming')
    }, 4500)

    return () => clearTimeout(timer)
  }, [stage, currentRoute])

  // 2. Atmospheric clouds envelope Earth: cue and start video from second 0
  const handleCloudEntry = useCallback(() => {
    setCloudsClass('active')
    const video = videoRef.current
    if (video) {
      video.muted = true
      video.currentTime = 0
      video.play().catch(() => { })
    }
  }, [])

  // 3. Kolkata cloudy video reveals seamlessly beneath clouds
  const handleVideoReveal = useCallback(() => {
    setVideoClass('active')
    setCloudsClass('fading')
    const video = videoRef.current
    if (video) {
      if (video.paused) {
        video.currentTime = 0
        video.play().catch(() => { })
      }
    }
  }, [])

  // 4. When 3D camera reaches cloud canopy, video is fully active
  const handleZoomComplete = useCallback(() => {
    setStage('video_active')
    setVideoClass('active')
    setCloudsClass('fading')
    const video = videoRef.current
    if (video && video.paused) {
      video.play().catch(() => { })
    }
  }, [])

  // 5. In 'video_active' stage, let Kolkata footage play before transitioning to Landing Page
  useEffect(() => {
    if (stage !== 'video_active') return

    const video = videoRef.current
    if (video && video.paused) {
      video.play().catch(() => { })
    }

    const timer = setTimeout(() => {
      setBlackOverlay(true)
      setTimeout(() => {
        setStage('landing_page')
        setBlackOverlay(false)
      }, 450)
    }, 4000)

    return () => clearTimeout(timer)
  }, [stage])

  // 6. Direct skip / access handler
  const handleSkipToLanding = useCallback(() => {
    setStage('landing_page')
    setBlackOverlay(false)
  }, [])

  const renderContent = () => {
    // If not signed in and on auth route, render Auth view
    if (currentRoute === '/login' || currentRoute === '/signin' || currentRoute === '/auth' || currentRoute === '/signup') {
      return <AIUnleashedAuth />
    }

    // If not signed in, they cannot view any protected pages
    if (!currentUser && currentRoute !== '/') {
      return <AIUnleashedAuth />
    }

    if (currentRoute === '/live-city' || currentRoute === '/incidents' || currentRoute === '/forecast') {
      return <LiveCityPage />
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

    // Root Landing Route ('/')
    return (
      <div className="min-h-screen bg-black text-white relative w-full overflow-x-hidden font-sans">
        {/* Black Screen Overlay for cinematic transitions */}
        <div
          className={`cinematic-black-screen ${blackOverlay ? 'active' : ''}`}
          aria-hidden="true"
        />

        {/* Intro Loading Sequence (3D Earth -> Continuous Zoom -> Cloudy Kolkata Video) */}
        {stage !== 'landing_page' && (
          <>
            {/* 1. 3D Earth in Space */}
            <main className="earth-experiment" aria-label="3D Earth Intro">
              <EarthScene
                zoomStarted={stage === 'zooming' || stage === 'video_active'}
                earthRef={earthRef}
                controlsRef={controlsRef}
                onCloudEntry={handleCloudEntry}
                onVideoReveal={handleVideoReveal}
                onZoomComplete={handleZoomComplete}
              />
            </main>

            {/* 2. Atmospheric Clouds & Haze Transition Overlay */}
            <div className={`atmospheric-haze-layer ${cloudsClass}`} aria-hidden="true">
              <div className="atmospheric-glow-radial" />
              <div className="atmospheric-cloud-drift" />
            </div>

            {/* 3. Existing Kolkata Cloudy Video Layer (loadingvid.mp4) */}
            <div className="kolkata-video-layer" aria-hidden="true">
              <video
                ref={videoRef}
                src="/assets/loadingvid.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className={`kolkata-loading-video ${videoClass}`}
              />
            </div>

            {/* 4. Tactical HUD Telemetry */}
            <TacticalHudOverlay
              stage={stage}
              onSkip={handleSkipToLanding}
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

