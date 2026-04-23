import { describe, expect, it, vi } from 'vitest'
import { Bridge, type BridgeWall } from './bridge'

type In = { event: 'hi'; payload: string } | { event: 'bye' }
type Out = { event: 'ping'; payload: number }

function makeWall() {
  let onMsg: ((msg: unknown) => void) | null = null
  const wall: BridgeWall = {
    listen(fn) {
      onMsg = fn as any
    },
    send: vi.fn()
  }
  return {
    wall,
    deliver(msg: unknown) {
      onMsg?.(msg)
    }
  }
}

describe('Bridge', () => {
  it('routes incoming messages to matching listeners', () => {
    const { wall, deliver } = makeWall()
    const bridge = new Bridge<In, Out>(wall)
    const cb = vi.fn()
    bridge.on('hi', cb)
    deliver({ event: 'hi', payload: 'world' })
    expect(cb).toHaveBeenCalledWith('world')
  })

  it('ignores non-object/unknown events', () => {
    const { wall, deliver } = makeWall()
    const bridge = new Bridge<In, Out>(wall)
    const cb = vi.fn()
    bridge.on('hi', cb)
    deliver(null)
    deliver({ event: 'other' })
    deliver('not an object')
    expect(cb).not.toHaveBeenCalled()
  })

  it('unsubscribe from on() stops delivery', () => {
    const { wall, deliver } = makeWall()
    const bridge = new Bridge<In, Out>(wall)
    const cb = vi.fn()
    const off = bridge.on('bye', cb)
    deliver({ event: 'bye' })
    off()
    deliver({ event: 'bye' })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('off(event) removes all listeners for an event', () => {
    const { wall, deliver } = makeWall()
    const bridge = new Bridge<In, Out>(wall)
    const a = vi.fn()
    const b = vi.fn()
    bridge.on('hi', a)
    bridge.on('hi', b)
    bridge.off('hi')
    deliver({ event: 'hi', payload: 'x' })
    expect(a).not.toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
  })

  it('send() forwards via the wall', () => {
    const { wall } = makeWall()
    const bridge = new Bridge<In, Out>(wall)
    bridge.send('ping', 42)
    expect(wall.send).toHaveBeenCalledWith({ event: 'ping', payload: 42 })
  })

  it('isolates listener errors', () => {
    const { wall, deliver } = makeWall()
    const bridge = new Bridge<In, Out>(wall)
    const good = vi.fn()
    bridge.on('hi', () => {
      throw new Error('bad')
    })
    bridge.on('hi', good)
    deliver({ event: 'hi', payload: 'x' })
    expect(good).toHaveBeenCalled()
  })
})
