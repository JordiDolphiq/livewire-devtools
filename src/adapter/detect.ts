import type { AlpineInfo, LivewireVersion } from './types'

export function detectLivewireVersion(L: any): LivewireVersion {
  if (!L) throw new Error('Livewire is not on the page')

  if (typeof L.interceptMessage === 'function' || typeof L.interceptRequest === 'function') {
    return 4
  }

  if (typeof L.all === 'function' && typeof L.hook === 'function') {
    return 3
  }

  const first = typeof L.first === 'function' ? L.first() : null
  if (first?.snapshot) return 3

  throw new Error('Unsupported Livewire version (pre-3 not supported)')
}

export function detectAlpine(win: Window): AlpineInfo {
  const A = (win as any).Alpine
  if (!A) return { present: false, version: null }
  return {
    present: true,
    version: typeof A.version === 'string' ? A.version : null
  }
}

export function isDevToolsEnabled(L: any): boolean {
  return L?.devToolsEnabled !== false
}
