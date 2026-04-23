import { describe, expect, it } from 'vitest'
import { detectAlpine, detectLivewireVersion, isDevToolsEnabled } from './detect'

describe('detectLivewireVersion', () => {
  it('returns 4 when Livewire.interceptMessage exists', () => {
    expect(detectLivewireVersion({ interceptMessage: () => {}, all: () => [], hook: () => {} })).toBe(4)
  })

  it('returns 4 when interceptRequest exists', () => {
    expect(detectLivewireVersion({ interceptRequest: () => {} })).toBe(4)
  })

  it('returns 3 when .all + .hook exist without intercept APIs', () => {
    expect(detectLivewireVersion({ all: () => [], hook: () => {} })).toBe(3)
  })

  it('returns 3 when first() returns a snapshot-having component', () => {
    expect(detectLivewireVersion({ first: () => ({ snapshot: {} }) })).toBe(3)
  })

  it('throws on pre-3 Livewire / nothing recognisable', () => {
    expect(() => detectLivewireVersion({})).toThrow()
    expect(() => detectLivewireVersion(null)).toThrow()
  })
})

describe('detectAlpine', () => {
  it('reports present with version when window.Alpine exists', () => {
    const win = { Alpine: { version: '3.15.0' } } as unknown as Window
    expect(detectAlpine(win)).toEqual({ present: true, version: '3.15.0' })
  })

  it('reports absent when window.Alpine is missing', () => {
    expect(detectAlpine({} as unknown as Window)).toEqual({
      present: false,
      version: null
    })
  })

  it('reports present: true but null version when Alpine has no .version', () => {
    const win = { Alpine: {} } as unknown as Window
    expect(detectAlpine(win)).toEqual({ present: true, version: null })
  })
})

describe('isDevToolsEnabled', () => {
  it('true when devToolsEnabled is undefined (v3/v4 default)', () => {
    expect(isDevToolsEnabled({})).toBe(true)
  })
  it('true when explicitly true', () => {
    expect(isDevToolsEnabled({ devToolsEnabled: true })).toBe(true)
  })
  it('false only when explicitly false', () => {
    expect(isDevToolsEnabled({ devToolsEnabled: false })).toBe(false)
  })
})
