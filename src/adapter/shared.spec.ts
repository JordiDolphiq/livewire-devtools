import { describe, expect, it, vi } from 'vitest'
import { extractChildIds, normalize, unwrapValue, wrapDispatch, readState } from './shared'

describe('unwrapValue', () => {
  it('strips Livewire [value, {s}] wrappers', () => {
    expect(unwrapValue([5, { s: 'int' }])).toBe(5)
    expect(unwrapValue(['hi', { s: 'string' }])).toBe('hi')
  })

  it('recurses through objects', () => {
    expect(unwrapValue({ a: [1, { s: 'int' }], b: 'x' })).toEqual({ a: 1, b: 'x' })
  })

  it('recurses through arrays', () => {
    expect(unwrapValue([[1, { s: 'int' }], [2, { s: 'int' }]])).toEqual([1, 2])
  })

  it('leaves primitives alone', () => {
    expect(unwrapValue(1)).toBe(1)
    expect(unwrapValue('x')).toBe('x')
    expect(unwrapValue(null)).toBeNull()
  })
})

describe('readState', () => {
  it('prefers component.ephemeral (Livewire 4)', () => {
    const comp = {
      ephemeral: { count: 5, name: 'foo' },
      canonical: { count: 3, name: 'stale' },
      data: { count: 1, name: 'older' },
      snapshot: { data: { count: 0 } }
    }
    expect(readState(comp)).toEqual({ count: 5, name: 'foo' })
  })

  it('falls through to canonical then data then snapshot.data', () => {
    expect(readState({ canonical: { a: 1 } })).toEqual({ a: 1 })
    expect(readState({ data: { a: [2, { s: 'int' }] } })).toEqual({ a: 2 })
    expect(readState({ snapshot: { data: { a: [3, { s: 'int' }] } } })).toEqual({ a: 3 })
  })

  it('returns empty for a bare component', () => {
    expect(readState({})).toEqual({})
  })
})

describe('extractChildIds', () => {
  it('uses the Livewire 4 children getter if present', () => {
    const comp = {
      children: [{ id: 'abc' }, { id: 'def' }]
    }
    expect(extractChildIds(comp)).toEqual(['abc', 'def'])
  })

  it('parses Livewire 4 memo.children as [tagName, id]', () => {
    const comp = {
      snapshot: {
        memo: {
          children: {
            __key1: ['div', 'child-id-abcdef-123'],
            __key2: ['span', 'child-id-xyz789-000']
          }
        }
      }
    }
    expect(extractChildIds(comp)).toEqual([
      'child-id-abcdef-123',
      'child-id-xyz789-000'
    ])
  })

  it('handles serverMemo.children (Livewire 3)', () => {
    const comp = {
      serverMemo: {
        children: {
          __a: ['longer-id-value-abc', 'counter']
        }
      }
    }
    // In Livewire 3 historical shape is [id, name] — first element looks like an ID.
    expect(extractChildIds(comp)).toEqual(['longer-id-value-abc'])
  })

  it('returns empty for a bare component', () => {
    expect(extractChildIds({})).toEqual([])
  })
})

describe('normalize', () => {
  it('produces a stable NormalizedComponent', () => {
    const raw = {
      id: 123,
      name: 'counter',
      el: null,
      ephemeral: { count: 5 },
      children: [{ id: 'child-abc-001' }]
    }
    const n = normalize(raw)
    expect(n.id).toBe('123')
    expect(n.name).toBe('counter')
    expect(n.data).toEqual({ count: 5 })
    expect(n.childIds).toEqual(['child-abc-001'])
    expect(n.raw).toBe(raw)
  })

  it('falls back to snapshot.memo.name when no direct name', () => {
    const n = normalize({ id: '1', snapshot: { memo: { name: 'memo-name' } } })
    expect(n.name).toBe('memo-name')
  })

  it('defaults to Anonymous', () => {
    expect(normalize({ id: '1' }).name).toBe('Anonymous')
  })
})

describe('wrapDispatch', () => {
  it('wraps Livewire.dispatch and forwards to the original', () => {
    const original = vi.fn((name: string, ...args: unknown[]) => `${name}:${args.join(',')}`)
    const L: any = { dispatch: original }
    const cb = vi.fn()
    wrapDispatch(L, cb)
    const result = L.dispatch('post-created', { id: 1 })
    expect(cb).toHaveBeenCalledWith('post-created', [{ id: 1 }])
    expect(original).toHaveBeenCalledWith('post-created', { id: 1 })
    expect(result).toBe('post-created:[object Object]')
  })

  it('appends to the wrap instead of wrapping twice', () => {
    const original = vi.fn()
    const L: any = { dispatch: original }
    const first = vi.fn()
    const second = vi.fn()
    wrapDispatch(L, first)
    wrapDispatch(L, second)
    L.dispatch('evt')
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('restores original when all listeners unsubscribe', () => {
    const original = vi.fn()
    const L: any = { dispatch: original }
    const stop1 = wrapDispatch(L, vi.fn())
    const stop2 = wrapDispatch(L, vi.fn())
    stop1()
    stop2()
    expect(L.dispatch).toBe(original)
  })

  it('is a no-op when Livewire.dispatch is missing', () => {
    const L: any = {}
    const stop = wrapDispatch(L, vi.fn())
    expect(stop).toBeTypeOf('function')
    expect(L.dispatch).toBeUndefined()
  })
})
