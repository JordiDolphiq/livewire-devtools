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
      if (typeof L.hook !== 'function') return () => {}
      const handler = (payload: any) => {
        const component = payload?.component
        if (!component) return
        const succeed = payload?.succeed
        if (typeof succeed === 'function') {
          succeed((result: any) => {
            const effects = result?.effect ?? result?.effects ?? null
            fire(cb, component, result?.snapshot, effects)
          })
        } else {
          fire(cb, component, component?.snapshot, null)
        }
      }
      L.hook('commit', handler)
      return () => {
        // Livewire 3 has no off(); best-effort: leave as no-op.
      }
    },

    onEventDispatched(cb) {
      return wrapDispatch(L, (name, payload) => {
        cb({ name, payload, sourceComponentId: null, timestamp: Date.now() } as DispatchedEvent)
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

function fire(
  cb: (e: CommitEvent) => void,
  component: any,
  snapshot: any,
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
  void snapshot
}
