import { useState } from 'react'
import { KolkataRealisticMap } from '../3d/KolkataRealisticMap'
import { KolkataHero } from './KolkataHero'
import { KWINavbar } from '../navigation/KWINavbar'
import Footer from '../Footer'

export function LandingPage() {
  const [selectedDistrict, setSelectedDistrict] = useState(null)

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-[#060a12] text-white select-none font-sans flex flex-col justify-between">
      {/* 1. Fullscreen Hero Section Container */}
      <section className="relative w-full h-screen overflow-hidden flex flex-col justify-between">
        {/* Realistic 3D Kolkata Geospatial Map Canvas */}
        <KolkataRealisticMap
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
        />

        {/* Floating Preserved Navbar */}
        <KWINavbar />

        {/* Hero Editorial Typography & Interactive Telemetry Overlay */}
        <KolkataHero
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          onResetFocus={() => setSelectedDistrict(null)}
        />
      </section>

      {/* 2. Connected Footer */}
      <div className="relative z-20 w-full">
        <Footer />
      </div>
    </div>
  )
}

export default LandingPage
