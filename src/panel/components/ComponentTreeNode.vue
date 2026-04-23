<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentTreeNode } from '@/shared/messages'

const props = defineProps<{
  node: ComponentTreeNode
  byId: Map<string, ComponentTreeNode>
  selected: string | null
  depth: number
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'hover-in', id: string): void
  (e: 'hover-out'): void
}>()

const children = computed(() =>
  props.node.childIds
    .map((id) => props.byId.get(id))
    .filter((c): c is ComponentTreeNode => !!c)
)

const isSelected = computed(() => props.selected === props.node.id)
</script>

<template>
  <li>
    <div
      :class="['row', { selected: isSelected }]"
      :style="{ paddingLeft: `${depth * 14 + 10}px` }"
      @click="emit('select', node.id)"
      @mouseenter="emit('hover-in', node.id)"
      @mouseleave="emit('hover-out')"
    >
      <span class="name">{{ node.name }}</span>
      <span class="id">{{ node.id.slice(0, 8) }}</span>
    </div>
    <ul v-if="children.length" class="children">
      <ComponentTreeNode
        v-for="child in children"
        :key="child.id"
        :node="child"
        :by-id="byId"
        :selected="selected"
        :depth="depth + 1"
        @select="(id) => emit('select', id)"
        @hover-in="(id) => emit('hover-in', id)"
        @hover-out="emit('hover-out')"
      />
    </ul>
  </li>
</template>

<style scoped>
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  padding: 3px 10px;
}
.row:hover {
  background: rgba(49, 130, 206, 0.08);
}
.row.selected {
  background: rgba(49, 130, 206, 0.18);
}
.name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.id {
  color: #888;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  margin-left: 8px;
}
.children {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
