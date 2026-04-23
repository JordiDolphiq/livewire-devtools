type Listener = (...args: unknown[]) => void

console.log('[livewire-devtools] hook injected')

if (!window.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__) {
  const events: Record<string, Listener[]> = {}

  const hook: LivewireDevtoolsGlobalHook = {
    Livewire: null,
    events,
    on(event: string, fn: Listener) {
      ;(events[event] ||= []).push(fn)
    },
    once(event: string, fn: Listener) {
      const wrapped: Listener = (...args) => {
        hook.off(event, wrapped)
        fn(...args)
      }
      hook.on(event, wrapped)
    },
    off(event: string, fn?: Listener) {
      if (!events[event]) return
      if (!fn) {
        delete events[event]
      } else {
        events[event] = events[event]!.filter((f) => f !== fn)
      }
    },
    emit(event: string, ...args: unknown[]) {
      const list = events[event]
      if (!list) return
      for (const fn of list.slice()) {
        try {
          fn(...args)
        } catch (e) {
          console.error('[livewire-devtools] hook listener error', e)
        }
      }
    }
  }

  hook.on('init', (livewire: unknown) => {
    hook.Livewire = livewire
  })

  window.__LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__ = hook
}

export {}
