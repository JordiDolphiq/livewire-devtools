import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEvents } from './events'

function entry(id: string, name = 'x', ts = Date.now()) {
  return { id, name, payload: [], sourceComponentId: null, timestamp: ts }
}

describe('events store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('appends while recording', () => {
    const s = useEvents()
    s.append(entry('a'))
    s.append(entry('b'))
    expect(s.entries).toHaveLength(2)
  })

  it('ignores appends while paused', () => {
    const s = useEvents()
    s.toggleRecording()
    expect(s.recording).toBe(false)
    s.append(entry('a'))
    expect(s.entries).toHaveLength(0)
  })

  it('clear empties entries and deselects', () => {
    const s = useEvents()
    s.append(entry('a'))
    s.select('a')
    s.clear()
    expect(s.entries).toEqual([])
    expect(s.selectedId).toBeNull()
  })

  it('caps at 500 entries', () => {
    const s = useEvents()
    for (let i = 0; i < 600; i++) s.append(entry(`e${i}`))
    expect(s.entries).toHaveLength(500)
    expect(s.entries[0]!.id).toBe('e100')
  })
})
