import type { LivewireAdapter } from '@/adapter/types'

let lastTarget: Element | null = null

export function initContextMenuCapture() {
  document.addEventListener(
    'contextmenu',
    (event) => {
      const target = event.target
      lastTarget = target instanceof Element ? target : null
    },
    true
  )
}

export function consumeContextTarget(adapter: LivewireAdapter): string | null {
  const el = lastTarget
  lastTarget = null
  if (!el) return null
  const c = adapter.findComponentForElement(el)
  return c ? c.id : null
}
