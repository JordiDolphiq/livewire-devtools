import hookUrl from '@/injected/hook.ts?script&module'

const script = document.createElement('script')
script.src = chrome.runtime.getURL(hookUrl)
script.type = 'module'
script.onload = () => script.remove()
;(document.head || document.documentElement).appendChild(script)
