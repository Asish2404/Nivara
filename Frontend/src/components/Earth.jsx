import { EarthAtmosphere } from './EarthAtmosphere'
import { EarthClouds } from './EarthClouds'
import { EarthNightLights } from './EarthNightLights'
import { EarthSurface } from './EarthSurface'
import { TargetSonarRipple } from './3d/TargetSonarRipple'
import { GlobalDataStreams } from './3d/GlobalDataStreams'
import { OrbitalSatellites } from './3d/OrbitalSatellites'

export function Earth({ earthRef }) {
  return (
    <group ref={earthRef} rotation={[0.08, -0.65, 0.04]}>
      <EarthSurface />
      <EarthNightLights />
      <EarthClouds />
      <EarthAtmosphere />
      <TargetSonarRipple />
      <GlobalDataStreams />
      <OrbitalSatellites />
    </group>
  )
}

