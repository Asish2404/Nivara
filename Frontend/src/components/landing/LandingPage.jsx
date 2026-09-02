import { TubesBackground } from '../3d/TubesBackground'
import { KWINavbar } from '../navigation/KWINavbar'

export function LandingPage() {
  return (
    <div className="relative w-full h-screen min-h-screen overflow-hidden bg-black select-none font-sans">
      {/* 1. Fullscreen Cinematic 3D Neon Background */}
      <TubesBackground />

      {/* 2. Floating Navbar (No connected pages or overlays) */}
      <KWINavbar />
    </div>
  )
}

export default LandingPage
