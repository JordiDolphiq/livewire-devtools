import type {
  CommitEvent,
  DispatchedEvent,
  LivewireAdapter,
  NormalizedComponent
} from './types'
import { findComponentForElement, normalize, wrapDispatch } from './shared'
import { isDevToolsEnabled } from './detect'

export function createV4Adapter(L: any): LivewireAdapter {
  const version = 4 as const

  const getAll = (): any[] => (typeof L.all === 'function' ? L.all() : [])
  const eventListeners: Array<(e: DispatchedEvent) => void> = []

  function emitDispatch(name: string, payload: unknown[], sourceComponentId: string | null) {
    if (typeof name !== 'string') return
    if (!eventListeners.length) return
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
      /* $wire is a Proxy that may block reassignment; global wrap still catches */
    }
  }

  const adapter: LivewireAdapter = {
    version,
    devToolsEnabled: isDevToolsEnabled(L),

    getAllComponents() {
      return getAll().map(normalize)
    },

    getComponentById(id) {
      const raw =
        (typeof L.find === 'function' ? L.find(id) : null) ||
        getAll().find((c) => String(c.id) === id)
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
      if (typeof L.interceptMessage === 'function') {
        const stop = L.interceptMessage(({ message, onSuccess }: any) => {
          onSuccess?.(({ payload }: any) => {
            const componentId = message?.component?.id ?? payload?.snapshot?.memo?.id
            if (!componentId) return
            const normalized = adapter.getComponentById(String(componentId))
            if (!normalized) return
            cb({
              componentId: normalized.id,
              componentName: normalized.name,
              data: normalized.data,
              effects: payload?.effects ?? payload?.effect ?? null,
              timestamp: Date.now()
            } satisfies CommitEvent)

            emitServerDispatches(payload?.effects ?? payload?.effect, normalized.id)
          })
        })
        return typeof stop === 'function' ? stop : () => {}
      }

      if (typeof L.hook === 'function') {
        L.hook('commit', ({ component, succeed }: any) => {
          succeed?.((result: any) => {
            const normalized = normalize(component)
            cb({
              componentId: normalized.id,
              componentName: normalized.name,
              data: normalized.data,
              effects: result?.effect ?? result?.effects ?? null,
              timestamp: Date.now()
            })
            emitServerDispatches(result?.effect ?? result?.effects, normalized.id)
          })
        })
      }
      return () => {}
    },

    onEventDispatched(cb) {
      eventListeners.push(cb)
      const stopGlobal = wrapDispatch(L, (name, payload) => {
        emitDispatch(name, payload, null)
      })
      // Wrap dispatch on all existing components
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

  function emitServerDispatches(effects: any, sourceComponentId: string | null) {
    const list = Array.isArray(effects?.dispatches) ? effects.dispatches : null
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

  return adapter
}
