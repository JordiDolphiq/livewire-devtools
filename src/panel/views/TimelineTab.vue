<script setup lang="ts">
import { computed, inject } from 'vue'
import { useTimeline } from '../stores/timeline'
import StateInspector from '../components/StateInspector.vue'
import type { PanelBridge } from '../bridge'
import type { ComponentDetails } from '@/shared/messages'

const timeline = useTimeline()
const bridge = inject<PanelBridge>('bridge')!

const selected = computed(() => timeline.mutations.find((m) => m.id === timeline.selectedId) ?? null)

const selectedDetails = computed<ComponentDetails | null>(() => {
  if (!selected.value) return null
  return {
    id: selected.value.componentId,
    name: selected.value.componentName,
    state: selected.value.state
  }
})

function travel() {
  const m = selected.value
  if (!m) return
  bridge.send('timeline:travel-to-state', {
    componentId: m.componentId,
    state: m.state
  })
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString() + '.' + String(d.getMilliseconds()).padStart(3, '0')
}
</script>

<template>
  <section class="columns">
    <div class="pane list">
      <div class="toolbar">
        <button class="btn" @click="timeline.toggleRecording">
          {{ timeline.recording ? 'Pause' : 'Resume' }}
        </button>
        <button class="btn" @click="timeline.clear">Clear</button>
        <button class="btn" :disabled="!selected" @click="travel">
          Travel to state
        </button>
        <span class="count">{{ timeline.mutations.length }}</span>
      </div>
      <p v-if="!timeline.mutations.length" class="empty">
        No state changes yet. Modify a Livewire component to capture a mutation.
      </p>
      <ul v-else class="rows">
        <li
          v-for="m in timeline.mutations"
          :key="m.id"
          :class="{ selected: m.id === timeline.selectedId }"
          @click="timeline.select(m.id)"
        >
          <span class="name">{{ m.componentName }}</span>
          <span class="id">{{ m.componentId.slice(0, 8) }}</span>
          <span class="ts">{{ fmtTime(m.timestamp) }}</span>
        </li>
      </ul>
    </div>
    <div class="pane details">
      <StateInspector :details="selectedDetails" :editable="false" />
    </div>
  </section>
</template>

<style scoped>
.columns {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(320px, 50%) 1fr;
  overflow: hidden;
}
.pane {
  overflow: auto;
  background: var(--bg-color);
}
.pane.list {
  border-right: 1px solid var(--border-color);
}
.toolbar {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 4px 8px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.02);
}
.btn {
  border: 1px solid var(--border-color);
  background: transparent;
  color: inherit;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 3px;
  cursor: pointer;
}
.btn:hover:not(:disabled) {
  border-color: var(--accent-color);
}
.btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.count {
  font-size: 11px;
  color: #888;
  margin-left: auto;
}
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
}
.rows li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  align-items: baseline;
}
.rows li:hover {
  background: rgba(49, 130, 206, 0.08);
}
.rows li.selected {
  background: rgba(49, 130, 206, 0.18);
}
.rows .id,
.rows .ts {
  color: #888;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}
.empty {
  padding: 12px;
  color: #888;
  font-size: 12px;
}
</style>
