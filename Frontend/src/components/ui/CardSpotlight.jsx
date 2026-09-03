import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { audioEngine } from '../../utils/audioEngine'

export function CardSpotlight({
  children,
  className = '',
  spotlightColor = 'rgba(6, 182, 212, 0.12)',
  borderColor = 'rgba(6, 182, 212, 0.35)',
  soundFreq = 880,
  onClick,
}) {
  const cardRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setIsHovered(true)
        if (soundFreq) audioEngine.playUiChirp(soundFreq)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        setMousePos({ x: -200, y: -200 })
      }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${className}`}
    >
      {/* Animated Radial Spotlight following cursor inside card */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-[inherit]"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />

      {/* Dynamic Border Highlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, ${borderColor}, transparent 80%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
