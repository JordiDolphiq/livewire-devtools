import { beforeEach, vi } from 'vitest'

// Minimal chrome.* shim so panel stores that touch `chrome?.devtools…` don't throw.
;(globalThis as any).chrome = {
  runtime: {
    connect: vi.fn(() => ({
      onMessage: { addListener: vi.fn() },
      onDisconnect: { addListener: vi.fn() },
      postMessage: vi.fn(),
      disconnect: vi.fn()
    })),
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
    getManifest: vi.fn(() => ({ web_accessible_resources: [] })),
    getURL: vi.fn((p: string) => `chrome-extension://test/${p}`)
  },
  devtools: {
    panels: { themeName: 'default', create: vi.fn() },
    inspectedWindow: { tabId: 1 }
  },
  action: {
    setIcon: vi.fn().mockResolvedValue(undefined),
    setPopup: vi.fn().mockResolvedValue(undefined)
  },
  tabs: {
    sendMessage: vi.fn().mockResolvedValue(undefined),
    onRemoved: { addListener: vi.fn() },
    onUpdated: { addListener: vi.fn() }
  },
  contextMenus: {
    create: vi.fn(),
    removeAll: vi.fn((cb?: () => void) => cb?.()),
    onClicked: { addListener: vi.fn() }
  },
  scripting: { executeScript: vi.fn().mockResolvedValue([]) }
}

beforeEach(() => {
  vi.clearAllMocks()
})
