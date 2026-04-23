import type { NormalizedComponent } from './types'

export function normalize(component: any): NormalizedComponent {
  return {
    id: String(component.id),
    name:
      component.name ??
      component?.snapshot?.memo?.name ??
      component?.fingerprint?.name ??
      'Anonymous',
    el: (component.el ?? null) as Element | null,
    data: readState(component),
    childIds: extractChildIds(component),
    raw: component
  }
}

export function extractChildIds(component: any): string[] {
  // Livewire 4 exposes a `children` getter returning the child component instances.
  // Source: livewire/js/component.js — iterates snapshot.memo.children and resolves IDs.
  try {
    const children = component?.children
    if (Array.isArray(children) && children.length > 0) {
      return children
        .map((c) => (c && c.id != null ? String(c.id) : null))
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    }
  } catch {
    /* children getter can throw while page is rehydrating */
  }

  // Fallback: parse snapshot.memo.children directly.
  //   Livewire 4 shape: { [wire:key]: [tagName, id] }
  //   Livewire 3 shape: { [key]: [id, name] }   (historically inconsistent)
  const memoChildren =
    component?.snapshot?.memo?.children ?? component?.serverMemo?.children
  if (!memoChildren) return []

  const ids: string[] = []
  for (const value of Object.values(memoChildren)) {
    if (Array.isArray(value) && value.length >= 2) {
      const second = value[1]
      const first = value[0]
      if (typeof second === 'string' && looksLikeId(second)) {
        ids.push(second)
      } else if (typeof first === 'string' && looksLikeId(first)) {
        ids.push(first)
      }
    } else if (typeof value === 'string') {
      ids.push(value)
    } else if (value && typeof value === 'object' && 'id' in value) {
      ids.push(String((value as any).id))
    }
  }
  return ids
}

function looksLikeId(s: string): boolean {
  // Livewire IDs are alphanumeric strings ~10-20 chars. HTML tag names are short
  // ASCII words. If it contains only lowercase letters and is ≤8 chars, treat it
  // as a tag name and skip.
  if (!s) return false
  if (s.length <= 8 && /^[a-z]+$/.test(s)) return false
  return true
}

export function readState(component: any): Record<string, unknown> {
  // Try each source in priority order. Skip a source if it's present but empty
  // — some components briefly expose an empty `ephemeral` during early mount
  // while `snapshot.data` already has the real state.
  const sources: Array<{ label: string; get: () => Record<string, unknown> | null }> = [
    {
      label: 'ephemeral',
      get: () => {
        const v = component?.ephemeral
        return v && typeof v === 'object' ? cloneShallow(v) : null
      }
    },
    {
      label: 'canonical',
      get: () => {
        const v = component?.canonical
        return v && typeof v === 'object' ? cloneShallow(v) : null
      }
    },
    {
      label: 'data',
      get: () => {
        const v = component?.data
        return v && typeof v === 'object' ? unwrapData(v) : null
      }
    },
    {
      label: 'snapshot.data',
      get: () => {
        const v = component?.snapshot?.data
        return v && typeof v === 'object' ? unwrapData(v) : null
      }
    }
  ]

  let lastEmpty: Record<string, unknown> | null = null
  for (const src of sources) {
    const candidate = src.get()
    if (!candidate) continue
    if (Object.keys(candidate).length > 0) {
      logStateSource(component, src.label, candidate)
      return candidate
    }
    lastEmpty = candidate
  }

  logStateSource(component, 'none', lastEmpty ?? {})
  return lastEmpty ?? {}
}

function logStateSource(
  component: any,
  source: string,
  result: Record<string, unknown>
) {
  // Only log when state ends up empty or when verbose mode is on — anything
  // else is noise.
  const verbose = (globalThis as any).__LIVEWIRE_DEVTOOLS_VERBOSE__
  const empty = Object.keys(result).length === 0
  if (!empty && !verbose) return
  try {
    console.debug(
      `[livewire-devtools] readState ${component?.name ?? component?.id} → ${source} (${Object.keys(result).length} keys)`,
      empty
        ? {
            hasEphemeral: !!component?.ephemeral,
            hasCanonical: !!component?.canonical,
            hasData: !!component?.data,
            hasSnapshotData: !!component?.snapshot?.data
          }
        : undefined
    )
  } catch {
    /* noop */
  }
}

