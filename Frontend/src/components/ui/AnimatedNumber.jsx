import { useEffect, useState, useRef } from 'react'

export function AnimatedNumber({ value, duration = 1200, decimals = 0, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0
    const start = prevValue.current
    const startTime = performance.now()

    let animationFrameId
    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out expo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = start + (target - start) * ease

      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        prevValue.current = target
      }
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [value, duration])

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString()

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  )
}
