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

chrome.runtime.onInstalled.addListener(ensureContextMenu)
chrome.runtime.onStartup.addListener(ensureContextMenu)
ensureContextMenu()

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return
  const tabId = tab?.id
  if (typeof tabId !== 'number') return
  chrome.tabs.sendMessage(tabId, { event: 'get-context-menu-target' }).catch(() => {})
})

chrome.runtime.onConnect.addListener((port) => {
  const tabId = Number(port.name)
  if (!Number.isFinite(tabId)) return

  ports.set(tabId, port)

  port.onMessage.addListener((message) => {
    chrome.tabs.sendMessage(tabId, message).catch(() => {
      try {
        port.postMessage({ event: 'proxy-fail' })
      } catch {
        /* port closed */
      }
    })
  })

  port.onDisconnect.addListener(() => {
    if (ports.get(tabId) === port) ports.delete(tabId)
  })
})

chrome.runtime.onMessage.addListener((message, sender) => {
  const tabId = sender.tab?.id
  if (typeof tabId !== 'number') return

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== 'loading') return
  resetIcon(tabId)
})

function setIcon(tabId: number, enabled: boolean) {
  const suffix = enabled ? '' : '-gray'
  chrome.action.setIcon({
    tabId,
    path: {
      16: `icons/16${suffix}.png`,
      48: `icons/48${suffix}.png`,
      128: `icons/128${suffix}.png`
    }
  })
  chrome.action.setPopup({
    tabId,
    popup: enabled ? 'src/popup/enabled.html' : 'src/popup/disabled.html'
  })
}

function resetIcon(tabId: number) {
  chrome.action.setIcon({
    tabId,
    path: {
      16: 'icons/16-gray.png',
      48: 'icons/48-gray.png',
      128: 'icons/128-gray.png'
    }
  })
  chrome.action.setPopup({ tabId, popup: 'src/popup/not-found.html' })
}
