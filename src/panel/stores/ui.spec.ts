import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUi } from './ui'

describe('ui store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('defaults to components tab, light theme', () => {
    const s = useUi()
    expect(s.tab).toBe('components')
    expect(s.theme).toBe('light')
  })

  it('setTab switches', () => {
    const s = useUi()
    s.setTab('events')
    expect(s.tab).toBe('events')
  })

  it('setTheme mirrors to document root', () => {
    const s = useUi()
    s.setTheme('dark')
    expect(s.theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
