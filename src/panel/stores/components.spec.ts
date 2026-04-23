import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useComponents } from './components'

describe('components store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('starts empty', () => {
    const s = useComponents()
    expect(s.tree).toEqual([])
    expect(s.selectedId).toBeNull()
    expect(s.inspected).toBeNull()
    expect(s.filter).toBe('')
  })

  it('setFlush stores tree + inspected', () => {
    const s = useComponents()
    s.setFlush({
      tree: [{ id: 'a', name: 'Root', childIds: ['b'] }],
      inspected: { id: 'a', name: 'Root', state: { count: 1 } }
    })
    expect(s.tree).toHaveLength(1)
    expect(s.inspected?.state.count).toBe(1)
  })

  it('select updates selectedId', () => {
    const s = useComponents()
    s.select('abc')
    expect(s.selectedId).toBe('abc')
    s.select(null)
    expect(s.selectedId).toBeNull()
  })

  it('setFilter updates filter', () => {
    const s = useComponents()
    s.setFilter('counter')
    expect(s.filter).toBe('counter')
  })
})
