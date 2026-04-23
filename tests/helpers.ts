import { mount as vueMount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { vi } from 'vitest'

export function makeBridge() {
  return {
    on: vi.fn(() => vi.fn()),
    off: vi.fn(),
    send: vi.fn()
  }
}

export function mount(component: any, options: any = {}) {
  const bridge = makeBridge()
  const pinia = createPinia()
  const wrapper = vueMount(component, {
    ...options,
    global: {
      ...(options.global ?? {}),
      plugins: [pinia, ...(options.global?.plugins ?? [])],
      provide: {
        bridge,
        ...(options.global?.provide ?? {})
      }
    }
  })
  return { wrapper, bridge, pinia }
}