function cloneShallow(src: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  try {
    for (const k of Object.keys(src)) {
      out[k] = src[k]
    }
  } catch {
    /* proxy-backed objects can throw */
  }
  return out
}

function unwrapData(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {}
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(data as Record<string, unknown>)) {
    out[key] = unwrapValue((data as Record<string, unknown>)[key])
  }
  return out
}

export function unwrapValue(value: unknown): unknown {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[1] === 'object' &&
    value[1] !== null
  ) {
    const [payload, meta] = value as [unknown, Record<string, unknown>]
    if ('s' in meta || 'class' in meta) {
      return unwrapValue(payload)
    }
  }
  if (Array.isArray(value)) {
    return value.map((v) => unwrapValue(v))
  }
  if (value && typeof value === 'object') {
    const nested: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>)) {
      nested[key] = unwrapValue((value as Record<string, unknown>)[key])
    }
    return nested
  }
  return value
}

export function wrapDispatch(
  Livewire: any,
  cb: (name: string, args: unknown[]) => void
): () => void {
  if (typeof Livewire?.dispatch !== 'function') return () => {}
  if ((Livewire.dispatch as any).__livewireDevtoolsWrapped) {
    const wrapped = Livewire.dispatch as any
    const listeners = wrapped.__livewireDevtoolsListeners as Array<
      (name: string, args: unknown[]) => void
    >
    const original = wrapped.__livewireDevtoolsOriginal as (name: string, ...args: unknown[]) => unknown
    listeners.push(cb)
    return () => {
      const i = listeners.indexOf(cb)
      if (i >= 0) listeners.splice(i, 1)
      if (listeners.length === 0 && Livewire.dispatch === wrapped) {
        Livewire.dispatch = original
      }
    }
  }
  const original = Livewire.dispatch as (name: string, ...args: unknown[]) => unknown
  const listeners: Array<(name: string, args: unknown[]) => void> = [cb]
  const wrapped = (name: string, ...args: unknown[]) => {
    markGlobalDispatch(name)
    for (const fn of listeners.slice()) {
      try {
        fn(name, args)
      } catch (e) {
        console.error('[livewire-devtools] dispatch wrap error', e)
      }
    }
    return original.call(Livewire, name, ...args)
  }
  ;(wrapped as any).__livewireDevtoolsWrapped = true
  ;(wrapped as any).__livewireDevtoolsListeners = listeners
  ;(wrapped as any).__livewireDevtoolsOriginal = original
  Livewire.dispatch = wrapped
  return () => {
    const i = listeners.indexOf(cb)
    if (i >= 0) listeners.splice(i, 1)
    if (listeners.length === 0 && Livewire.dispatch === wrapped) {
      Livewire.dispatch = original
    }
  }
}

// Browser-intrinsic event types we never want to surface in the events tab.
// Alpine's `$dispatch(name, detail)` fires a CustomEvent; most interesting
// devtools events look like `post-created`, `close-modal`, `livewire:navigated`.
const INTRINSIC_EVENT_PREFIXES = [
  'pointer',
  'mouse',
  'key',
  'touch',
  'drag',
  'focus',
  'blur',
  'input',
  'change',
  'animation',
  'transition',
  'scroll',
  'resize',
  'compositionstart',
  'compositionend',
  'compositionupdate'
]
const INTRINSIC_EVENT_TYPES = new Set([
  'load',
  'unload',
  'beforeunload',
  'error',
  'abort',
  'select',
  'submit',
  'reset',
  'contextmenu',
  'DOMContentLoaded',
  'readystatechange',
  'visibilitychange',
  'online',
  'offline',
  'hashchange',
  'popstate',
  'storage',
  'message',
  'messageerror',
  'copy',
  'cut',
  'paste',
  'play',
  'pause',
  'ended',
  'timeupdate',
  'seeking',
  'seeked',
  'volumechange',
  'wheel',
  'click',
  'dblclick',
  'auxclick'
])

