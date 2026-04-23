import { PAGE_SOURCE } from '@/shared/constants'
import type { AlpineInfo } from '@/adapter/types'

const MAX_ATTEMPTS = 80
const INTERVAL_MS = 100

function alpineInfo(): AlpineInfo {
  const A = window.Alpine
  if (!A) return { present: false, version: null }
  return { present: true, version: typeof A.version === 'string' ? A.version : null }
}

function announce() {
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

  window.postMessage(
    { source: PAGE_SOURCE, message: { event: 'livewire:detected', payload } },
    '*'
  )

  const hook = window.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__
  if (hook && !hook.Livewire) hook.emit('init', L)

  return true
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
