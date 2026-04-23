import detectorUrl from '@/injected/detector.ts?script&module'
import backendUrl from '@/injected/backend.ts?script&module'
import { PAGE_SOURCE, CONTENT_SOURCE } from '@/shared/constants'

let backendInjected = false

function injectPageScript(url: string) {
  const script = document.createElement('script')
  script.src = chrome.runtime.getURL(url)
  script.type = 'module'
  script.onload = () => script.remove()
  ;(document.head || document.documentElement).appendChild(script)
}

function injectBackendOnce() {
  if (backendInjected) return
  backendInjected = true
  injectPageScript(backendUrl)
}

// Inject detector in the page world so it can see window.Livewire.
injectPageScript(detectorUrl)

// page -> service worker (forward anything the page emits)
window.addEventListener('message', (event) => {
  if (event.source !== window) return
  const data = event.data
  if (!data || data.source !== PAGE_SOURCE) return
  try {
    chrome.runtime.sendMessage(data.message)
  } catch {
    // service worker asleep; let the panel retry
  }
})

// service worker -> page (forward anything the panel sends)
chrome.runtime.onMessage.addListener((message) => {
  if (!message || typeof message !== 'object') return
  if ((message as { event?: string }).event === 'init') {
    injectBackendOnce()
  }
  window.postMessage({ source: CONTENT_SOURCE, message }, '*')
})
