import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useConnection } from './connection'

describe('connection store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('starts in a not-ready state', () => {
    const s = useConnection()
    expect(s.ready).toBe(false)
    expect(s.livewireVersion).toBeNull()
    expect(s.lastError).toBeNull()
  })

  it('setReady populates version + alpine + enabled', () => {
    const s = useConnection()
    s.setReady({
      livewireVersion: 4,
      alpine: { present: true, version: '3.15.0' },
      devToolsEnabled: true
    })
    expect(s.ready).toBe(true)
    expect(s.livewireVersion).toBe(4)
    expect(s.alpine.version).toBe('3.15.0')
    expect(s.devToolsEnabled).toBe(true)
    expect(s.lastError).toBeNull()
  })

  it('setError records the message', () => {
    const s = useConnection()
    s.setError('boom')
    expect(s.lastError).toBe('boom')
  })
})
