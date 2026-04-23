<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useConnection } from '../stores/connection'
import { useUi, type Tab } from '../stores/ui'
import type { PanelBridge } from '../bridge'

const connection = useConnection()
const ui = useUi()
const bridge = inject<PanelBridge>('bridge')!

const refreshing = ref(false)

const alpineBadge = computed(() => {
  if (!connection.alpine.present) return null
  return connection.alpine.version ? `Alpine ${connection.alpine.version}` : 'Alpine'
})

const tabs: { id: Tab; label: string }[] = [
  { id: 'components', label: 'Components' },
  { id: 'events', label: 'Events' },
  { id: 'timeline', label: 'Timeline' }
]

function setTab(id: Tab) {
  ui.setTab(id)
}

function refresh() {
  if (refreshing.value) return
  refreshing.value = true
  bridge.send('refresh')
  setTimeout(() => {
    refreshing.value = false
  }, 500)
}

defineExpose({ refresh })
</script>

<template>
  <header class="header">
    <span class="logo">Livewire DevTools</span>
    <span v-if="connection.livewireVersion" class="badge livewire">
      v{{ connection.livewireVersion }}
    </span>
    <span v-if="alpineBadge" class="badge alpine">{{ alpineBadge }}</span>

    <nav class="tabs">
      <button
        v-for="t in tabs"
        :key="t.id"
        :class="{ tab: true, active: ui.tab === t.id }"
        @click="setTab(t.id)"
      >
        {{ t.label }}
      </button>
    </nav>

    <span class="spacer" />
    <button
      class="btn"
      :class="{ refreshing }"
      :disabled="refreshing"
      title="Refresh"
      @click="refresh"
    >
      {{ refreshing ? 'Refreshing…' : 'Refresh' }}
    </button>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-color);
}
.logo {
  font-weight: 600;
  font-size: 13px;
}
.badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 9px;
  background: var(--accent-color);
  color: #fff;
}
.badge.alpine {
  background: #8b5cf6;
}
.tabs {
  display: flex;
  gap: 2px;
  margin-left: 8px;
}
.tab {
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.tab:hover {
  background: rgba(49, 130, 206, 0.08);
}
.tab.active {
  border-color: var(--border-color);
  background: rgba(49, 130, 206, 0.12);
  color: var(--accent-color);
  font-weight: 500;
}
.spacer {
  flex: 1;
}
.btn {
  border: 1px solid var(--border-color);
  background: transparent;
  color: inherit;
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.btn:hover:not(:disabled) {
  border-color: var(--accent-color);
}
.btn.refreshing {
  opacity: 0.6;
  cursor: progress;
}
</style>
