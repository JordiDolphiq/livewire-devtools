import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTimeline } from './timeline'

function mut(id: string) {
  return {
    id,
    componentId: 'c',
    componentName: 'Comp',
    state: {},
    timestamp: Date.now()
  }
}

describe('timeline store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('appends while recording, ignores while paused', () => {
    const s = useTimeline()
    s.append(mut('a'))
    s.toggleRecording()
    s.append(mut('b'))
    expect(s.mutations.map((m) => m.id)).toEqual(['a'])
  })

  it('clear removes all mutations', () => {
    const s = useTimeline()
    s.append(mut('a'))
    s.select('a')
    s.clear()
    expect(s.mutations).toEqual([])
    expect(s.selectedId).toBeNull()
  })

  it('caps at 500 entries', () => {
    const s = useTimeline()
    for (let i = 0; i < 600; i++) s.append(mut(`m${i}`))
    expect(s.mutations).toHaveLength(500)
  })
})
