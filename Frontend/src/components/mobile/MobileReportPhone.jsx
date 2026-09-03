import { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Signal, Wifi, Battery } from 'lucide-react'
import { useKWIStore } from '../../store/useKWIStore'
import { MobileReportForm } from './MobileReportForm'
import { MobileReportVerification } from './MobileReportVerification'

export function MobileReportPhone() {
  const { isReportSubmitted } = useKWIStore()
  const phoneRef = useRef(null)

  // Mouse tilt physics inspired by Sunflower.me
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smooth springs for natural organic damping
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 })
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 })

  // Tilt ranges: max +/- 7 degrees on X and Y
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg'])

  // Dynamic light sheen position tracking mouse
  const sheenX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%'])
  const sheenOpacity = useTransform(mouseXSpring, [-0.5, 0, 0.5], [0.35, 0.15, 0.35])

  const handleMouseMove = (e) => {
    if (!phoneRef.current) return
    const rect = phoneRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <div
      className="w-full flex justify-center py-4"
      style={{ perspective: 1200 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sunflower 3D Swivel Entrance Container */}
      <motion.div
        ref={phoneRef}
        initial={{
          opacity: 0,
          rotateY: -75,
          scale: 0.92,
          y: 24,
        }}
        animate={{
          opacity: 1,
          rotateY: 0,
          scale: 1,
          y: 0,
        }}
        transition={{
          duration: 1.4,
          ease: [0.16, 1, 0.3, 1], // Sunflower cinematic deceleration curve
        }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="w-[310px] sm:w-[325px] h-[620px] rounded-[48px] bg-[#18181b] p-[9px] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.22),0_10px_25px_-5px_rgba(15,23,42,0.1)] ring-1 ring-slate-800/80 flex flex-col justify-between select-none relative transition-shadow duration-300 hover:shadow-[0_30px_70px_-15px_rgba(15,23,42,0.28)]"
      >
        {/* Physical Side Buttons (Titanium Finish) */}
        <div className="absolute -left-[11px] top-24 w-[3.5px] h-9 bg-slate-700 rounded-l-xs shadow-xs pointer-events-none" />
        <div className="absolute -left-[11px] top-37 w-[3.5px] h-9 bg-slate-700 rounded-l-xs shadow-xs pointer-events-none" />
        <div className="absolute -right-[11px] top-28 w-[3.5px] h-14 bg-slate-700 rounded-r-xs shadow-xs pointer-events-none" />

        {/* Screen Inner Bezel */}
        <div
          className="w-full h-full rounded-[40px] bg-white overflow-hidden flex flex-col justify-between relative border border-slate-200/90 shadow-inner"
          style={{ transform: 'translateZ(10px)' }}
        >
          {/* Sunflower Specular Glass Sheen Overlay */}
          <motion.div
            style={{
              background:
                'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.4) 55%, transparent 80%)',
              left: sheenX,
              opacity: sheenOpacity,
            }}
            className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
          />

          {/* 1. Dynamic Island & Native Status Bar */}
          <div className="pt-2.5 px-5 pb-1 bg-white flex items-center justify-between z-20 relative select-none">
            <span className="text-[11px] font-semibold text-slate-900 font-mono tracking-tight">
              9:41
            </span>

            {/* Subtle Pill Dynamic Island */}
            <div className="w-22 h-4.5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
              <div className="w-1 h-1 rounded-full bg-blue-900/70" />
            </div>

            {/* Native Status Icons */}
            <div className="flex items-center gap-1.5 text-slate-900">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>

          {/* 2. Mobile App Screen Content */}
          <div className="flex-1 p-3.5 overflow-hidden flex flex-col">
            {isReportSubmitted ? (
              <MobileReportVerification />
            ) : (
              <MobileReportForm />
            )}
          </div>

          {/* 3. Bottom Home Indicator Bar */}
          <div className="py-2 bg-white flex justify-center shrink-0">
            <div className="w-28 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default MobileReportPhone
