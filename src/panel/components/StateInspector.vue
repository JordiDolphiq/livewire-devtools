<script setup lang="ts">
import { computed } from 'vue'
import DataField from './DataField.vue'
import type { ComponentDetails } from '@/shared/messages'

const props = defineProps<{
  details: ComponentDetails | null
  editable?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', payload: { path: string; value: unknown }): void
}>()

const entries = computed(() => {
  if (!props.details) return []
  return Object.entries(props.details.state).map(([key, value]) => ({ key, value }))
})

function onEdit(payload: { path: string; value: unknown }) {
  emit('edit', payload)
}
</script>

<template>
  <div class="inspector">
    <header v-if="details" class="hdr">
      <span class="name">{{ details.name }}</span>
      <span class="id">{{ details.id.slice(0, 12) }}</span>
    </header>
    <p v-if="!details" class="empty">Select a component to inspect.</p>
    <ul v-else-if="!entries.length" class="empty">
      <li>No public properties.</li>
    </ul>
    <div v-else class="fields">
      <DataField
        v-for="entry in entries"
        :key="entry.key"
        :field-key="entry.key"
        :value="entry.value"
        :editable="editable"
        @edit="onEdit"
      />
    </div>
  </div>
</template>

<style scoped>
.inspector {
  height: 100%;
  overflow: auto;
}
.hdr {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 6px 12px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.02);
}
.name {
  font-weight: 500;
  font-size: 12px;
}
.id {
  color: #888;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}
.empty {
  padding: 12px;
  color: #888;
  font-size: 12px;
  list-style: none;
  margin: 0;
}
.fields {
  padding: 6px 0;
}
</style>
