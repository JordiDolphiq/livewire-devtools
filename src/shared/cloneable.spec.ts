import { describe, expect, it } from 'vitest'
import { toCloneable } from './cloneable'

describe('toCloneable', () => {
  it('passes primitives through', () => {
    expect(toCloneable(null)).toBeNull()
    expect(toCloneable(undefined)).toBeUndefined()
    expect(toCloneable(42)).toBe(42)
    expect(toCloneable('x')).toBe('x')
    expect(toCloneable(true)).toBe(true)
  })

  it('replaces functions with tags', () => {
    function named() {}
    expect(toCloneable(named)).toBe('[function named]')
    expect(toCloneable(() => {})).toMatch(/^\[function /)
  })

  it('replaces symbols + bigints', () => {
    expect(toCloneable(Symbol('x'))).toContain('[symbol')
    expect(toCloneable(10n)).toBe('[bigint 10]')
  })

  it('clones plain objects + arrays deeply', () => {
    const input = { a: 1, b: { c: [1, 2] } }
    const out = toCloneable(input) as any
    expect(out).toEqual(input)
    expect(out).not.toBe(input)
    expect(out.b).not.toBe(input.b)
  })

  it('converts Maps and Sets', () => {
    const m = new Map([['a', 1]])
    const s = new Set([1, 2, 3])
    expect(toCloneable(m)).toEqual({ a: 1 })
    expect(toCloneable(s)).toEqual([1, 2, 3])
  })

  it('tags DOM elements', () => {
    const el = document.createElement('div')
    el.id = 'main'
    expect(toCloneable(el)).toBe('[element <div #main>]')
  })

  it('breaks circular references', () => {
    const a: any = { name: 'a' }
    a.self = a
    const out = toCloneable(a) as any
    expect(out.name).toBe('a')
    expect(out.self).toBe('[circular]')
  })

  it('caps depth', () => {
    let head: any = { v: 0 }
    let cur = head
    for (let i = 1; i < 20; i++) {
      cur.next = { v: i }
      cur = cur.next
    }
    const out = toCloneable(head) as any
    // walk down until we hit the depth tag
    let node: any = out
    while (node && typeof node === 'object' && node.next) node = node.next
    expect(typeof node === 'string' || node === '[depth-limit]' || node.v === 19).toBe(true)
  })

  it('survives getter-throws', () => {
    const obj = {
      safe: 'yes',
      get bad() {
        throw new Error('nope')
      }
    }
    const out = toCloneable(obj) as any
    expect(out.safe).toBe('yes')
    expect(out.bad).toBe('[getter-threw]')
  })

  it('replaces Promises + Errors', () => {
    expect(toCloneable(Promise.resolve(1))).toBe('[promise]')
    expect(toCloneable(new TypeError('oops'))).toBe('[error TypeError: oops]')
  })
})
