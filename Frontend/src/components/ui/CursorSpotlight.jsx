import { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

export function CursorSpotlight() {
  const [isVisible, setIsVisible] = useState(false)

  const springConfig = { damping: 28, stiffness: 200, mass: 0.5 }
  const mouseX = useSpring(-500, springConfig)
  const mouseY = useSpring(-500, springConfig)

  useEffect(() => {
    // Only activate on pointer-enabled devices (no mobile touch clutter)
    if (window.matchMedia('(pointer: coarse)').matches) return

    const handleMouseMove = (e) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseLeave = () => setIsVisible(false)

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [mouseX, mouseY, isVisible])

  if (!isVisible) return null

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-500 overflow-hidden"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <motion.div
        className="w-[500px] h-[500px] rounded-full absolute -top-[250px] -left-[250px]"
        style={{
          x: mouseX,
          y: mouseY,
          background:
            'radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)',
        }}
      />
    </motion.div>
  )
}
