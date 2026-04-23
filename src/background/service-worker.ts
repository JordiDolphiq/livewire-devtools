type PortMap = Map<number, chrome.runtime.Port>

const ports: PortMap = new Map()

const CONTEXT_MENU_ID = 'livewire-inspect'

function ensureContextMenu() {
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: 'Inspect Livewire component',
        contexts: ['all']
      })
    })
  } catch {
    /* noop */
  }
}

function validTabId(id: number | undefined | null): id is number {
  return typeof id === 'number' && Number.isFinite(id) && id >= 0
}

function safeSendMessage(tabId: number, msg: unknown): void {
  if (!validTabId(tabId)) return
  try {
    const result = chrome.tabs.sendMessage(tabId, msg)
    // MV3 returns a Promise. Swallow rejections — the target may not have
    // a content script (chrome://, about:, extension pages, etc.).
    if (result && typeof (result as Promise<unknown>).catch === 'function') {
      ;(result as Promise<unknown>).catch(() => {})
    }
  } catch {
    /* synchronous throws (bad tabId, scheme check) */
  }
}

chrome.runtime.onInstalled.addListener(ensureContextMenu)
chrome.runtime.onStartup.addListener(ensureContextMenu)
ensureContextMenu()

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return
  const tabId = tab?.id
  if (!validTabId(tabId)) return
  safeSendMessage(tabId, { event: 'get-context-menu-target' })
})

chrome.runtime.onConnect.addListener((port) => {
  const tabId = Number(port.name)
  if (!validTabId(tabId)) {
    try {
      port.disconnect()
    } catch {
      /* noop */
    }
    return
  }

  ports.set(tabId, port)

  port.onMessage.addListener((message) => {
    if (!validTabId(tabId)) return
    safeSendMessage(tabId, message)
  })

  port.onDisconnect.addListener(() => {
    if (ports.get(tabId) === port) ports.delete(tabId)
  })
})

chrome.runtime.onMessage.addListener((message, sender) => {
  const tabId = sender.tab?.id
  if (!validTabId(tabId)) return

  if (message?.event === 'livewire:detected') {
    setIcon(tabId, message.payload?.devToolsEnabled !== false)
  }

  const port = ports.get(tabId)
  if (!port) return
  try {
    port.postMessage(message)
  } catch {
    ports.delete(tabId)
  }
})

chrome.tabs.onRemoved.addListener((tabId) => {
  ports.delete(tabId)
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return
  if (!validTabId(tabId)) return
  const url = tab?.url ?? ''
  if (!/^https?:/i.test(url)) return
  resetIcon(tabId)
})

function setIcon(tabId: number, enabled: boolean) {
  if (!validTabId(tabId)) return
  const suffix = enabled ? '' : '-gray'
  chrome.action
    .setIcon({
      tabId,
      path: {
        16: `icons/16${suffix}.png`,
        48: `icons/48${suffix}.png`,
        128: `icons/128${suffix}.png`
      }
    })
    .catch(() => {})
  chrome.action
    .setPopup({
      tabId,
      popup: enabled ? 'src/popup/enabled.html' : 'src/popup/disabled.html'
    })
    .catch(() => {})
}

function resetIcon(tabId: number) {
  if (!validTabId(tabId)) return
  chrome.action
    .setIcon({
      tabId,
      path: {
        16: 'icons/16-gray.png',
        48: 'icons/48-gray.png',
        128: 'icons/128-gray.png'
      }
    })
    .catch(() => {})
  chrome.action
    .setPopup({ tabId, popup: 'src/popup/not-found.html' })
    .catch(() => {})
}
