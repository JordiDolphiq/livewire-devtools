import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createPanelBridge } from './bridge'
import { useConnection } from './stores/connection'
import { useComponents } from './stores/components'
import { useEvents } from './stores/events'
import { useTimeline } from './stores/timeline'
import { useUi } from './stores/ui'

const tabIdParam = new URLSearchParams(location.search).get('tabId')
const tabId = Number(tabIdParam)

if (!Number.isFinite(tabId)) {
  document.body.innerText = 'Livewire DevTools: missing tabId.'
  throw new Error('Missing tabId query parameter')
}

const bridge = createPanelBridge(tabId)

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

const connection = useConnection(pinia)
const components = useComponents(pinia)
const events = useEvents(pinia)
const timeline = useTimeline(pinia)
const ui = useUi(pinia)

app.config.errorHandler = (err) => {
  const msg = err instanceof Error ? err.message : String(err)
  console.error('[livewire-devtools:panel]', err)
  connection.setError(msg)
}

if (chrome?.devtools?.panels?.themeName) {
  ui.setTheme(chrome.devtools.panels.themeName === 'dark' ? 'dark' : 'light')
}

bridge.on('ready', (payload) => {
  connection.setReady(payload)
})

bridge.on('flush', (payload) => {
  components.setFlush(payload)
})

bridge.on('event:triggered', (entry) => {
  events.append(entry)
})

bridge.on('timeline:mutation', (mutation) => {
  timeline.append(mutation)
})

bridge.on('inspect-instance', (id) => {
  components.select(id)
  ui.setTab('components')
  bridge.send('select-instance', id)
})

bridge.on('error', (payload) => {
  connection.setError(payload.message)
})

app.provide('bridge', bridge)
app.mount('#app')

bridge.send('init')
