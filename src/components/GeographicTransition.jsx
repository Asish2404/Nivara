import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EARTH_RADIUS, INDIA_TARGET, latitudeLongitudeToNorthVector3, latitudeLongitudeToVector3 } from './geoCoordinates'

const transitionDuration = 7.5
const indiaCameraAltitude = 1.3
const sunlightDirection = new THREE.Vector3(-4, 1.5, 3).normalize()

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

export function GeographicTransition({ active, controls, earth, onComplete }) {
  const { camera } = useThree()
  const elapsed = useRef(0)
  const initialized = useRef(false)
  const startPosition = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())
  const targetSurface = useRef(new THREE.Vector3())
  const destinationPosition = useRef(new THREE.Vector3())
  const animatedTarget = useRef(new THREE.Vector3())
  const localIndia = useRef(latitudeLongitudeToVector3(INDIA_TARGET))
  const earthQuaternion = useRef(new THREE.Quaternion())
  const destinationQuaternion = useRef(new THREE.Quaternion())
  const alignmentQuaternion = useRef(new THREE.Quaternion())
  const localIndiaNorth = useRef(latitudeLongitudeToNorthVector3(INDIA_TARGET))
  const targetNorth = useRef(new THREE.Vector3())
  const destinationNorth = useRef(new THREE.Vector3())

  useEffect(() => {
    if (!active || initialized.current || !earth.current || !controls.current) return

    initialized.current = true
    elapsed.current = 0
    startPosition.current.copy(camera.position)
    startTarget.current.copy(controls.current.target)
    earth.current.getWorldQuaternion(earthQuaternion.current)
    targetSurface.current.copy(localIndia.current).applyQuaternion(earthQuaternion.current)
    alignmentQuaternion.current.setFromUnitVectors(targetSurface.current.clone().normalize(), sunlightDirection)
    destinationQuaternion.current.multiplyQuaternions(alignmentQuaternion.current, earthQuaternion.current)
    targetSurface.current.copy(localIndia.current).applyQuaternion(destinationQuaternion.current)
    destinationPosition.current.copy(targetSurface.current).normalize().multiplyScalar(EARTH_RADIUS + indiaCameraAltitude)
    destinationNorth.current.copy(localIndiaNorth.current).applyQuaternion(destinationQuaternion.current).normalize()
    controls.current.enabled = false
  }, [active, camera, controls, earth])

  useFrame((_, delta) => {
    if (!active || !initialized.current) return

    elapsed.current = Math.min(transitionDuration, elapsed.current + delta)
    const progress = elapsed.current / transitionDuration
    const eased = easeInOutCubic(progress)

    earth.current.quaternion.slerpQuaternions(earthQuaternion.current, destinationQuaternion.current, eased)
    targetSurface.current.copy(localIndia.current).applyQuaternion(earth.current.quaternion)
    targetNorth.current.copy(localIndiaNorth.current).applyQuaternion(earth.current.quaternion).normalize()
    camera.position.lerpVectors(startPosition.current, destinationPosition.current, eased)
    animatedTarget.current.lerpVectors(startTarget.current, targetSurface.current, eased)
    camera.up.lerpVectors(new THREE.Vector3(0, 1, 0), destinationNorth.current, eased).normalize()
    camera.lookAt(animatedTarget.current)
    controls.current.target.copy(animatedTarget.current)
    controls.current.update()

    if (progress >= 1) {
      controls.current.enabled = true
      initialized.current = false
      onComplete()
    }
  })

  return null
}
