<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  fieldKey: string
  value: unknown
  editable?: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', payload: { path: string; value: unknown }): void
}>()

const editing = ref(false)
const draft = ref('')

const kind = computed<'string' | 'number' | 'boolean' | 'null' | 'object' | 'array' | 'other'>(() => {
  const v = props.value
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  const t = typeof v
  if (t === 'string') return 'string'
  if (t === 'number') return 'number'
  if (t === 'boolean') return 'boolean'
  if (t === 'object') return 'object'
  return 'other'
})

const display = computed(() => {
  const v = props.value
  if (v === null) return 'null'
  if (typeof v === 'string') return `"${v}"`
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return `Array(${v.length})`
  if (typeof v === 'object') return `{${Object.keys(v as object).length} keys}`
  return String(v)
})

function startEdit() {
  if (!props.editable) return
  if (kind.value === 'object' || kind.value === 'array') return
  draft.value = typeof props.value === 'string' ? (props.value as string) : JSON.stringify(props.value)
  editing.value = true
}

function commit() {
  const raw = draft.value
  let parsed: unknown = raw
  try {
    if (kind.value === 'number') parsed = Number(raw)
    else if (kind.value === 'boolean') parsed = raw === 'true'
    else if (kind.value === 'null') parsed = null
    else if (kind.value === 'string') parsed = raw
    else parsed = JSON.parse(raw)
  } catch {
    editing.value = false
    return
  }
  emit('edit', { path: props.fieldKey, value: parsed })
  editing.value = false
}

watch(
  () => props.value,
  () => {
    editing.value = false
  }
)
</script>

<template>
  <div class="field">
    <span class="key">{{ fieldKey }}</span>
    <span class="colon">:</span>
    <template v-if="editing">
      <input
        v-model="draft"
        class="input"
        @keyup.enter="commit"
        @keyup.esc="editing = false"
        @blur="commit"
        autofocus
      />
    </template>
    <template v-else>
      <span
        :class="['value', kind]"
        :title="editable ? 'Click to edit' : ''"
        @click="startEdit"
      >
        {{ display }}
      </span>
    </template>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  padding: 2px 12px;
}
.key {
  color: var(--accent-color);
}
.value {
  cursor: pointer;
}
.value.string {
  color: #2f855a;
}
.value.number {
  color: #d69e2e;
}
.value.boolean {
  color: #805ad5;
}
.value.null {
  color: #718096;
  font-style: italic;
}
.value.object,
.value.array {
  color: #718096;
  cursor: default;
}
.input {
  font-family: inherit;
  font-size: inherit;
  padding: 2px 4px;
  border: 1px solid var(--accent-color);
  border-radius: 3px;
  background: var(--bg-color);
  color: inherit;
  flex: 1;
  max-width: 300px;
}
</style>
