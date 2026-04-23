<script setup lang="ts">
import { inject } from 'vue'
import { useComponents } from '../stores/components'
import ComponentTree from '../components/ComponentTree.vue'
import StateInspector from '../components/StateInspector.vue'
import type { PanelBridge } from '../bridge'

const components = useComponents()
const bridge = inject<PanelBridge>('bridge')!

function onFilter(e: Event) {
  const value = (e.target as HTMLInputElement).value
  components.setFilter(value)
  bridge.send('filter-instances', value)
}

function onEdit({ path, value }: { path: string; value: unknown }) {
  if (!components.inspected) return
  bridge.send('set-instance-data', {
    id: components.inspected.id,
    path,
    value
  })
}
</script>

<template>
  <section class="columns">
    <div class="pane tree">
      <div class="toolbar">
        <input
          type="search"
          placeholder="Filter components"
          :value="components.filter"
          @input="onFilter"
          class="filter"
        />
        <span class="count">{{ components.tree.length }}</span>
      </div>
      <ComponentTree />
    </div>
    <div class="pane inspect">
      <StateInspector
        :details="components.inspected"
        :editable="true"
        @edit="onEdit"
      />
    </div>
  </section>
</template>

<style scoped>
.columns {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(220px, 40%) 1fr;
  overflow: hidden;
}
.pane {
  overflow: auto;
  background: var(--bg-color);
}
.pane.tree {
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
.filter {
  flex: 1;
  padding: 3px 6px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  background: var(--bg-color);
  color: inherit;
}
.count {
  font-size: 11px;
  color: #888;
}
</style>
