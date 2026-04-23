/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

type LivewireDevtoolsHookListener = (...args: unknown[]) => void

interface LivewireDevtoolsGlobalHook {
  Livewire: any
  events: Record<string, LivewireDevtoolsHookListener[]>
  on(event: string, fn: LivewireDevtoolsHookListener): void
  once(event: string, fn: LivewireDevtoolsHookListener): void
  off(event: string, fn?: LivewireDevtoolsHookListener): void
  emit(event: string, ...args: unknown[]): void
}

interface Window {
  __LIVEWIRE_DEVTOOLS_GLOBAL_HOOK__?: LivewireDevtoolsGlobalHook
  __LIVEWIRE_DEVTOOLS_BACKEND_LOADED__?: boolean
  __LIVEWIRE_DEVTOOLS_INSTANCE_MAP__?: Map<string, unknown>
  Livewire?: any
  Alpine?: any
}

declare module '*?script&module' {
  const src: string
  export default src
}

declare module '*?script' {
  const src: string
  export default src
}
