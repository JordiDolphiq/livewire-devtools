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
  // 1. Livewire 4: `component.ephemeral` is the live client-side state, already
  //    unwrapped from the snapshot's [value, meta] pairs. This is the freshest
  //    and cleanest source.
  if (component?.ephemeral && typeof component.ephemeral === 'object') {
    return cloneShallow(component.ephemeral)
  }

  // 2. Livewire 4 fallback: canonical state (last server-confirmed).
  if (component?.canonical && typeof component.canonical === 'object') {
    return cloneShallow(component.canonical)
  }

  // 3. Livewire 3: `component.data` is a flat key/value bag.
  if (component?.data && typeof component.data === 'object') {
    return unwrapData(component.data)
  }

  // 4. Last resort: parse the raw snapshot.data.
  const snapshotData = component?.snapshot?.data
  if (snapshotData && typeof snapshotData === 'object') {
    return unwrapData(snapshotData)
  }

  return {}
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
