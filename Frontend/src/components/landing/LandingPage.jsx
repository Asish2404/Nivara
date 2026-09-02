import { TubesBackground } from '../3d/TubesBackground'
import { KWINavbar } from '../navigation/KWINavbar'
import Footer from '../Footer'

export function LandingPage() {
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-black text-white select-none font-sans flex flex-col justify-between">
      {/* 1. Realistic Kolkata 3D Map */}
      <KolkataMap />
      
      {/* 2. Hero Typography overlay */}
      <KolkataHero />

      {/* 1. Fullscreen Cinematic 3D Neon Background */}
      <TubesBackground />

      {/* 2. Floating Navbar */}
      <KWINavbar />

      {/* 3. Interactive Hero Viewport with subtle command scroll cue */}
      <section className="relative w-full min-h-screen flex flex-col justify-end items-center pb-16 pointer-events-none select-none z-10">
        <div className="pointer-events-auto flex flex-col items-center gap-2 px-4 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:border-cyan-400/40 transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
            <span className="text-[10px] font-mono font-medium tracking-[0.2em] text-neutral-300 uppercase">
              Scroll To Explore
            </span>
            <span className="text-[9px] font-mono text-cyan-400/80">
              // COMMAND FOOTER
            </span>
          </div>
          <svg className="w-3.5 h-3.5 text-cyan-400/80 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* 4. Connected Kolkata Water Intelligence Footer */}
      <div className="relative z-20 w-full">
        <Footer />
      </div>
    </div>
  )
}

export default LandingPage
