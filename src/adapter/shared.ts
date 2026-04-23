import type { NormalizedComponent } from './types'

export function normalize(component: any): NormalizedComponent {
  const data = component?.snapshot?.data ?? {}
  return {
    id: String(component.id),
    name: component.name ?? component?.snapshot?.memo?.name ?? 'Anonymous',
    el: (component.el ?? null) as Element | null,
    data: unwrapData(data),
    childIds: extractChildIds(component),
    raw: component
  }
}

function extractChildIds(component: any): string[] {
  const memoChildren = component?.snapshot?.memo?.children
  if (!memoChildren) return []
  const ids: string[] = []
  for (const value of Object.values(memoChildren)) {
    if (Array.isArray(value)) {
      const first = value[0]
      if (typeof first === 'string') ids.push(first)
    } else if (typeof value === 'string') {
      ids.push(value)
    } else if (value && typeof value === 'object' && 'id' in value) {
      ids.push(String((value as any).id))
    }
  }
  return ids
}

function unwrapData(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {}
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(data)) {
    const value = (data as Record<string, unknown>)[key]
    out[key] = unwrapValue(value)
  }
  return out
}

function unwrapValue(value: unknown): unknown {
  if (Array.isArray(value) && value.length === 2 && typeof value[1] === 'object' && value[1] !== null) {
    const [payload, meta] = value as [unknown, Record<string, unknown>]
    if ('s' in meta || 'class' in meta) {
      return unwrapValue(payload)
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const nested: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>)) {
      nested[key] = unwrapValue((value as Record<string, unknown>)[key])
    }
    return nested
  }
  return value
}

export function wrapDispatch(Livewire: any, cb: (name: string, args: unknown[]) => void): () => void {
  if (typeof Livewire?.dispatch !== 'function') return () => {}
  const original = Livewire.dispatch.bind(Livewire)
  const wrapped = (name: string, ...args: unknown[]) => {
    try {
      cb(name, args)
    } catch (e) {
      console.error('[livewire-devtools] dispatch wrap error', e)
    }
    return original(name, ...args)
  }
  ;(wrapped as any).__livewireDevtoolsWrapped = true
  Livewire.dispatch = wrapped
  return () => {
    if (Livewire.dispatch === wrapped) {
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
