import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EARTH_RADIUS, KOLKATA_TARGET, latitudeLongitudeToVector3 } from './geoCoordinates'

const TRANSITION_DURATION = 4.8 // seconds
const INITIAL_DISTANCE = 7.8 // Starting camera distance
const FINAL_SURFACE_DISTANCE = EARTH_RADIUS + 0.42 // ~2.47 (cloud canopy level above Kolkata)

export function GeographicTransition({ active, controls, earth, onCloudEntry, onVideoReveal, onComplete }) {
  const { camera } = useThree()
  const transitionState = useRef({
    isActive: false,
    startTime: 0,
    duration: TRANSITION_DURATION,
    initialCameraPosition: new THREE.Vector3(),
    kolkataDirection: new THREE.Vector3(),
    startDirection: new THREE.Vector3(),
    initialDistance: INITIAL_DISTANCE,
    rotAxis: new THREE.Vector3(),
    totalAngle: 0,
    triggeredClouds: false,
    triggeredVideo: false,
  })

  // Initialize transition when active becomes true
  useEffect(() => {
    if (!active || transitionState.current.isActive) return
    if (!earth.current) return

    const state = transitionState.current
    state.isActive = true
    state.startTime = performance.now() / 1000
    state.triggeredClouds = false
    state.triggeredVideo = false

    // Capture initial camera and distance
    state.initialCameraPosition.copy(camera.position)
    state.initialDistance = camera.position.length() || INITIAL_DISTANCE

    // Calculate Kolkata surface position in world space
    const kolkataLocal = latitudeLongitudeToVector3(KOLKATA_TARGET, EARTH_RADIUS)
    const kolkataWorld = kolkataLocal.clone().applyQuaternion(earth.current.quaternion)

    // Compute spherical geodesic rotation arc
    state.startDirection.copy(state.initialCameraPosition).normalize()
    state.kolkataDirection.copy(kolkataWorld).normalize()

    state.rotAxis.crossVectors(state.startDirection, state.kolkataDirection)
    if (state.rotAxis.lengthSq() > 0.00001) {
      state.rotAxis.normalize()
      state.totalAngle = state.startDirection.angleTo(state.kolkataDirection)
    } else {
      state.rotAxis.set(0, 1, 0)
      state.totalAngle = 0
    }

    // Disable OrbitControls completely
    if (controls.current) {
      controls.current.enabled = false
      if (controls.current.autoRotate !== undefined) {
        controls.current.autoRotate = false
      }
    }
  }, [active, camera, controls, earth])

  useFrame(() => {
    if (!active || !transitionState.current.isActive) return
    if (!earth.current) return

    const state = transitionState.current
    const now = performance.now() / 1000
    const elapsed = now - state.startTime
    const progress = Math.min(elapsed / state.duration, 1.0)

    // 1. Angular / Direction curve:
    // Earth smoothly rotates to center Kolkata over the first ~55% of the transition
    const dirFactor = THREE.MathUtils.clamp(progress / 0.55, 0, 1)
    const dirEased = dirFactor * dirFactor * (3 - 2 * dirFactor)

    let blendedDirection = state.startDirection
    if (state.totalAngle > 0.0001) {
      const q = new THREE.Quaternion().setFromAxisAngle(state.rotAxis, state.totalAngle * dirEased)
      blendedDirection = state.startDirection.clone().applyQuaternion(q).normalize()
    }

    // 2. CONTINUOUS FORWARD ZOOM (Continuous forward velocity):
    // Smooth monotonic acceleration without zero-velocity pauses
    const distProgress = Math.pow(progress, 1.25)
    const currentDistance = THREE.MathUtils.lerp(
      state.initialDistance,
      FINAL_SURFACE_DISTANCE,
      distProgress
    )

    // Position camera along blended direction vector
    camera.position.copy(blendedDirection).multiplyScalar(currentDistance)

    // 3. Stable Look-At: Looking directly toward Earth center [0, 0, 0]
    // Because Kolkata is along the ray from [0,0,0], looking at [0,0,0] perfectly centers Kolkata
    // without ANY near-target singularity, noise amplification, or gimbal vibration!
    camera.up.set(0, 1, 0)
    camera.lookAt(0, 0, 0)

    // Trigger atmospheric clouds stage
    if (progress >= 0.52 && !state.triggeredClouds) {
      state.triggeredClouds = true
      onCloudEntry?.()
    }

    // Trigger video reveal stage
    if (progress >= 0.68 && !state.triggeredVideo) {
      state.triggeredVideo = true
      onVideoReveal?.()
    }

    // When progress reaches 1.0, hand off to video stage
    if (progress >= 1.0) {
      transitionState.current.isActive = false
      onComplete?.()
    }
  })

  return null
}

