import { Bridge, type BridgeWall } from '@/shared/bridge'
import type { BackendToPanel, PanelToBackend } from '@/shared/messages'

export type PanelBridge = Bridge<BackendToPanel, PanelToBackend>

export function createPanelBridge(tabId: number): PanelBridge {
  let port: chrome.runtime.Port | null = null
  let listenerFn: ((msg: any) => void) | null = null

  const connect = () => {
    port = chrome.runtime.connect({ name: String(tabId) })
    port.onMessage.addListener((msg) => {
      listenerFn?.(msg)
    })
    port.onDisconnect.addListener(() => {
      port = null
      setTimeout(connect, 500)
    })
  }

  const wall: BridgeWall = {
    listen(fn) {
      listenerFn = fn
    },
    send(msg) {
      if (!port) connect()
      try {
        port?.postMessage(msg)
      } catch {
        connect()
        try {
          port?.postMessage(msg)
        } catch {
          /* give up for this tick */
        }
      }
    }
  }

  connect()
  return new Bridge(wall)
}
