import detectorUrl from '@/injected/detector.ts?script&module'
import backendUrl from '@/injected/backend.ts?script&module'
import { PAGE_SOURCE, CONTENT_SOURCE } from '@/shared/constants'

console.log('[livewire-devtools] content proxy ready')

let backendInjected = false

function injectPageScript(url: string, tag: string) {
  const script = document.createElement('script')
  script.src = chrome.runtime.getURL(url)
  script.type = 'module'
  script.dataset.livewireDevtools = tag
  script.onload = () => script.remove()
  script.onerror = (e) =>
    console.error(`[livewire-devtools] ${tag} inject failed`, e, script.src)
  ;(document.head || document.documentElement).appendChild(script)
}

function injectBackendOnce() {
  if (backendInjected) return
  backendInjected = true
  console.log('[livewire-devtools] injecting backend')
  injectPageScript(backendUrl, 'backend')
}

injectPageScript(detectorUrl, 'detector')

window.addEventListener('message', (event) => {
  if (event.source !== window) return
  const data = event.data
  if (!data || data.source !== PAGE_SOURCE) return
  try {
    chrome.runtime.sendMessage(data.message)
  } catch {
    /* service worker asleep */
  }
})

chrome.runtime.onMessage.addListener((message) => {
  if (!message || typeof message !== 'object') return
  if ((message as { event?: string }).event === 'init') {
    injectBackendOnce()
  }
  window.postMessage({ source: CONTENT_SOURCE, message }, '*')
})
