let overlay: HTMLDivElement | null = null
let label: HTMLDivElement | null = null

function ensureOverlay() {
  if (overlay) return
  overlay = document.createElement('div')
  Object.assign(overlay.style, {
    position: 'fixed',
    background: 'rgba(49, 130, 206, 0.25)',
    border: '1px solid rgba(49, 130, 206, 0.7)',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    zIndex: '2147483646',
    transition: 'opacity 80ms linear',
    opacity: '0'
  } as CSSStyleDeclaration)

  label = document.createElement('div')
  Object.assign(label.style, {
    position: 'fixed',
    background: '#2b6cb0',
    color: '#fff',
    font: '11px/1.4 -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    padding: '2px 6px',
    borderRadius: '3px',
    pointerEvents: 'none',
    zIndex: '2147483647',
    opacity: '0',
    transition: 'opacity 80ms linear'
  } as CSSStyleDeclaration)

  document.documentElement.appendChild(overlay)
  document.documentElement.appendChild(label)
}

export function highlight(el: Element | null, name: string) {
  ensureOverlay()
  if (!overlay || !label || !el || !(el as HTMLElement).getBoundingClientRect) {
    unhighlight()
    return
  }
  const rect = (el as HTMLElement).getBoundingClientRect()
  overlay.style.left = `${rect.left}px`
  overlay.style.top = `${rect.top}px`
  overlay.style.width = `${rect.width}px`
  overlay.style.height = `${rect.height}px`
  overlay.style.opacity = '1'

  label.textContent = name
  label.style.left = `${rect.left}px`
  label.style.top = `${Math.max(0, rect.top - 20)}px`
  label.style.opacity = '1'
}

export function unhighlight() {
  if (!overlay || !label) return
  overlay.style.opacity = '0'
  label.style.opacity = '0'
}
