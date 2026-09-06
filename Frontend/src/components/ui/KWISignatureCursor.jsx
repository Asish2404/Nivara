import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * 3D GLOSSY OBSIDIAN SIGNATURE CURSOR (GSAP-POWERED)
 * High-precision hardware-accelerated 120fps tracking with 3D glossy black pointer.
 * Perfect tip alignment (0,0 hotspot), tactile click feedback, and contextual telemetry.
 */
export function KWISignatureCursor() {
  const [cursorMode, setCursorMode] = useState('default')
  const [isVisible, setIsVisible] = useState(false)
  const [isInsidePhone, setIsInsidePhone] = useState(false)
  const [isClicking, setIsClicking] = useState(false)

  const cursorRef = useRef(null)
  const cursorImgRef = useRef(null)
  const rippleContainerRef = useRef(null)
  const currentModeRef = useRef('default')
  const insidePhoneRef = useRef(false)
  const xQuickRef = useRef(null)
  const yQuickRef = useRef(null)

  useEffect(() => {
    // 1. Mobile & Touch Screen Guard
    if (typeof window === 'undefined') return
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    // Hide native cursor when custom cursor is active
    document.documentElement.classList.add('custom-cursor-active')

    // 2. Reduced Motion check
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const prefersReducedMotion = motionQuery.matches

    const cursorEl = cursorRef.current
    const rippleContainer = rippleContainerRef.current

    if (cursorEl) {
      // Initialize GSAP quickTo setters for instant, butter-smooth 120fps tracking
      xQuickRef.current = gsap.quickTo(cursorEl, 'x', {
        duration: 0.035,
        ease: 'power3.out',
      })
      yQuickRef.current = gsap.quickTo(cursorEl, 'y', {
        duration: 0.035,
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
        { scale: 0.2, opacity: 0.7 },
        {
          scale: 1.6,
          opacity: 0,
          duration: 0.42,
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
          gsap.to(cursorEl, { opacity: 1, duration: 0.15, ease: 'power2.out' })
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
            gsap.to(cursorEl, { opacity: 0, scale: 0.3, duration: 0.15, ease: 'power2.in' })
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
      setIsClicking(true)
      spawnClickRipple(e.clientX, e.clientY)
      if (cursorRef.current) {
        gsap.to(cursorRef.current, { scale: 0.94, duration: 0.1, ease: 'power2.out' })
      }
    }

    const handleMouseUp = () => {
      setIsClicking(false)
      if (cursorRef.current) {
        const targetScale = currentModeRef.current === 'interactive' ? 1.08 : 1.0
        gsap.to(cursorRef.current, { scale: targetScale, duration: 0.18, ease: 'power2.out' })
      }
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
    window.addEventListener('mouseup', handleMouseUp, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      document.documentElement.classList.remove('custom-cursor-active')
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [isVisible])

  // GSAP Mode Transition Effect
  useEffect(() => {
    const cursorEl = cursorRef.current
    if (!cursorEl || isInsidePhone || isClicking) return

    if (cursorMode === 'interactive') {
      gsap.to(cursorEl, { scale: 1.08, duration: 0.18, ease: 'power2.out', overwrite: 'auto' })
    } else if (cursorMode === 'incident' || cursorMode === 'pump' || cursorMode === 'risk') {
      gsap.to(cursorEl, { scale: 1.05, duration: 0.2, ease: 'back.out(1.5)', overwrite: 'auto' })
    } else {
      gsap.to(cursorEl, { scale: 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
    }
  }, [cursorMode, isInsidePhone, isClicking])

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

      {/* 2. 3D Glossy Obsidian Cursor Container */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[99999] will-change-transform opacity-0 select-none"
        style={{
          transform: 'translate3d(-100px, -100px, 0)',
        }}
      >
        <div className={`kwi-3d-cursor-wrapper mode-${cursorMode}`}>
          {/* Main 3D Glossy Obsidian Pointer Arrow */}
          <div className="kwi-3d-pointer-container">
            <img
              ref={cursorImgRef}
              src="/assets/cursor-black-3d.png"
              alt=""
              draggable="false"
              className="kwi-3d-pointer-img"
            />
            {/* Subtle glow accent when hovering interactive elements */}
            <div className="kwi-3d-pointer-glow" />
          </div>

          {/* Contextual Telemetry Badges (Geospatial inspection modes) */}
          {(cursorMode === 'map' || cursorMode === 'risk') && (
            <div className="kwi-cursor-telemetry-badge">
              <span className="kwi-telemetry-corner tl" />
              <span className="kwi-telemetry-corner tr" />
              <span className="kwi-telemetry-corner bl" />
              <span className="kwi-telemetry-corner br" />
              <span className="kwi-telemetry-text">GIS INSPECT</span>
            </div>
          )}

          {cursorMode === 'drainage' && (
            <div className="kwi-cursor-telemetry-flow">
              <span className="kwi-flow-dot" />
              <span className="kwi-flow-tag">HYDRO FLOW</span>
            </div>
          )}

          {cursorMode === 'pump' && (
            <div className="kwi-cursor-telemetry-pump">
              <div className="kwi-pump-pulse-ring" />
              <span className="kwi-pump-tag">PUMP TELEMETRY</span>
            </div>
          )}

          {cursorMode === 'incident' && (
            <div className="kwi-cursor-telemetry-incident">
              <div className="kwi-incident-pulse-ring" />
              <span className="kwi-incident-tag">ALERT NODE</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
