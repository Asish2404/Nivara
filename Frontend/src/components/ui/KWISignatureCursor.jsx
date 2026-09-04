import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * KWI “LIVE WATER SIGNAL” SIGNATURE CURSOR (GSAP-POWERED)
 * Ultra-smooth, high-precision geospatial inspection instrument.
 * Uses GSAP quickTo for zero-lag 120fps hardware-accelerated tracking,
 * GSAP state morphing transitions, and clean hairline click shockwaves.
 */
export function KWISignatureCursor() {
  const [cursorMode, setCursorMode] = useState('default')
  const [isVisible, setIsVisible] = useState(false)
  const [isInsidePhone, setIsInsidePhone] = useState(false)

  const cursorRef = useRef(null)
  const rippleContainerRef = useRef(null)
  const currentModeRef = useRef('default')
  const insidePhoneRef = useRef(false)
  const xQuickRef = useRef(null)
  const yQuickRef = useRef(null)
  const flowTweenRef = useRef(null)

  useEffect(() => {
    // 1. Mobile & Touch Screen Guard
    if (typeof window === 'undefined') return
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    // 2. Reduced Motion check
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const prefersReducedMotion = motionQuery.matches

    const cursorEl = cursorRef.current
    const rippleContainer = rippleContainerRef.current

    if (cursorEl) {
      // Initialize GSAP quickTo setters for instant, butter-smooth 120fps tracking
      xQuickRef.current = gsap.quickTo(cursorEl, 'x', {
        duration: 0.04,
        ease: 'power3.out',
      })
      yQuickRef.current = gsap.quickTo(cursorEl, 'y', {
        duration: 0.04,
        ease: 'power3.out',
      })
    }

    // Helper: GSAP-animated clean hairline click shockwave
    const spawnClickRipple = (x, y) => {
      if (prefersReducedMotion || !rippleContainer || insidePhoneRef.current) return

      const ripple = document.createElement('div')
      ripple.className = 'kwi-cursor-click-ripple'
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      rippleContainer.appendChild(ripple)

      gsap.fromTo(
        ripple,
        { scale: 0.35, opacity: 0.55 },
        {
          scale: 1.45,
          opacity: 0,
          duration: 0.38,
          ease: 'power2.out',
          onComplete: () => {
            if (ripple.parentNode === rippleContainer) {
              rippleContainer.removeChild(ripple)
            }
          },
        }
      )
    }

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e

      if (xQuickRef.current && yQuickRef.current) {
        xQuickRef.current(clientX)
        yQuickRef.current(clientY)
      }

      if (!isVisible) {
        setIsVisible(true)
        if (cursorEl) {
          gsap.to(cursorEl, { opacity: 1, duration: 0.2, ease: 'power2.out' })
        }
      }

      // Check if mouse is inside the smartphone mockup
      const target = e.target
      const isPhone = Boolean(target && target.closest('[data-phone-mockup]'))
      if (isPhone !== insidePhoneRef.current) {
        insidePhoneRef.current = isPhone
        setIsInsidePhone(isPhone)

        if (cursorEl) {
          if (isPhone) {
            gsap.to(cursorEl, { opacity: 0, scale: 0.4, duration: 0.15, ease: 'power2.in' })
          } else {
            gsap.to(cursorEl, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' })
          }
        }
      }

      if (isPhone) return

      // Detect cursor mode from DOM hierarchy
      let nextMode = 'default'

      if (target) {
        const customCursorTarget = target.closest('[data-cursor]')
        if (customCursorTarget) {
          const modeAttr = customCursorTarget.getAttribute('data-cursor')
          if (modeAttr) nextMode = modeAttr
        } else if (
          target.closest('button') ||
          target.closest('a') ||
          target.closest('[role="button"]') ||
          target.closest('.cursor-pointer') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('textarea')
        ) {
          nextMode = 'interactive'
        }
      }

      if (nextMode !== currentModeRef.current) {
        currentModeRef.current = nextMode
        setCursorMode(nextMode)
      }
    }

    const handleMouseDown = (e) => {
      if (insidePhoneRef.current) return
      spawnClickRipple(e.clientX, e.clientY)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
      if (cursorEl) {
        gsap.to(cursorEl, { opacity: 0, duration: 0.18, ease: 'power2.in' })
      }
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
      if (cursorEl) {
        gsap.to(cursorEl, { opacity: 1, duration: 0.2, ease: 'power2.out' })
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      if (flowTweenRef.current) flowTweenRef.current.kill()
    }
  }, [isVisible])

  // GSAP Mode Transition Effect
  useEffect(() => {
    const cursorEl = cursorRef.current
    if (!cursorEl || isInsidePhone) return

    if (cursorMode === 'interactive') {
      gsap.to(cursorEl, { scale: 1.15, duration: 0.18, ease: 'power2.out', overwrite: 'auto' })
    } else if (cursorMode === 'incident' || cursorMode === 'pump') {
      gsap.to(cursorEl, { scale: 1.1, duration: 0.2, ease: 'back.out(1.5)', overwrite: 'auto' })
    } else {
      gsap.to(cursorEl, { scale: 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
    }
  }, [cursorMode, isInsidePhone])

  // Don't render if touch device
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null
  }

  return (
    <>
      {/* 1. Click Ripple Shockwave Layer */}
      <div
        ref={rippleContainerRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[99998] overflow-hidden"
      />

      {/* 2. Main Signature Cursor Instrument (Managed via GSAP) */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[99999] will-change-transform opacity-0"
        style={{
          transform: 'translate3d(-100px, -100px, 0)',
        }}
      >
        <div className={`kwi-cursor-instrument mode-${cursorMode}`}>
          {/* Default / Interactive / River Mode: Precision Coordinate Reticle */}
          {(cursorMode === 'default' || cursorMode === 'interactive' || cursorMode === 'river') && (
            <div className="kwi-cursor-default">
              {/* Outer Precision Ring with 4 Micro Crosshair Ticks */}
              <div className="kwi-cursor-ring">
                <span className="kwi-tick tick-n" />
                <span className="kwi-tick tick-s" />
                <span className="kwi-tick tick-e" />
                <span className="kwi-tick tick-w" />
              </div>
              {/* High-Precision Center Coordinate Core */}
              <div className="kwi-cursor-dot">
                <div className="kwi-cursor-center" />
              </div>
            </div>
          )}

          {/* Map Mode & Risk Zone Mode: Geographic Inspection with 4 Corner Brackets */}
          {(cursorMode === 'map' || cursorMode === 'risk') && (
            <div className="kwi-cursor-map">
              <span className="bracket bracket-tl" />
              <span className="bracket bracket-tr" />
              <span className="bracket bracket-bl" />
              <span className="bracket bracket-br" />
              <div className="kwi-cursor-dot">
                <div className="kwi-cursor-center" />
              </div>
            </div>
          )}

          {/* Drainage / Canal Mode: Flow Inspection with moving flow dot */}
          {cursorMode === 'drainage' && (
            <div className="kwi-cursor-drainage">
              <div className="kwi-cursor-dot">
                <div className="kwi-cursor-center" />
              </div>
              <div className="kwi-flow-track">
                <div className="kwi-flow-particle" />
              </div>
            </div>
          )}

          {/* Pumping Station Mode: Station Inspection with targeting ring */}
          {cursorMode === 'pump' && (
            <div className="kwi-cursor-pump">
              <div className="kwi-pump-target-ring" />
              <div className="kwi-cursor-dot kwi-cursor-dot-lg">
                <div className="kwi-cursor-center" />
              </div>
            </div>
          )}

          {/* Incident Target Mode: Incident marker target ring */}
          {cursorMode === 'incident' && (
            <div className="kwi-cursor-incident">
              <div className="kwi-incident-target-ring" />
              <div className="kwi-cursor-dot">
                <div className="kwi-cursor-center" />
              </div>
            </div>
          )}

          {/* Waterbody / Wetland Mode: Water inspection ripple */}
          {cursorMode === 'waterbody' && (
            <div className="kwi-cursor-waterbody">
              <div className="kwi-waterbody-ripple" />
              <div className="kwi-cursor-dot">
                <div className="kwi-cursor-center" />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
