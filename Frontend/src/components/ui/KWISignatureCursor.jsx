import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * UNIFIED 3D ORIGAMI STEALTH PAPER PLANE CURSOR (GSAP 120FPS)
 * Sized comfortably at 26px with 3D gradients and realistic drop-shadow depth.
 * Unified single cursor across the entire system.
 */
export function KWISignatureCursor() {
  const [isVisible, setIsVisible] = useState(false)
  const cursorRef = useRef(null)
  const rippleContainerRef = useRef(null)
  const xQuickRef = useRef(null)
  const yQuickRef = useRef(null)

  useEffect(() => {
    // Mobile & Touch Screen Guard
    if (typeof window === 'undefined') return
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    // Hide default OS cursor when custom precision cursor is active
    document.documentElement.classList.add('custom-cursor-active')

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const prefersReducedMotion = motionQuery.matches

    const cursorEl = cursorRef.current
    const rippleContainer = rippleContainerRef.current

    if (cursorEl) {
      // Butter-smooth hardware-accelerated 120fps GSAP tracking
      xQuickRef.current = gsap.quickTo(cursorEl, 'x', {
        duration: 0.02,
        ease: 'power3.out',
      })
      yQuickRef.current = gsap.quickTo(cursorEl, 'y', {
        duration: 0.02,
        ease: 'power3.out',
      })
    }

    // Hairline click ripple
    const spawnClickRipple = (x, y) => {
      if (prefersReducedMotion || !rippleContainer) return

      const ripple = document.createElement('div')
      ripple.className = 'kwi-cursor-click-ripple'
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      rippleContainer.appendChild(ripple)

      gsap.fromTo(
        ripple,
        { scale: 0.2, opacity: 0.6 },
        {
          scale: 1.4,
          opacity: 0,
          duration: 0.35,
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
          gsap.to(cursorEl, { opacity: 1, duration: 0.12, ease: 'power2.out' })
        }
      }
    }

    const handleMouseDown = (e) => {
      spawnClickRipple(e.clientX, e.clientY)
      if (cursorRef.current) {
        gsap.to(cursorRef.current, { scale: 0.92, duration: 0.08, ease: 'power2.out' })
      }
    }

    const handleMouseUp = () => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, { scale: 1.0, duration: 0.15, ease: 'power2.out' })
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
      if (cursorEl) {
        gsap.to(cursorEl, { opacity: 0, duration: 0.15, ease: 'power2.in' })
      }
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
      if (cursorEl) {
        gsap.to(cursorEl, { opacity: 1, duration: 0.15, ease: 'power2.out' })
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

  // Don't render on touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null
  }

  return (
    <>
      {/* 1. Click Ripple Layer */}
      <div
        ref={rippleContainerRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[99998] overflow-hidden"
      />

      {/* 2. Unified Send Icon Paper Plane Cursor */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[99999] will-change-transform opacity-0 select-none"
        style={{
          transform: 'translate3d(-100px, -100px, 0)',
        }}
      >
        <div className="kwi-stealth-cursor-wrapper">
          <svg
            width="26"
            height="26"
            viewBox="0 0 32 32"
            fill="none"
            className="kwi-stealth-cursor-svg"
          >
            <defs>
              <filter id="sendIconShadow" x="-30%" y="-30%" width="170%" height="170%">
                <feDropShadow dx="1" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.5" />
                <feDropShadow dx="0.5" dy="0.8" stdDeviation="0.6" floodColor="#0284c7" floodOpacity="0.25" />
              </filter>
            </defs>

            <g filter="url(#sendIconShadow)">
              {/* White outer boundary for high contrast on dark backgrounds */}
              <path
                d="M3 3 L28 9 L21.5 16 L21.5 21 L17 18 L14 26 Z"
                fill="#ffffff"
                stroke="#ffffff"
                strokeWidth="2.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Main Outer Paper Plane Outline (Bold Black matching reference) */}
              <path
                d="M3 3 L28 9 L21.5 16 L21.5 21 L17 18 L14 26 Z"
                fill="#0f172a"
                stroke="#000000"
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Left Wing Interior (Crisp light fill) */}
              <path
                d="M3.5 3.5 L13.8 25 L16.8 17.5 L3.5 3.5 Z"
                fill="#f8fafc"
                stroke="#000000"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* Right Wing Interior */}
              <path
                d="M3.5 3.5 L27 8.8 L21 15.6 L3.5 3.5 Z"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* Center Spine Fold Line */}
              <line
                x1="3"
                y1="3"
                x2="21.5"
                y2="16"
                stroke="#000000"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Rear Keel Fold (Filled Black Triangle matching reference) */}
              <path
                d="M17 17.5 L21.5 15.8 L21.5 21 Z"
                fill="#000000"
                stroke="#000000"
                strokeWidth="0.8"
              />

              {/* Precision Apex Tip Hotspot Highlight */}
              <circle cx="3" cy="3" r="0.75" fill="#000000" />
            </g>
          </svg>
        </div>
      </div>
    </>
  )
}
