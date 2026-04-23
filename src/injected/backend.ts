import { createAdapter, detectAlpine } from '@/adapter'
import type { LivewireAdapter, NormalizedComponent } from '@/adapter/types'
import { Bridge, type BridgeWall } from '@/shared/bridge'
import { toCloneable } from '@/shared/cloneable'
import { PAGE_SOURCE, CONTENT_SOURCE } from '@/shared/constants'
import { highlight, unhighlight } from './backend/highlighter'
import { initContextMenuCapture, consumeContextTarget } from './backend/selector'
import type {
  BackendToPanel,
  ComponentDetails,
  ComponentTreeNode,
  EventLogEntry,
  PanelToBackend,
  TimelineMutation
} from '@/shared/messages'

function createWall(): BridgeWall {
  return {
    listen(fn) {
      window.addEventListener('message', (event) => {
        if (event.source !== window) return
        const data = event.data
        if (!data || data.source !== CONTENT_SOURCE) return
        fn(data.message)
      })
    },
    send(msg) {
      try {
        window.postMessage(
          { source: PAGE_SOURCE, message: toCloneable(msg) },
          '*'
        )
      } catch (err) {
        console.warn('[livewire-devtools] postMessage dropped', err)
      }
    }
  }
}

const BACKEND_VERSION = '2.0.9'

