import * as THREE from 'three'

export const INDIA_TARGET = Object.freeze({ latitude: 22.5, longitude: 79.0 })
export const EARTH_RADIUS = 2.05

export function latitudeLongitudeToVector3({ latitude, longitude }, radius = EARTH_RADIUS) {
  const latitudeRadians = THREE.MathUtils.degToRad(latitude)
  const longitudeRadians = THREE.MathUtils.degToRad(longitude)
  const cosLatitude = Math.cos(latitudeRadians)

  return new THREE.Vector3(
    radius * cosLatitude * Math.cos(longitudeRadians),
    radius * Math.sin(latitudeRadians),
    -radius * cosLatitude * Math.sin(longitudeRadians),
  )
}

export function latitudeLongitudeToNorthVector3({ latitude, longitude }) {
  const latitudeRadians = THREE.MathUtils.degToRad(latitude)
  const longitudeRadians = THREE.MathUtils.degToRad(longitude)

  return new THREE.Vector3(
    -Math.sin(latitudeRadians) * Math.cos(longitudeRadians),
    Math.cos(latitudeRadians),
    Math.sin(latitudeRadians) * Math.sin(longitudeRadians),
  )
}
