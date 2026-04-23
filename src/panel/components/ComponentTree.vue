<script setup lang="ts">
import { computed, inject } from 'vue'
import { useComponents } from '../stores/components'
import type { ComponentTreeNode as TreeNode } from '@/shared/messages'
import type { PanelBridge } from '../bridge'
import ComponentTreeNode from './ComponentTreeNode.vue'

const components = useComponents()
const bridge = inject<PanelBridge>('bridge')!

const byId = computed(() => new Map(components.tree.map((n) => [n.id, n])))

const roots = computed<TreeNode[]>(() => {
  const childIds = new Set<string>()
  for (const node of components.tree) {
    for (const id of node.childIds) childIds.add(id)
  }
  return components.tree.filter((n) => !childIds.has(n.id))
})

function select(id: string) {
  components.select(id)
  bridge.send('select-instance', id)
}
function hoverIn(id: string) {
  bridge.send('enter-instance', id)
}
function hoverOut() {
  bridge.send('leave-instance')
}
</script>

<template>
  <ul class="tree-root">
    <ComponentTreeNode
      v-for="node in roots"
      :key="node.id"
      :node="node"
      :by-id="byId"
      :selected="components.selectedId"
      :depth="0"
      @select="select"
      @hover-in="hoverIn"
      @hover-out="hoverOut"
    />
    <li v-if="!roots.length" class="empty">No components detected.</li>
  </ul>
</template>

<style scoped>
.tree-root {
  list-style: none;
  margin: 0;
  padding: 0;
}
.empty {
  padding: 12px;
  color: #888;
  font-size: 12px;
}
</style>
