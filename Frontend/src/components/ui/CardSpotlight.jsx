export function CardSpotlight({
  children,
  className = '',
  soundFreq = 880,
  onClick,
}) {
  return (
    <div
      onMouseEnter={() => {
        if (soundFreq && typeof audioEngine !== 'undefined') audioEngine.playUiChirp(soundFreq)
      }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  )
}

