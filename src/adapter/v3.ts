import type {
  CommitEvent,
  DispatchedEvent,
  LivewireAdapter,
  NormalizedComponent
} from './types'
import { findComponentForElement, normalize, wrapDispatch } from './shared'
import { isDevToolsEnabled } from './detect'

export function createV3Adapter(L: any): LivewireAdapter {
  const version = 3 as const

  const getAll = (): any[] => (typeof L.all === 'function' ? L.all() : [])
  const eventListeners: Array<(e: DispatchedEvent) => void> = []

  function emitDispatch(name: string, payload: unknown[], sourceComponentId: string | null) {
    if (typeof name !== 'string' || eventListeners.length === 0) return
    const e: DispatchedEvent = {
      name,
      payload,
      sourceComponentId,
      timestamp: Date.now()
    }
    for (const fn of eventListeners.slice()) {
      try {
        fn(e)
      } catch (err) {
        console.error('[livewire-devtools] event dispatch cb error', err)
      }
    }
  }

  function wrapComponentDispatch(component: any) {
    const $wire = component?.$wire
    if (!$wire || typeof $wire.dispatch !== 'function') return
    if (($wire.dispatch as any).__livewireDevtoolsWrapped) return
    const original = $wire.dispatch.bind($wire)
    const wrapped = (name: string, ...args: unknown[]) => {
      emitDispatch(name, args, String(component.id ?? ''))
      return original(name, ...args)
    }
    ;(wrapped as any).__livewireDevtoolsWrapped = true
    try {
      $wire.dispatch = wrapped
    } catch {
      /* may be frozen */
    }
  }

  function emitServerDispatches(effects: any, sourceComponentId: string | null) {
    const list = Array.isArray(effects?.dispatches)
      ? effects.dispatches
      : Array.isArray(effects?.emits)
        ? effects.emits
        : null
    if (!list) return
    for (const d of list) {
      if (!d) continue
      const name =
        typeof d.name === 'string'
          ? d.name
          : typeof d.event === 'string'
            ? d.event
            : null
      if (!name) continue
      const params = Array.isArray(d.params) ? d.params : []
      emitDispatch(name, params, sourceComponentId)
    }
  }

  const adapter: LivewireAdapter = {
    version,
    devToolsEnabled: isDevToolsEnabled(L),

    getAllComponents() {
      return getAll().map(normalize)
    },

    getComponentById(id) {
      const raw = getAll().find((c) => String(c.id) === id)
      return raw ? normalize(raw) : null
    },

    getComponentChildren(c) {
      const children: NormalizedComponent[] = []
      for (const id of c.childIds) {
        const child = adapter.getComponentById(id)
        if (child) children.push(child)
      }
      return children
    },

    findComponentForElement(el) {
      const raw = findComponentForElement(L, el)
      return raw ? normalize(raw) : null
    },

    getComponentState(c) {
      return c.data
    },

    setComponentState(id, path, value) {
      const raw =
        (typeof L.find === 'function' ? L.find(id) : null) ||
        getAll().find((c) => String(c.id) === id)
      if (!raw?.$wire?.set) return
      raw.$wire.set(path, value, true)
    },

    onComponentUpdate(cb) {
      if (typeof L.hook !== 'function') return () => {}
      const handler = (payload: any) => {
        const component = payload?.component
        if (!component) return
        const succeed = payload?.succeed
        if (typeof succeed === 'function') {
          succeed((result: any) => {
            const effects = result?.effect ?? result?.effects ?? null
            fire(cb, component, effects)
            emitServerDispatches(effects, String(component.id ?? ''))
          })
        } else {
          fire(cb, component, null)
        }
      }
      L.hook('commit', handler)
      return () => {}
    },

    onEventDispatched(cb) {
      eventListeners.push(cb)
      const stopGlobal = wrapDispatch(L, (name, payload) => {
        emitDispatch(name, payload, null)
      })
      for (const c of getAll()) wrapComponentDispatch(c)
      return () => {
        const i = eventListeners.indexOf(cb)
        if (i >= 0) eventListeners.splice(i, 1)
        stopGlobal()
      }
    },

    onComponentInit(cb) {
      if (typeof L.hook !== 'function') return () => {}
      L.hook('component.init', ({ component }: any) => {
        if (component) {
          wrapComponentDispatch(component)
          cb(normalize(component))
        }
      })
      L.hook('morph.added', ({ el }: any) => {
        const id = el?.getAttribute?.('wire:id')
        if (!id) return
        const c = adapter.getComponentById(id)
        if (c) cb(c)
      })
      return () => {}
    },

    onComponentRemoved(cb) {
      if (typeof L.hook !== 'function') return () => {}
      L.hook('morph.removing', ({ el }: any) => {
        const id = el?.getAttribute?.('wire:id')
        if (id) cb(id)
      })
      return () => {}
    }
  }

  return adapter
}

function fire(
  cb: (e: CommitEvent) => void,
  component: any,
  effects: Record<string, unknown> | null
) {
  const normalized = normalize(component)
  cb({
    componentId: normalized.id,
    componentName: normalized.name,
    data: normalized.data,
    effects,
    timestamp: Date.now()
  })
}