function start() {
  if (window.__LIVEWIRE_DEVTOOLS_BACKEND_LOADED__) return
  window.__LIVEWIRE_DEVTOOLS_BACKEND_LOADED__ = true
  console.log(`[livewire-devtools] backend v${BACKEND_VERSION} starting`)

  let adapter: LivewireAdapter | null = null
  let currentInspectedId: string | null = null
  // Last-known name for the currently inspected component — lets us re-find
  // the component after a morph/wire:navigate mints a fresh ID.
  let currentInspectedName: string | null = null
  // Last successfully-built details so we can keep showing state when a flush
  // happens while the tree is in transition.
  let lastInspectedDetails: ComponentDetails | null = null
  let filter = ''

  const bridge = new Bridge<PanelToBackend, BackendToPanel>(createWall())
  const instanceMap = new Map<string, NormalizedComponent>()
  window.__LIVEWIRE_DEVTOOLS_INSTANCE_MAP__ = instanceMap as Map<string, unknown>

  bridge.on('refresh', () => {
    console.log('[livewire-devtools] refresh')
    adapter = null
    attempts = 0
    waitForLivewire()
  })

  bridge.on('select-instance', (id) => {
    currentInspectedId = id
    const a = ensureAdapter()
    const c = a ? a.getComponentById(id) : null
    currentInspectedName = c?.name ?? null
    lastInspectedDetails = null
    bridge.send('instance-selected')
    flush()
  })

  bridge.on('filter-instances', (f) => {
    filter = f
    flush()
  })

  bridge.on('set-instance-data', ({ id, path, value }) => {
    if (!adapter) return
    adapter.setComponentState(id, path, value)
    flush()
  })

  bridge.on('timeline:travel-to-state', ({ componentId, state }) => {
    if (!adapter) return
    for (const key of Object.keys(state)) {
      adapter.setComponentState(componentId, key, state[key])
    }
    flush()
  })

  bridge.on('enter-instance', (id) => {
    if (!adapter) return
    const c = adapter.getComponentById(id)
    if (!c) return
    highlight(c.el, c.name)
  })

  bridge.on('leave-instance', () => {
    unhighlight()
  })

  bridge.on('get-context-menu-target', () => {
    if (!adapter) return
    const id = consumeContextTarget(adapter)
    if (id) bridge.send('inspect-instance', id)
  })

  initContextMenuCapture()

  document.addEventListener('livewire:navigated', () => {
    console.log('[livewire-devtools] wire:navigated — rescanning')
    adapter = null
    attempts = 0
    // Keep the inspected name so we can re-attach to the same component on
    // the new page if it's still there.
    lastInspectedDetails = null
    waitForLivewire()
  })

  bridge.on('init', () => {
    // Panel may request a fresh ready event (e.g. after reconnect).
    announceAndFlush()
  })

  function ensureAdapter(): LivewireAdapter | null {
    if (adapter) return adapter
    const hooked = window.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__?.Livewire
    const L = hooked ?? (window as any).Livewire
    if (!L) return null
    try {
      adapter = createAdapter(L)
      wireLifecycle(adapter)
      return adapter
    } catch (err) {
      bridge.send('error', { message: (err as Error).message })
      return null
    }
  }

  function wireLifecycle(a: LivewireAdapter) {
    a.onComponentUpdate((e) => {
      const mutation: TimelineMutation = {
        id: `${e.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
        componentId: e.componentId,
        componentName: e.componentName,
        state: e.data,
        timestamp: e.timestamp
      }
      bridge.send('timeline:mutation', mutation)
      flush()
    })
    a.onComponentInit(() => flush())
    a.onComponentRemoved(() => flush())
    a.onEventDispatched((e) => {
      const entry: EventLogEntry = {
        id: `${e.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
        name: e.name,
        payload: e.payload,
        sourceComponentId: e.sourceComponentId,
        timestamp: e.timestamp
      }
      bridge.send('event:triggered', entry)
    })
  }

  function buildTree(a: LivewireAdapter): ComponentTreeNode[] {
    const all = a.getAllComponents()
    instanceMap.clear()
    for (const c of all) instanceMap.set(c.id, c)

    const f = filter.toLowerCase()
    const pick = (c: NormalizedComponent): ComponentTreeNode => ({
      id: c.id,
      name: c.name,
      childIds: c.childIds
    })

    if (!f) return all.map(pick)
    return all.filter((c) => c.name.toLowerCase().includes(f)).map(pick)
  }

  function inspectedDetails(a: LivewireAdapter): ComponentDetails | null {
    if (!currentInspectedId) return null

    // 1. Direct id lookup.
    let c = a.getComponentById(currentInspectedId)

    // 2. Stale id? Try to re-attach by name (survives morphs and wire:navigate
    //    when a single component of that name exists on the new page).
    if (!c && currentInspectedName) {
      const sameName = a
        .getAllComponents()
        .filter((x) => x.name === currentInspectedName)
      if (sameName.length === 1) {
        c = sameName[0] ?? null
        if (c) {
          currentInspectedId = c.id
        }
      }
    }

    if (!c) {
      // Keep the panel showing the last known state while the tree is in
      // transition — prevents the state pane from flickering empty during
      // morphs/navigations. Only clears when the user selects something else
      // or we get a new successful snapshot.
      return lastInspectedDetails
    }

    const state = a.getComponentState(c)
    currentInspectedName = c.name
    const details: ComponentDetails = { id: c.id, name: c.name, state }
    lastInspectedDetails = details
    return details
  }

  function flush() {
    const a = ensureAdapter()
    if (!a) return
    bridge.send('flush', {
      tree: buildTree(a),
      inspected: inspectedDetails(a)
    })
  }

  function announceAndFlush() {
    const a = ensureAdapter()
    if (!a) return false
    bridge.send('ready', {
      livewireVersion: a.version,
      alpine: detectAlpine(window),
      devToolsEnabled: a.devToolsEnabled
    })
    flush()
    return true
  }

  let attempts = 0
  const maxAttempts = 80
  function waitForLivewire() {
    if (announceAndFlush()) {
      console.log('[livewire-devtools] backend ready')
      return
    }
    if (attempts++ >= maxAttempts) {
      console.warn('[livewire-devtools] gave up waiting for window.Livewire')
      return
    }
    setTimeout(waitForLivewire, 100)
  }

  const hook = window.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__
  if (hook) {
    if (hook.Livewire) {
      waitForLivewire()
    } else {
      hook.on('init', () => waitForLivewire())
    }
  } else {
    waitForLivewire()
  }
}

start()
