import React from 'react'

export function BorderBeam({
  className = '',
  size = 200,
  duration = 12,
  borderWidth = 1.5,
  colorFrom = '#00f0ff',
  colorTo = '#3b82f6',
  delay = 0,
}) {
  return (
    <div
      style={{
        '--size': `${size}px`,
        '--duration': `${duration}s`,
        '--border-width': `${borderWidth}px`,
        '--color-from': colorFrom,
        '--color-to': colorTo,
        '--delay': `-${delay}s`,
      }}
      className={`pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] ${className}`}
    >
      <div
        className="absolute aspect-square w-[var(--size)] bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent"
        style={{
          offsetAnchor: 'calc(var(--size) / 2) calc(var(--size) / 2)',
          offsetPath: 'rect(0 auto auto 0 round var(--size))',
          animation: 'border-beam var(--duration) infinite linear var(--delay)',
        }}
      />
    </div>
  )
}
