import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EARTH_RADIUS, INDIA_TARGET, latitudeLongitudeToVector3 } from './geoCoordinates'

// Smooth cinematic easing: slow start, controlled middle, gentle end
function smoothCinematicEase(t) {
  // Smooth step function: 3t^2 - 2t^3 (smoother than cubic)
  if (t < 0.5) {
    // First half: ease-in-out quad
    return 2 * t * t
  } else {
    // Second half: ease-in-out quad reversed
    return 1 - 2 * (1 - t) * (1 - t)
  }
}

const TRANSITION_DURATION = 5.0 // seconds
const INITIAL_DISTANCE = 6.6 // Starting camera distance (approximately)
const TARGET_DISTANCE = EARTH_RADIUS + 1.15 // Camera distance when viewing India (closer than Earth view)
const EARTH_AUTO_ROTATE_SPEED = 0.21 // Match EarthCamera autoRotateSpeed

export function GeographicTransition({ active, controls, earth, onComplete }) {
  const { camera } = useThree()
  const transitionState = useRef({
    isActive: false,
    startTime: 0,
    duration: TRANSITION_DURATION,
    initialCameraPosition: new THREE.Vector3(),
    initialCameraTarget: new THREE.Vector3(),
    initialEarthQuaternion: new THREE.Quaternion(),
    indiaSurfacePosition: new THREE.Vector3(),
    indiaCameraPosition: new THREE.Vector3(),
  })

  // Initialize transition on first frame when active becomes true
  useEffect(() => {
    if (!active || transitionState.current.isActive) return
    if (!earth.current || !controls.current) return

    const state = transitionState.current
    state.isActive = true
    state.startTime = performance.now() / 1000 // Convert to seconds

    // Store initial state
    state.initialCameraPosition.copy(camera.position)
    state.initialCameraTarget.copy(controls.current.target)
    state.initialEarthQuaternion.copy(earth.current.quaternion)

    // Calculate India's surface position in world space
    const indiaLocal = latitudeLongitudeToVector3(INDIA_TARGET)
    state.indiaSurfacePosition.copy(indiaLocal).applyQuaternion(earth.current.quaternion)

    // Calculate camera position for India view
    // Camera should be positioned along the direction toward India, at the target distance
    state.indiaCameraPosition
      .copy(state.indiaSurfacePosition)
      .normalize()
      .multiplyScalar(TARGET_DISTANCE)

    // Disable normal camera controls
    controls.current.enabled = false
  }, [active, camera, controls, earth])

  useFrame(() => {
    if (!active || !transitionState.current.isActive) return
    if (!earth.current || !controls.current) return

    const state = transitionState.current
    const now = performance.now() / 1000
    const elapsed = now - state.startTime
    const progress = Math.min(elapsed / state.duration, 1.0)

    // Use smooth cinematic easing
    const eased = smoothCinematicEase(progress)

    // Smoothly interpolate camera position using spherical interpolation
    // for more natural approach along a curved path
    const currentDistance = THREE.MathUtils.lerp(INITIAL_DISTANCE, TARGET_DISTANCE, eased)

    // Calculate direction from Earth center to initial position
    const initialDirection = state.initialCameraPosition.clone().normalize()

    // Gradually blend from initial direction to India direction
    const indiaDirection = state.indiaSurfacePosition.clone().normalize()
    const blendedDirection = new THREE.Vector3()
      .addVectors(
        initialDirection.clone().multiplyScalar(1 - eased),
        indiaDirection.clone().multiplyScalar(eased)
      )
      .normalize()

    // Set camera position along blended direction at current distance
    camera.position.copy(blendedDirection).multiplyScalar(currentDistance)

    // Smoothly interpolate camera look-at target
    const cameraTarget = new THREE.Vector3().lerpVectors(
      state.initialCameraTarget,
      state.indiaSurfacePosition,
      eased
    )

    camera.up.set(0, 1, 0)
    camera.lookAt(cameraTarget)

    // Update controls target
    controls.current.target.copy(cameraTarget)
    controls.current.update()

    // Transition complete
    if (progress >= 1.0) {
      transitionState.current.isActive = false
      controls.current.enabled = true
      onComplete()
    }
  })

  return null
}
