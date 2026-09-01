import { EarthAtmosphere } from './EarthAtmosphere'
import { EarthClouds } from './EarthClouds'
import { EarthNightLights } from './EarthNightLights'
import { EarthSurface } from './EarthSurface'

export function Earth({ earthRef }) {
  return (
    <group ref={earthRef} rotation={[0.08, -0.65, 0.04]}>
      <EarthSurface />
      <EarthNightLights />
      <EarthClouds />
      <EarthAtmosphere />
    </group>
  )
}
