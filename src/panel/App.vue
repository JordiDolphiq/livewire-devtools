<script setup lang="ts">
import { computed } from 'vue'
import { useConnection } from './stores/connection'
import { useUi } from './stores/ui'
import Header from './components/Header.vue'
import ComponentsTab from './views/ComponentsTab.vue'
import EventsTab from './views/EventsTab.vue'
import TimelineTab from './views/TimelineTab.vue'

const connection = useConnection()
const ui = useUi()

const statusMessage = computed(() => {
  if (connection.lastError) return `Error: ${connection.lastError}`
  if (!connection.ready) return 'Waiting for Livewire to initialize on this page...'
  return null
})
</script>

<template>
  <main class="panel">
    <Header />
    <section v-if="statusMessage" class="status">
      <p>{{ statusMessage }}</p>
    </section>
    <ComponentsTab v-else-if="ui.tab === 'components'" />
    <EventsTab v-else-if="ui.tab === 'events'" />
    <TimelineTab v-else-if="ui.tab === 'timeline'" />
  </main>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
.status {
  padding: 24px;
  font-size: 13px;
  color: #888;
  text-align: center;
}
</style>
