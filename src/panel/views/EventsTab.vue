<script setup lang="ts">
import { computed } from 'vue'
import { useEvents } from '../stores/events'

const events = useEvents()

const selected = computed(() => events.entries.find((e) => e.id === events.selectedId) ?? null)

function fmtTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString() + '.' + String(d.getMilliseconds()).padStart(3, '0')
}
</script>

<template>
  <section class="columns">
    <div class="pane list">
      <div class="toolbar">
        <button class="btn" @click="events.toggleRecording">
          {{ events.recording ? 'Pause' : 'Resume' }}
        </button>
        <button class="btn" @click="events.clear">Clear</button>
        <span class="count">{{ events.entries.length }}</span>
      </div>
      <p v-if="!events.entries.length" class="empty">
        No events yet. Dispatch any event from Livewire to see it here.
      </p>
      <ul v-else class="rows">
        <li
          v-for="entry in events.entries"
          :key="entry.id"
          :class="{ selected: entry.id === events.selectedId }"
          @click="events.select(entry.id)"
        >
          <span class="name">{{ entry.name }}</span>
          <span class="ts">{{ fmtTime(entry.timestamp) }}</span>
        </li>
      </ul>
    </div>
    <div class="pane details">
      <p v-if="!selected" class="empty">Select an event to inspect.</p>
      <template v-else>
        <div class="hdr">
          <span class="name">{{ selected.name }}</span>
          <span class="ts">{{ fmtTime(selected.timestamp) }}</span>
        </div>
        <pre class="payload">{{ JSON.stringify(selected.payload, null, 2) }}</pre>
      </template>
    </div>
  </section>
</template>

<style scoped>
.columns {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(260px, 45%) 1fr;
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
.btn:hover {
  border-color: var(--accent-color);
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
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}
.rows li:hover {
  background: rgba(49, 130, 206, 0.08);
}
.rows li.selected {
  background: rgba(49, 130, 206, 0.18);
}
.rows .ts {
  color: #888;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  margin-left: 8px;
}
.empty {
  padding: 12px;
  color: #888;
  font-size: 12px;
}
.hdr {
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.02);
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.hdr .name {
  font-weight: 500;
  font-size: 12px;
}
.hdr .ts {
  color: #888;
  font-size: 11px;
}
.payload {
  padding: 10px 12px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}
</style>
