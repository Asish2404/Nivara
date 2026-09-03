// Zero-asset Web Audio Synthesizer for high-tech cinematic audio feedback

class AudioEngine {
  constructor() {
    this.ctx = null
    this.isMuted = true
    this.droneOsc1 = null
    this.droneOsc2 = null
    this.droneGain = null
    this.listeners = new Set()
  }

  getAudioContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  subscribe(callback) {
    this.listeners.add(callback)
    callback(!this.isMuted)
    return () => this.listeners.delete(callback)
  }

  notify() {
    this.listeners.forEach((cb) => cb(!this.isMuted))
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    const ctx = this.getAudioContext()

    if (!this.isMuted) {
      if (ctx && ctx.state === 'suspended') {
        ctx.resume()
      }
      this.playAmbientDrone()
      this.playStationLock()
    } else {
      this.stopAmbientDrone()
    }

    this.notify()
    return !this.isMuted
  }

  // 1. Ethereal, low-frequency cinematic space resonance drone
  playAmbientDrone() {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx) return

    if (this.droneGain) {
      this.droneGain.gain.cancelScheduledValues(ctx.currentTime)
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, ctx.currentTime)
      this.droneGain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 1.5)
      return
    }

    try {
      this.droneGain = ctx.createGain()
      this.droneGain.gain.setValueAtTime(0.001, ctx.currentTime)
      this.droneGain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 2.0)

      // Dual detuned oscillators for subtle binaural beating
      this.droneOsc1 = ctx.createOscillator()
      this.droneOsc2 = ctx.createOscillator()

      this.droneOsc1.type = 'sine'
      this.droneOsc1.frequency.setValueAtTime(55, ctx.currentTime) // A1

      this.droneOsc2.type = 'triangle'
      this.droneOsc2.frequency.setValueAtTime(82.4, ctx.currentTime) // E2

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(180, ctx.currentTime)

      this.droneOsc1.connect(filter)
      this.droneOsc2.connect(filter)
      filter.connect(this.droneGain)
      this.droneGain.connect(ctx.destination)

      this.droneOsc1.start()
      this.droneOsc2.start()
    } catch (e) {
      console.debug('WebAudio drone init skipped:', e)
    }
  }

  stopAmbientDrone() {
    if (!this.droneGain || !this.ctx) return
    try {
      this.droneGain.gain.cancelScheduledValues(this.ctx.currentTime)
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, this.ctx.currentTime)
      this.droneGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2)
      setTimeout(() => {
        if (this.droneOsc1) {
          try { this.droneOsc1.stop(); this.droneOsc1.disconnect() } catch (_) {}
          this.droneOsc1 = null
        }
        if (this.droneOsc2) {
          try { this.droneOsc2.stop(); this.droneOsc2.disconnect() } catch (_) {}
          this.droneOsc2 = null
        }
        this.droneGain = null
      }, 1300)
    } catch (_) {}
  }

  // 2. Cinematic atmospheric entry warp sweep during camera zoom
  playWarpSweep() {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'sawtooth'
      filter.type = 'lowpass'

      // Pitch swoops down as camera enters dense atmosphere
      osc.frequency.setValueAtTime(480, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 3.8)

      filter.frequency.setValueAtTime(1200, ctx.currentTime)
      filter.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 3.8)

      gain.gain.setValueAtTime(0.001, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.8)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.2)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 4.3)
    } catch (_) {}
  }

  // 3. Quick tactile UI blip for button or card hovers
  playUiChirp(freq = 880) {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + 0.06)

      gain.gain.setValueAtTime(0.035, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.08)
    } catch (_) {}
  }

  // 4. Harmonic double-pulse for station telemetry lock
  playStationLock() {
    if (this.isMuted) return
    const ctx = this.getAudioContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc2.type = 'sine'

      osc1.frequency.setValueAtTime(1174.66, now) // D6
      osc2.frequency.setValueAtTime(1760.00, now + 0.08) // A6

      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc1.stop(now + 0.08)
      osc2.start(now + 0.08)
      osc2.stop(now + 0.28)
    } catch (_) {}
  }
}

export const audioEngine = new AudioEngine()
