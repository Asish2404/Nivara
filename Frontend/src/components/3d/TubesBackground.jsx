import { useEffect, useRef } from 'react'

// Helper for generating vibrant random neon hex colors
const randomColors = (count) => {
  return new Array(count)
    .fill(0)
    .map(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'))
}

export function TubesBackground() {
  const canvasRef = useRef(null)
  const appRef = useRef(null)

  useEffect(() => {
    let mounted = true
    let cleanup = undefined

    const initTubes = async () => {
      if (!canvasRef.current) return

      try {
        const module = await import(
          /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js'
        )
        const TubesCursor = module.default || module

        if (!mounted || !canvasRef.current) return

        // Initialize with vibrant, colorful neon settings
        const app = TubesCursor(canvasRef.current, {
          tubes: {
            colors: ['#f967fb', '#53bc28', '#6958d5'],
            lights: {
              intensity: 220,
              colors: ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'],
            },
          },
        })

        appRef.current = app

        // Click / mousedown anywhere on the background to randomize vibrant neon colors
        const handleMouseDown = (e) => {
          // If clicked on navbar button or modal, don't trigger canvas color change
          const tag = e.target.tagName.toLowerCase()
          if (tag === 'button' || tag === 'a' || tag === 'input' || tag === 'svg' || tag === 'path') {
            return
          }

          const newTubeColors = randomColors(3)
          const newLightColors = randomColors(4)

          if (app && app.tubes) {
            if (typeof app.tubes.setColors === 'function') {
              app.tubes.setColors(newTubeColors)
            }
            if (typeof app.tubes.setLightsColors === 'function') {
              app.tubes.setLightsColors(newLightColors)
            }
          }
        }

        window.addEventListener('mousedown', handleMouseDown)

        cleanup = () => {
          window.removeEventListener('mousedown', handleMouseDown)
          if (app && typeof app.destroy === 'function') {
            app.destroy()
          }
        }
      } catch (e) {
        console.error('Failed to load TubesCursor:', e)
      }
    }

    initTubes()

    return () => {
      mounted = false
      if (cleanup) cleanup()
    }
  }, [])

  return (
    <div className="tubes-bg-container">
      <canvas id="tubes-canvas" ref={canvasRef} style={{ touchAction: 'none' }} />
    </div>
  )
}

export default TubesBackground
