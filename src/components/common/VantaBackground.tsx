import { useEffect, useRef } from 'react'

interface VantaEffect {
  destroy: () => void
}

/**
 * Animated Vanta BIRDS background (fixed, full-screen, behind content).
 * three + vanta are lazy-loaded so they only ship on pages that use this.
 * Falls back silently (no animation) if WebGL/init fails or reduced-motion.
 */
export function VantaBackground() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let effect: VantaEffect | null = null
    let cancelled = false

    void (async () => {
      try {
        const THREE = await import('three')
        // Vanta's UMD build reads window.THREE and registers window.VANTA.BIRDS.
        window.THREE = THREE
        await import('vanta/dist/vanta.birds.min')
        const BIRDS = window.VANTA?.BIRDS
        if (cancelled || !ref.current || !BIRDS) return

        const dark = document.documentElement.classList.contains('dark')
        effect = BIRDS({
          el: ref.current,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1,
          scaleMobile: 1,
          backgroundColor: dark ? 0x0c0e14 : 0xf3f4f8,
          color1: 0x4f6bff,
          color2: 0x9a5cff,
          colorMode: 'variance',
          birdSize: 1.1,
          wingSpan: 22,
          speedLimit: 4,
          separation: 40,
          alignment: 40,
          cohesion: 40,
          quantity: 3,
        })
      } catch (err) {
        console.error('Vanta init failed', err)
      }
    })()

    return () => {
      cancelled = true
      effect?.destroy()
    }
  }, [])

  return <div ref={ref} aria-hidden className="fixed inset-0 -z-10" />
}
