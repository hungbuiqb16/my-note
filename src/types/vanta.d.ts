interface VantaEffectInstance {
  destroy: () => void
}

type VantaFactory = (options: Record<string, unknown>) => VantaEffectInstance

interface Window {
  THREE?: unknown
  VANTA?: {
    BIRDS?: VantaFactory
    [key: string]: VantaFactory | undefined
  }
}

// UMD build registers window.VANTA.BIRDS; it has no useful ESM default export.
declare module 'vanta/dist/vanta.birds.min'
