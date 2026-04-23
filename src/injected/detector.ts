import { PAGE_SOURCE } from '@/shared/constants'
import type { AlpineInfo } from '@/adapter/types'

const MAX_ATTEMPTS = 80
const INTERVAL_MS = 100

function alpineInfo(): AlpineInfo {
  try {
    const A = window.Alpine
    if (!A) return { present: false, version: null }
    return {
      present: true,
      version: typeof A.version === 'string' ? A.version : null
    }
  } catch {
    return { present: false, version: null }
  }
}

function announce(): boolean {
  try {
    const L = window.Livewire
    if (!L) return false

    const payload = {
      devToolsEnabled: L.devToolsEnabled !== false,
      alpine: alpineInfo()
    }

    console.log('[livewire-devtools] detector: Livewire found', {
      hasInterceptMessage: typeof L.interceptMessage === 'function',
      hasHook: typeof L.hook === 'function',
      hasAll: typeof L.all === 'function',
      alpine: payload.alpine
    })

    try {
      window.postMessage(
        {
          source: PAGE_SOURCE,
          message: { event: 'livewire:detected', payload }
        },
        '*'
      )
    } catch (err) {
      console.warn('[livewire-devtools] detector postMessage failed', err)
    }

    try {
      const hook = window.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__
      if (hook && !hook.Livewire) hook.emit('init', L)
    } catch (err) {
      console.warn('[livewire-devtools] hook.emit(init) failed', err)
    }

    return true
  } catch (err) {
    console.warn('[livewire-devtools] detector announce failed', err)
    // Return false so the poll keeps trying rather than giving up silently.
    return false
  }
}

console.log('[livewire-devtools] detector injected')

;(function poll(attempt = 0) {
  if (announce()) return
  if (attempt >= MAX_ATTEMPTS) {
    console.warn('[livewire-devtools] detector: window.Livewire never appeared')
    return
  }
  setTimeout(() => poll(attempt + 1), INTERVAL_MS)
})()
