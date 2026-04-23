import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ComponentDetails, ComponentTreeNode } from '@/shared/messages'

export const useComponents = defineStore('components', () => {
  const tree = ref<ComponentTreeNode[]>([])
  const selectedId = ref<string | null>(null)
  const inspected = ref<ComponentDetails | null>(null)
  const filter = ref('')

  const flat = computed(() => {
    const out: ComponentTreeNode[] = []
    const byId = new Map(tree.value.map((n) => [n.id, n]))
    for (const node of tree.value) out.push(node)
    return { list: out, byId }
  })

  function setFlush(payload: { tree: ComponentTreeNode[]; inspected: ComponentDetails | null }) {
    tree.value = payload.tree
    inspected.value = payload.inspected
  }

  function select(id: string | null) {
    selectedId.value = id
  }

  function setFilter(value: string) {
    filter.value = value
  }

  return { tree, selectedId, inspected, filter, flat, setFlush, select, setFilter }
})