interface WrappedDispatchMarker {
  __livewireDevtoolsDomHooked?: boolean
  __livewireDevtoolsOriginalDispatchEvent?: typeof EventTarget.prototype.dispatchEvent
  __livewireDevtoolsDomListeners?: Set<
    (name: string, args: unknown[], source: string | null) => void
  >
  __livewireDevtoolsRecentGlobal?: Map<string, number>
}

const globalAny = globalThis as unknown as WrappedDispatchMarker

/**
 * Patch EventTarget.prototype.dispatchEvent to surface Alpine `$dispatch`
 * and page-level `CustomEvent`s. Livewire's own `Livewire.dispatch` internally
 * delegates to `window.dispatchEvent(new CustomEvent(...))`, so we dedupe
 * against the last bridge dispatch within a 50ms window to avoid double-log.
 */
export function installDomEventCapture(
  cb: (name: string, args: unknown[], sourceComponentId: string | null) => void
): () => void {
  if (typeof EventTarget === 'undefined') return () => {}

  if (!globalAny.__livewireDevtoolsDomHooked) {
    globalAny.__livewireDevtoolsDomHooked = true
    globalAny.__livewireDevtoolsDomListeners = new Set()
    globalAny.__livewireDevtoolsRecentGlobal = new Map()
    const original = EventTarget.prototype.dispatchEvent
    globalAny.__livewireDevtoolsOriginalDispatchEvent = original
    EventTarget.prototype.dispatchEvent = function (event: Event) {
      try {
        if (event instanceof CustomEvent) {
          const type = event.type
          if (!INTRINSIC_EVENT_TYPES.has(type) && !isIntrinsicPrefix(type)) {
            const listeners = globalAny.__livewireDevtoolsDomListeners
            if (listeners && listeners.size > 0) {
              // Dedupe: if Livewire.dispatch fired this same name <50ms ago,
              // assume wrapDispatch already surfaced it — skip.
              const recent = globalAny.__livewireDevtoolsRecentGlobal!.get(type) ?? 0
              if (Date.now() - recent > 50) {
                const detail = event.detail
                const payload = detail === undefined ? [] : [detail]
                for (const fn of listeners) {
                  try {
                    fn(type, payload, null)
                  } catch (err) {
                    console.error('[livewire-devtools] dom capture cb error', err)
                  }
                }
              }
            }
          }
        }
      } catch {
        /* never let our capture break the host page */
      }
      return original.call(this, event)
    }
  }

  globalAny.__livewireDevtoolsDomListeners!.add(cb)
  return () => {
    globalAny.__livewireDevtoolsDomListeners?.delete(cb)
  }
}

/** Mark a global dispatch name as just-seen so the DOM capture can dedupe. */
export function markGlobalDispatch(name: string) {
  if (!globalAny.__livewireDevtoolsRecentGlobal) return
  globalAny.__livewireDevtoolsRecentGlobal.set(name, Date.now())
  // prune occasionally
  if (globalAny.__livewireDevtoolsRecentGlobal.size > 256) {
    const cutoff = Date.now() - 1000
    for (const [k, t] of globalAny.__livewireDevtoolsRecentGlobal) {
      if (t < cutoff) globalAny.__livewireDevtoolsRecentGlobal.delete(k)
    }
  }
}

function isIntrinsicPrefix(type: string): boolean {
  for (const p of INTRINSIC_EVENT_PREFIXES) {
    if (type.startsWith(p)) return true
  }
  return false
}

export function findComponentForElement(Livewire: any, el: Element): any | null {
  let current: Element | null = el
  while (current) {
    const id = current.getAttribute?.('wire:id')
    if (id) {
      const byFind = typeof Livewire.find === 'function' ? Livewire.find(id) : null
      if (byFind) return byFind
      const all = typeof Livewire.all === 'function' ? Livewire.all() : []
      const match = all.find((c: any) => String(c.id) === id)
      if (match) return match
    }
    current = current.parentElement
  }
  return null
}
