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
          })
        })
      }
      return () => {}
    },

    onEventDispatched(cb) {
      return wrapDispatch(L, (name, payload) => {
        cb({ name, payload, sourceComponentId: null, timestamp: Date.now() } satisfies DispatchedEvent)
      })
    },

    onComponentInit(cb) {
      if (typeof L.hook !== 'function') return () => {}
      L.hook('component.init', ({ component }: any) => {
        if (component) cb(normalize(component))
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
