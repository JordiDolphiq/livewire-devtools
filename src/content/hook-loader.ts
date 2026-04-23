import hookUrl from '@/injected/hook.ts?script&module'

const script = document.createElement('script')
script.src = chrome.runtime.getURL(hookUrl)
script.type = 'module'
script.dataset.livewireDevtools = 'hook'
script.onload = () => script.remove()
script.onerror = (e) => console.error('[livewire-devtools] hook inject failed', e)
;(document.head || document.documentElement).appendChild(script)
